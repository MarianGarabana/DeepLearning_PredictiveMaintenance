'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { api } from '@/lib/api';
import { EngineDetail, ModelPerformanceResponse } from '@/lib/types';
import { RULGauge } from '@/components/RULGauge';
import { SensorChart } from '@/components/SensorChart';
import { FeatureImportance } from '@/components/FeatureImportance';
import { AlertCard } from '@/components/AlertCard';
import { Panel, Eyebrow, StatusAnnunciator } from '@/components/ui';
import { EngineSchematic } from '@/components/icons';
import { RulStatus, statusForRul } from '@/lib/thermal';
import { toSensorImportance } from '@/lib/sensorMeta';

const AXIS = 'var(--ink-faint)';
const GRID = 'var(--hairline)';

export default function EngineDetailPage({ params }: { params: { id: string } }) {
  const [engine, setEngine] = useState<EngineDetail | null>(null);
  const [perf, setPerf] = useState<ModelPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [engineData, perfData] = await Promise.all([
          api.engineDetail(params.id),
          api.modelPerformance().catch(() => null),
        ]);
        setEngine(engineData);
        setPerf(perfData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load engine data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <span className="eyebrow animate-pulse">Loading {params.id} diagnostics…</span>
      </div>
    );
  }
  if (error || !engine) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-2 text-center">
        <span className="eyebrow text-thermal-critical">Engine not found</span>
        <p className="text-ink-soft">{error || `No record for ${params.id}.`}</p>
        <Link href="/" className="font-mono text-sm text-steel hover:text-steel-deep">Back to fleet</Link>
      </div>
    );
  }

  const status = (engine.status as RulStatus) ?? statusForRul(engine.current_rul);
  const history = engine.rul_history.map((rul, i) => ({ cycle: i + 1, rul: Math.round(rul * 10) / 10 }));

  return (
    <main id="main" className="mx-auto max-w-7xl px-6 py-8 md:px-8">
      <div className="mb-8">
        <Link href="/" className="mb-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-steel transition hover:text-steel-deep">
          <ArrowLeft size={15} /> Back to fleet
        </Link>
        <Eyebrow>Engine dossier</Eyebrow>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
          {engine.engine_id}
        </h1>
        <p className="mt-1 text-ink-soft">Diagnostics and degradation history.</p>
      </div>

      {/* Gauge + status */}
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel raised className="flex items-center justify-center p-8">
          <RULGauge rul={engine.current_rul} animate />
        </Panel>

        <Panel className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow>Current state</Eyebrow>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink">{engine.engine_id}</h2>
            </div>
            <StatusAnnunciator status={status} />
          </div>
          <div className="rounded-lg border border-hairline bg-surface-raised p-4 text-ink-soft">
            <EngineSchematic labels highlight="combustor" className="w-full" />
            <p className="mt-2 text-center text-xs text-ink-faint">Gas-path stations monitored for this engine.</p>
          </div>
          <button className="mt-auto rounded-lg bg-steel px-4 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-steel-deep">
            Schedule maintenance
          </button>
        </Panel>
      </div>

      {/* RUL history */}
      {history.length > 0 && (
        <Panel className="mt-6 p-6">
          <Eyebrow>Degradation trace</Eyebrow>
          <h3 className="mb-4 mt-1 font-display text-lg font-semibold text-ink">RUL history</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={history} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={GRID} />
              <XAxis dataKey="cycle" stroke={AXIS} fontSize={11} fontFamily="var(--font-mono)" tickLine={false} />
              <YAxis stroke={AXIS} fontSize={11} fontFamily="var(--font-mono)" tickLine={false} domain={[0, 125]} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--hairline)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink)' }}
                labelStyle={{ color: 'var(--ink)', fontWeight: 600 }}
                itemStyle={{ color: 'var(--ink-soft)' }}
              />
              <ReferenceLine y={80} stroke="var(--thermal-warm)" strokeDasharray="4 4" />
              <ReferenceLine y={30} stroke="var(--thermal-critical)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="rul" stroke="var(--steel-deep)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-2 font-mono text-xs text-ink-soft">
            Amber = caution (80) · red = warning (30) thresholds.
          </p>
        </Panel>
      )}

      {/* Sensors + drivers */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SensorChart sensors={engine.sensor_history} />
        <FeatureImportance sensors={toSensorImportance(perf?.feature_importance)} />
      </div>

      {engine.current_rul < 50 && (
        <AlertCard rul={engine.current_rul} engineId={engine.engine_id} />
      )}
    </main>
  );
}
