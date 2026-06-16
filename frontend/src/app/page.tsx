'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { EngineStatus, SimulateStartResponse, SimulateNextResponse } from '@/lib/types';
import { RULGauge } from '@/components/RULGauge';
import { SensorChart } from '@/components/SensorChart';
import { AlertCard } from '@/components/AlertCard';
import { FeatureImportance } from '@/components/FeatureImportance';
import { WhatIfAnalyzer } from '@/components/WhatIfAnalyzer';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface SimulationState {
  isRunning: boolean;
  sessionId: string | null;
  currentCycle: number;
  totalCycles: number;
  currentRul: number;
  currentSensors: number[];
  sensorHistory: number[][];
  topSensors: any[];
}

export default function Home() {
  const [engines, setEngines] = useState<EngineStatus[]>([]);
  const [selectedEngine, setSelectedEngine] = useState<EngineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const [simulation, setSimulation] = useState<SimulationState>({
    isRunning: false,
    sessionId: null,
    currentCycle: 0,
    totalCycles: 0,
    currentRul: 0,
    currentSensors: [],
    sensorHistory: [],
    topSensors: [],
  });

  // Load fleet on mount
  useEffect(() => {
    async function loadFleet() {
      try {
        setLoading(true);
        const data = await api.fleet();
        setEngines(data);
        if (data.length > 0) {
          setSelectedEngine(data[2]); // Default to ENG-003
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fleet');
      } finally {
        setLoading(false);
      }
    }
    loadFleet();
  }, []);

  // Simulation loop
  useEffect(() => {
    if (!simulation.isRunning || !simulation.sessionId) return;

    const timer = setInterval(async () => {
      try {
        const nextData: SimulateNextResponse = await api.simulateNext(simulation.sessionId!);

        setSimulation((prev) => {
          const newHistory = [...prev.sensorHistory, nextData.sensors];
          return {
            ...prev,
            currentCycle: nextData.cycle,
            currentRul: nextData.rul,
            currentSensors: nextData.sensors,
            sensorHistory: newHistory.slice(-30), // Keep last 30
            isRunning: !nextData.done,
          };
        });

        if (nextData.done) {
          setSimulation((prev) => ({ ...prev, isRunning: false }));
        }
      } catch (err) {
        console.error('Simulation error:', err);
        setSimulation((prev) => ({ ...prev, isRunning: false }));
      }
    }, 1000); // 1 second between cycles

    return () => clearInterval(timer);
  }, [simulation.isRunning, simulation.sessionId]);

  const startSimulation = async () => {
    try {
      const startResp: SimulateStartResponse = await api.simulateStart({ scenario: 'degrading' });
      setSimulation({
        isRunning: true,
        sessionId: startResp.session_id,
        currentCycle: 0,
        totalCycles: startResp.total_cycles,
        currentRul: 125,
        currentSensors: [],
        sensorHistory: [],
        topSensors: [],
      });
      setAlertDismissed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start simulation');
    }
  };

  const pauseSimulation = () => {
    setSimulation((prev) => ({ ...prev, isRunning: false }));
  };

  const resetSimulation = () => {
    setSimulation({
      isRunning: false,
      sessionId: null,
      currentCycle: 0,
      totalCycles: 0,
      currentRul: 0,
      currentSensors: [],
      sensorHistory: [],
      topSensors: [],
    });
    setAlertDismissed(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-aerospace-darker flex items-center justify-center">
        <div className="text-aerospace-accent text-xl">Loading fleet...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-aerospace-darker flex items-center justify-center">
        <div className="text-aerospace-alert text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-aerospace-darker p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🛫 Predictive Maintenance</h1>
          <p className="text-gray-400">Real-time turbofan engine RUL monitoring & prediction</p>
        </div>

        {/* Fleet Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Fleet Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {engines.map((engine) => (
              <button
                key={engine.engine_id}
                onClick={() => {
                  setSelectedEngine(engine);
                  resetSimulation();
                }}
                className={`text-left bg-aerospace-dark border rounded-lg p-4 transition-all hover:border-aerospace-accent/50 ${
                  selectedEngine?.engine_id === engine.engine_id
                    ? 'border-aerospace-accent/80 shadow-lg shadow-aerospace-accent/20'
                    : 'border-aerospace-accent/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{engine.engine_id}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      engine.status === 'OK'
                        ? 'bg-aerospace-success/20 text-aerospace-success'
                        : engine.status === 'WARNING'
                        ? 'bg-aerospace-alert/20 text-aerospace-alert'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {engine.status}
                  </span>
                </div>
                <div className="text-2xl font-bold text-aerospace-accent">{engine.rul.toFixed(1)}</div>
                <div className="text-xs text-gray-500">Cycles Remaining</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        {selectedEngine && (
          <div className="space-y-8">
            {/* Hero Section: Gauge + Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-aerospace-dark border border-aerospace-accent/20 rounded-lg p-8 flex items-center justify-center">
                <RULGauge
                  rul={simulation.isRunning || simulation.currentRul > 0 ? simulation.currentRul : selectedEngine.rul}
                  animate={true}
                />
              </div>

              {/* Control Panel */}
              <div className="space-y-4">
                <div className="bg-aerospace-dark border border-aerospace-accent/20 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Simulation Controls</h3>
                  <div className="space-y-3">
                    <button
                      onClick={startSimulation}
                      disabled={simulation.isRunning}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-aerospace-accent text-aerospace-darker font-bold rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <Play size={18} />
                      Start Demo
                    </button>
                    <button
                      onClick={pauseSimulation}
                      disabled={!simulation.isRunning}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-aerospace-alert text-aerospace-darker font-bold rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <Pause size={18} />
                      Pause
                    </button>
                    <button
                      onClick={resetSimulation}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition"
                    >
                      <RotateCcw size={18} />
                      Reset
                    </button>
                  </div>

                  {/* Progress */}
                  {simulation.currentCycle > 0 && (
                    <div className="mt-6 pt-4 border-t border-aerospace-accent/20">
                      <div className="text-sm text-gray-400 mb-2">
                        Progress: {simulation.currentCycle} / {simulation.totalCycles} cycles
                      </div>
                      <div className="w-full bg-aerospace-dark rounded-full h-2 border border-aerospace-accent/20">
                        <div
                          className="bg-aerospace-accent h-2 rounded-full transition-all"
                          style={{
                            width: `${(simulation.currentCycle / simulation.totalCycles) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sensor Chart & Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SensorChart sensors={simulation.sensorHistory} />
              <FeatureImportance sensors={simulation.topSensors.length > 0 ? simulation.topSensors : selectedEngine.rul > 0 ? [
                { name: 'T50', importance: 0.148 },
                { name: 'P30', importance: 0.132 },
                { name: 'Nf', importance: 0.119 },
                { name: 'NRc', importance: 0.105 },
                { name: 'T24', importance: 0.098 },
              ] : []} />
            </div>

            {/* What-If Analyzer */}
            <WhatIfAnalyzer currentRul={simulation.isRunning || simulation.currentRul > 0 ? simulation.currentRul : selectedEngine.rul} />
          </div>
        )}
      </div>

      {/* Alert Card */}
      {!alertDismissed && (
        <AlertCard
          rul={simulation.isRunning || simulation.currentRul > 0 ? simulation.currentRul : selectedEngine?.rul || 0}
          engineId={selectedEngine?.engine_id || 'N/A'}
          onDismiss={() => setAlertDismissed(true)}
        />
      )}
    </main>
  );
}
