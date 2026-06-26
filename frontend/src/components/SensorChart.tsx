'use client';

import React from 'react';
import { Panel, Eyebrow } from '@/components/ui';
import { getSensorMeta } from '@/lib/sensorMeta';

interface SensorChartProps {
  sensors: number[][];
  maxCycles?: number;
}

const SENSOR_NAMES = [
  'T24', 'T30', 'T50', 'P24', 'P30', 'P50', 'Ps30', 'Phi', 'NC', 'ND',
  'Nf', 'NRf', 'NRc', 'BPR', 'farB', 'htBleed', 'Nf_dmd', 'PCNfR_dmd',
  'W31', 'W32', 'DSM',
];

// Channels that actually carry the degradation signal - one per family.
// (The constant-variance channels the model drops are deliberately excluded.)
const SHOWN = [2, 3, 10, 14, 19, 20]; // T50, P24, Nf, farB, W32, DSM

const fmt = (v: number) =>
  Math.abs(v) >= 1000 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2);

/** Sparkline auto-scaled to its own data range, so subtle drift fills the box. */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const n = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // floor avoids divide-by-zero on flat series
  const pad = 0.16; // vertical breathing room (fraction of box)
  const W = 100;
  const H = 34;
  const x = (i: number) => (n === 1 ? W : (i / (n - 1)) * W);
  const y = (v: number) => H * pad + (1 - (v - min) / range) * H * (1 - 2 * pad);

  const line = values.map((v, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(' ');
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  const lastX = x(n - 1);
  const lastY = y(values[n - 1]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-10 w-full" aria-hidden>
      <path d={area} fill={color} opacity={0.1} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r={2} fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function SensorTile({ idx, window: win }: { idx: number; window: number[][] }) {
  const name = SENSOR_NAMES[idx];
  const meta = getSensorMeta(name);
  const Glyph = meta.Glyph;
  const values = win.map((row) => row[idx] ?? 0);
  const current = values[values.length - 1];
  const delta = current - values[0];
  const pct = values[0] ? (delta / Math.abs(values[0])) * 100 : 0;
  const trend = delta > 0 ? '▲' : delta < 0 ? '▼' : '·';

  return (
    <div className="rounded-lg border border-hairline bg-surface-raised p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5" style={{ color: meta.color }}>
          <Glyph size={14} />
          <span className="font-mono text-xs text-ink">{name}</span>
        </span>
        <span className="font-mono text-[10px] text-ink-soft" title="change across the window">
          {trend} {Math.abs(pct).toFixed(2)}%
        </span>
      </div>
      <Sparkline values={values} color={meta.color} />
      <div className="mt-1 flex items-baseline justify-between font-mono text-[10px] text-ink-faint">
        <span>{fmt(Math.min(...values))}</span>
        <span className="text-sm font-medium text-ink">{fmt(current)}</span>
        <span>{fmt(Math.max(...values))}</span>
      </div>
    </div>
  );
}

export function SensorChart({ sensors, maxCycles = 80 }: SensorChartProps) {
  const win = (sensors ?? []).slice(-maxCycles);
  const hasData = win.length >= 2;

  return (
    <Panel className="p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Telemetry</Eyebrow>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink">
            Sensor drift · per-channel scale
          </h3>
        </div>
        {hasData && (
          <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            {win.length} cyc · autoscaled
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="flex h-[280px] flex-col items-center justify-center gap-1 text-center">
          <span className="eyebrow">Stream idle</span>
          <p className="text-sm text-ink-faint">Run the degradation demo to plot live sensor traces.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {SHOWN.map((idx) => (
              <SensorTile key={idx} idx={idx} window={win} />
            ))}
          </div>
          <p className="mt-3 font-mono text-[11px] text-ink-soft">
            Each box is zoomed to its own range. The real changes are tiny, only about 1 to 2 percent,
            too small to see on a shared scale, but enough for the model to spot wear.
          </p>
        </>
      )}
    </Panel>
  );
}
