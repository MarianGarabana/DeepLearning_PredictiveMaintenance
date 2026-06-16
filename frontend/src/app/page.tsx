'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { EngineStatus } from '@/lib/types';

export default function Home() {
  const [engines, setEngines] = useState<EngineStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFleet() {
      try {
        setLoading(true);
        const data = await api.fleet();
        setEngines(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fleet');
      } finally {
        setLoading(false);
      }
    }

    loadFleet();
  }, []);

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
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Predictive Maintenance</h1>
          <p className="text-gray-400">Real-time turbofan engine RUL monitoring</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {engines.map((engine) => (
            <div
              key={engine.engine_id}
              className="bg-aerospace-dark border border-aerospace-accent/20 rounded-lg p-6 hover:border-aerospace-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">{engine.engine_id}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    engine.status === 'OK'
                      ? 'bg-aerospace-success/20 text-aerospace-success'
                      : engine.status === 'WARNING'
                      ? 'bg-aerospace-alert/20 text-aerospace-alert'
                      : 'bg-aerospace-danger/20 text-aerospace-danger'
                  }`}
                >
                  {engine.status}
                </span>
              </div>
              <div className="mb-4">
                <div className="text-3xl font-bold text-aerospace-accent">{engine.rul.toFixed(1)}</div>
                <div className="text-sm text-gray-400">Cycles Remaining</div>
              </div>
              <div className="text-xs text-gray-500">Updated: {new Date(engine.last_updated).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
