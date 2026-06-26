'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { EngineStatus, SimulateStartResponse, SimulateNextResponse } from '@/lib/types';
import { RULGauge } from '@/components/RULGauge';
import { SensorChart } from '@/components/SensorChart';
import { AlertCard } from '@/components/AlertCard';
import { FeatureImportance } from '@/components/FeatureImportance';
import { WhatIfAnalyzer } from '@/components/WhatIfAnalyzer';
import { Panel, Eyebrow, StatusAnnunciator } from '@/components/ui';
import { EngineSchematic } from '@/components/icons';
import { RUL_MAX, statusForRul, statusInk, rampForRul } from '@/lib/thermal';

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

const EMPTY_SIM: SimulationState = {
  isRunning: false,
  sessionId: null,
  currentCycle: 0,
  totalCycles: 0,
  currentRul: 0,
  currentSensors: [],
  sensorHistory: [],
  topSensors: [],
};

export default function Home() {
  const [engines, setEngines] = useState<EngineStatus[]>([]);
  const [selectedEngine, setSelectedEngine] = useState<EngineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [simulation, setSimulation] = useState<SimulationState>(EMPTY_SIM);
  const prefersReduced = useReducedMotion();

  // Most-degraded engine — the one the eye should land on first.
  const mostCritical = useMemo(
    () =>
      engines.reduce<EngineStatus | null>(
        (worst, e) => (!worst || e.rul < worst.rul ? e : worst),
        null
      ),
    [engines]
  );

  useEffect(() => {
    async function loadFleet() {
      try {
        setLoading(true);
        const data = await api.fleet();
        setEngines(data);
        if (data.length > 0) {
          const worst = data.reduce((w, e) => (e.rul < w.rul ? e : w), data[0]);
          setSelectedEngine(worst);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fleet');
      } finally {
        setLoading(false);
      }
    }
    loadFleet();
  }, []);

  useEffect(() => {
    if (!simulation.isRunning || !simulation.sessionId) return;
    const timer = setInterval(async () => {
      try {
        const next: SimulateNextResponse = await api.simulateNext(simulation.sessionId!);
        setSimulation((prev) => ({
          ...prev,
          currentCycle: next.cycle,
          currentRul: next.rul,
          currentSensors: next.sensors,
          sensorHistory: [...prev.sensorHistory, next.sensors].slice(-80),
          isRunning: !next.done,
        }));
      } catch (err) {
        console.error('Simulation error:', err);
        setSimulation((prev) => ({ ...prev, isRunning: false }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [simulation.isRunning, simulation.sessionId]);

  const startSimulation = async () => {
    try {
      const start: SimulateStartResponse = await api.simulateStart({ scenario: 'degrading' });
      setSimulation({ ...EMPTY_SIM, isRunning: true, sessionId: start.session_id, totalCycles: start.total_cycles, currentRul: RUL_MAX });
      setAlertDismissed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start simulation');
    }
  };
  const pauseSimulation = () => setSimulation((p) => ({ ...p, isRunning: false }));
  const resetSimulation = () => {
    setSimulation(EMPTY_SIM);
    setAlertDismissed(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <span className="eyebrow animate-pulse">Acquiring fleet telemetry…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-2 text-center">
        <span className="eyebrow text-thermal-critical">Telemetry link down</span>
        <p className="text-ink-soft">{error}</p>
        <p className="text-sm text-ink-faint">Confirm the API is running on :8000, then reload.</p>
      </div>
    );
  }

  const liveRul =
    simulation.isRunning || simulation.currentRul > 0
      ? simulation.currentRul
      : selectedEngine?.rul ?? 0;
  const liveStatus = statusForRul(liveRul);

  const fade = (delay = 0) =>
    prefersReduced
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  // Scroll-reveal for below-fold sections.
  const reveal = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-80px' },
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <main id="main" className="mx-auto max-w-7xl px-6 py-8 md:px-8">
      {/* ── Hero: the gauge is the thesis ──────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div {...fade(0)}>
          <Panel raised className="flex h-full flex-col items-center p-8 text-center">
            <Eyebrow>NASA CMAPSS FD001 · Turbofan RUL Monitor</Eyebrow>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
              Remaining Useful Life
            </h1>
            <p className="mt-2 max-w-md text-sm text-ink-soft">
              Colour is heat is life. The needle reads how many flight cycles{' '}
              <span className="font-mono text-ink">{selectedEngine?.engine_id}</span> has left
              before its hot section needs intervention.
            </p>
            <div className="mt-4">
              <RULGauge rul={liveRul} animate />
            </div>
          </Panel>
        </motion.div>

        <motion.div {...fade(0.08)}>
          <Panel className="flex h-full flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <Eyebrow>Active engine</Eyebrow>
                <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                  {selectedEngine?.engine_id}
                </h2>
              </div>
              <StatusAnnunciator status={liveStatus} />
            </div>

            <div className="rounded-lg border border-hairline bg-surface-raised p-4 text-ink-soft">
              <EngineSchematic labels highlight="combustor" className="w-full" />
              <p className="mt-2 text-center text-xs text-ink-faint">
                17 sensors along the gas path feed the model — heat concentrates in the core.
              </p>
            </div>

            <div className="mt-auto">
              <Eyebrow className="mb-2">Degradation demo</Eyebrow>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={startSimulation}
                  disabled={simulation.isRunning}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-steel px-3 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-steel-deep disabled:opacity-40"
                >
                  <Play size={15} /> Run
                </button>
                <button
                  onClick={pauseSimulation}
                  disabled={!simulation.isRunning}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-hairline bg-surface-raised px-3 py-2.5 font-display text-sm font-semibold text-ink transition hover:border-steel disabled:opacity-40"
                >
                  <Pause size={15} /> Pause
                </button>
                <button
                  onClick={resetSimulation}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-hairline bg-surface-raised px-3 py-2.5 font-display text-sm font-semibold text-ink transition hover:border-steel"
                >
                  <RotateCcw size={15} /> Reset
                </button>
              </div>
              {simulation.currentCycle > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between font-mono text-xs text-ink-soft">
                    <span>Cycle {simulation.currentCycle}</span>
                    <span>{simulation.totalCycles} total</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk">
                    <div
                      className="h-full rounded-full bg-steel transition-all"
                      style={{ width: `${(simulation.currentCycle / simulation.totalCycles) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </motion.div>
      </section>

      {/* ── Fleet strip ────────────────────────────────────────────────── */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <Eyebrow>Fleet</Eyebrow>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">Monitored engines</h2>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="eyebrow">Critical</span>
            <span className="thermal-gradient h-1.5 w-28 rounded-full" />
            <span className="eyebrow">Nominal</span>
          </div>
        </div>

        <motion.div
          className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6"
          initial={prefersReduced ? false : 'hidden'}
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {engines.map((engine) => {
            const isSelected = selectedEngine?.engine_id === engine.engine_id;
            const isCritical = mostCritical?.engine_id === engine.engine_id;
            const status = statusForRul(engine.rul);
            const ink = statusInk(status);
            return (
              <motion.button
                key={engine.engine_id}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                onClick={() => {
                  setSelectedEngine(engine);
                  resetSimulation();
                }}
                className={`hairline-hover group rounded-xl border bg-surface-raised p-4 text-left shadow-panel ${
                  isSelected ? 'border-steel ring-1 ring-steel' : 'border-hairline'
                } ${isCritical && !isSelected ? 'animate-halo-pulse' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-semibold text-ink">
                    {engine.engine_id}
                  </span>
                  <StatusAnnunciator status={status} size={13} className="!px-1.5 !py-0.5" />
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-2xl font-bold" style={{ color: ink }}>
                    {engine.rul.toFixed(0)}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                    cyc
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(engine.rul / RUL_MAX) * 100}%`,
                      backgroundColor: rampForRul(engine.rul),
                    }}
                  />
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </section>

      {/* ── Analysis ───────────────────────────────────────────────────── */}
      {selectedEngine && (
        <>
          <motion.section className="mt-10 grid gap-6 lg:grid-cols-2" {...reveal}>
            <SensorChart sensors={simulation.sensorHistory} />
            <FeatureImportance
              sensors={
                simulation.topSensors.length > 0
                  ? simulation.topSensors
                  : [
                      { name: 'T50', importance: 0.148 },
                      { name: 'P30', importance: 0.132 },
                      { name: 'Nf', importance: 0.119 },
                      { name: 'NRc', importance: 0.105 },
                      { name: 'T24', importance: 0.098 },
                    ]
              }
            />
          </motion.section>

          <motion.section className="mt-6" {...reveal}>
            <WhatIfAnalyzer currentRul={liveRul} />
          </motion.section>
        </>
      )}

      {!alertDismissed && (
        <AlertCard
          rul={liveRul}
          engineId={selectedEngine?.engine_id || 'N/A'}
          onDismiss={() => setAlertDismissed(true)}
        />
      )}
    </main>
  );
}
