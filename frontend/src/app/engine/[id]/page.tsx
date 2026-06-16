'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { EngineDetail, EngineStatus } from '@/lib/types';
import { RULGauge } from '@/components/RULGauge';
import { SensorChart } from '@/components/SensorChart';
import { FeatureImportance } from '@/components/FeatureImportance';
import { AlertCard } from '@/components/AlertCard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EngineDetailPage({ params }: { params: { id: string } }) {
  const [engine, setEngine] = useState<EngineDetail | null>(null);
  const [fleet, setFleet] = useState<EngineStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [engineData, fleetData] = await Promise.all([
          api.engineDetail(params.id),
          api.fleet(),
        ]);
        setEngine(engineData);
        setFleet(fleetData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load engine data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-aerospace-darker flex items-center justify-center">
        <div className="text-aerospace-accent text-xl">Loading engine details...</div>
      </div>
    );
  }

  if (error || !engine) {
    return (
      <div className="min-h-screen bg-aerospace-darker flex items-center justify-center">
        <div className="text-aerospace-alert text-xl">Error: {error || 'Engine not found'}</div>
      </div>
    );
  }

  const fleetEngine = fleet.find((e) => e.engine_id === params.id);

  return (
    <main className="min-h-screen bg-aerospace-darker p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button & Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-aerospace-accent hover:text-aerospace-accent/80 transition mb-4">
            <ArrowLeft size={20} />
            Back to Fleet
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">{engine.engine_id} — Detail View</h1>
          <p className="text-gray-400">Comprehensive engine diagnostics and history</p>
        </div>

        {/* Main Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-aerospace-dark border border-aerospace-accent/20 rounded-lg p-8 flex items-center justify-center">
            <RULGauge rul={engine.current_rul} />
          </div>

          {/* Status Card */}
          <div className="bg-aerospace-dark border border-aerospace-accent/20 rounded-lg p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Engine Status</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-400 text-sm mb-1">Current RUL</div>
                  <div className="text-3xl font-bold text-aerospace-accent">{engine.current_rul.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Cycles Remaining</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Status</div>
                  <div
                    className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${
                      engine.status === 'OK'
                        ? 'bg-aerospace-success/20 text-aerospace-success'
                        : engine.status === 'WARNING'
                        ? 'bg-aerospace-alert/20 text-aerospace-alert'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {engine.status}
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-aerospace-accent/20 mt-6">
              <button className="w-full px-4 py-2 bg-aerospace-accent text-aerospace-darker font-bold rounded hover:bg-opacity-90 transition">
                Schedule Maintenance
              </button>
            </div>
          </div>
        </div>

        {/* Sensor & Feature Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SensorChart sensors={engine.sensor_history} />
          <FeatureImportance
            sensors={[
              { name: 'T50', importance: 0.148 },
              { name: 'P30', importance: 0.132 },
              { name: 'Nf', importance: 0.119 },
              { name: 'NRc', importance: 0.105 },
              { name: 'T24', importance: 0.098 },
              { name: 'P24', importance: 0.087 },
              { name: 'PS30', importance: 0.076 },
              { name: 'NC', importance: 0.065 },
              { name: 'ND', importance: 0.054 },
              { name: 'W31', importance: 0.043 },
            ]}
          />
        </div>

        {/* RUL History Chart */}
        {engine.rul_history.length > 0 && (
          <div className="mt-8 bg-aerospace-dark border border-aerospace-accent/20 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">RUL History</h3>
            <div className="text-gray-400 text-center py-8">
              RUL historical data will be displayed here (implement with Recharts LineChart)
            </div>
          </div>
        )}
      </div>

      {/* Alert if critical */}
      {engine.current_rul < 50 && (
        <AlertCard rul={engine.current_rul} engineId={engine.engine_id} />
      )}
    </main>
  );
}
