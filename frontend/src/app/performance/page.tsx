'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, Cell, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { ModelPerformanceResponse } from '@/lib/types';
import { Panel, Eyebrow } from '@/components/ui';
import { WhatIfAnalyzer } from '@/components/WhatIfAnalyzer';
import {
  RmseGlyph, MaeGlyph, NasaScoreGlyph, AccuracyBandGlyph, GlyphProps,
} from '@/components/icons';
import { thermalRamp, statusForRul, type RulStatus } from '@/lib/thermal';
import { REAL_PRED_VS_ACTUAL, REAL_EVAL } from '@/lib/evalData';

// ── Data-prep facts (real FD001 numbers, for the "where the data comes from" card) ──
const DATA_STATS = [
  { n: '100', l: 'engines to learn from' },
  { n: '100', l: 'new engines to test on' },
  { n: '20,631', l: 'training flights' },
  { n: '17', l: 'sensors used (of 24)' },
];
const DATA_STEPS = [
  'We show the model the last 30 flights at a time, then slide the window forward.',
  '7 of the 24 readings never change, so we drop them and keep the 17 that do.',
  'Every reading is squeezed into a 0 to 1 range so no single sensor takes over.',
  'We cap "life left" at 125 flights. Above that, an engine just counts as healthy.',
];

const BANDS: RulStatus[] = ['OK', 'WARNING', 'CRITICAL'];
const BAND_LABEL: Record<RulStatus, string> = { OK: 'OK', WARNING: 'Warning', CRITICAL: 'Critical' };

// One example attention pattern over the 30-flight window: real attention tends
// to lean on the most recent flights, where the wear shows up. Normalised so the
// 30 weights add up to 100%, like real attention weights.
const ATTENTION_RAW = Array.from({ length: 30 }, (_, i) => {
  const recency = i / 29; // 0 = oldest flight, 1 = most recent
  return 0.25 + 0.75 * Math.pow(recency, 2.2) * (0.85 + 0.15 * Math.sin(i * 1.3));
});
const ATTN_SUM = ATTENTION_RAW.reduce((s, w) => s + w, 0);
const ATTENTION = ATTENTION_RAW.map((w) => (w / ATTN_SUM) * 100); // percent, sums to 100
const ATTN_MAX = Math.max(...ATTENTION);

const AXIS = 'var(--ink-faint)';
const GRID = 'var(--hairline)';
const TOOLTIP = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--hairline)',
  borderRadius: '8px',
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  color: 'var(--ink)',
};
// Recharts colours the label/items separately from the box - force light text.
const TOOLTIP_LABEL = { color: 'var(--ink)', fontWeight: 600 };
const TOOLTIP_ITEM = { color: 'var(--ink-soft)' };

// Illustrative training trace (epoch-level loss is not exposed by the API).
const TRAINING_DATA = [
  { epoch: 1, train: 450, val: 420 }, { epoch: 5, train: 320, val: 350 },
  { epoch: 10, train: 280, val: 310 }, { epoch: 15, train: 210, val: 270 },
  { epoch: 20, train: 180, val: 250 }, { epoch: 25, train: 150, val: 240 },
  { epoch: 30, train: 130, val: 235 }, { epoch: 35, train: 110, val: 232 },
  { epoch: 40, train: 95, val: 230 }, { epoch: 45, train: 85, val: 228 },
];
const MODEL_COMPARISON = [
  { name: 'SimpleRNN', rmse: 15.9, mae: 11.22 },
  { name: 'GRU', rmse: 13.57, mae: 9.97 },
  { name: 'LSTM', rmse: 13.71, mae: 10.26 },
  { name: 'LSTM+Att', rmse: 14.52, mae: 10.33 },
];
const DEPLOYED = 'LSTM+Att';

// Plain-language primer on each recurrent architecture (Block 4 concepts).
const MODEL_INFO = [
  {
    name: 'SimpleRNN',
    full: 'Simple Recurrent Network',
    desc: 'The simplest model that reads data in order. It has a short memory, so over 30 flights it forgets the early ones. That is why it scores worst here.',
  },
  {
    name: 'GRU',
    full: 'Gated Recurrent Unit',
    desc: 'A smarter version with small "gates" that choose what to keep and what to drop. It is light and quick to train, and it got the best score.',
  },
  {
    name: 'LSTM',
    full: 'Long Short-Term Memory',
    desc: 'Like a GRU but with a separate memory line that holds information for longer. Good at remembering wear that started many flights ago.',
  },
  {
    name: 'LSTM+Att',
    full: 'LSTM plus Attention',
    desc: 'An LSTM with an extra "attention" step that points to the flights that matter most. This makes it easier to explain, so it is the one we run live.',
  },
];

export default function PerformancePage() {
  const [perf, setPerf] = useState<ModelPerformanceResponse | null>(null);

  useEffect(() => {
    api.modelPerformance().then(setPerf).catch((e) => console.error('model-performance:', e));
  }, []);

  // Fallbacks match the deployed LSTM+Attention model (metrics.json).
  const metrics: { label: string; value: number; unit: string; desc: string; Glyph: React.ComponentType<GlyphProps> }[] = [
    { label: 'RMSE', value: perf?.rmse ?? 14.52, unit: 'cycles', Glyph: RmseGlyph,
      desc: 'On average the guess is off by about this many cycles. Big misses count extra. Smaller is better.' },
    { label: 'MAE', value: perf?.mae ?? 10.33, unit: 'cycles', Glyph: MaeGlyph,
      desc: 'The plain average of how far off each guess is, in cycles. One or two odd cases bother it less than RMSE.' },
    { label: 'NASA Score', value: perf?.nasa_score ?? 603.4, unit: 'points', Glyph: NasaScoreGlyph,
      desc: 'A score made for engines. Guessing too high (saying an engine is fine when it is not) is punished harder. Lower is better.' },
    { label: 'Within ±10', value: perf?.pct_within_10 ?? 59, unit: '%', Glyph: AccuracyBandGlyph,
      desc: 'Out of every 100 engines, how many we got within 10 cycles of the real answer.' },
  ];

  // Sort the 100 real test engines into OK / Warning / Critical buckets by their
  // true vs predicted life left, then count how often the model agreed.
  const confusion = useMemo(() => {
    const m = BANDS.map(() => BANDS.map(() => 0));
    for (const p of REAL_PRED_VS_ACTUAL) {
      const a = BANDS.indexOf(statusForRul(p.actual));
      const g = BANDS.indexOf(statusForRul(p.predicted));
      m[a][g]++;
    }
    const total = REAL_PRED_VS_ACTUAL.length;
    const correct = m.reduce((s, row, i) => s + row[i], 0);
    const max = Math.max(...m.flat(), 1);
    return { m, total, correct, max };
  }, []);

  return (
    <main id="main" className="mx-auto max-w-7xl px-6 py-8 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="mb-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-steel transition hover:text-steel-deep">
          <ArrowLeft size={15} /> Back to fleet
        </Link>
        <Eyebrow>Evaluation · NASA CMAPSS FD001</Eyebrow>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
          Model performance
        </h1>
        <p className="mt-1 text-ink-soft">How well the LSTM + Attention model does on engines it never saw during training.</p>
      </div>

      {/* Metric cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, unit, desc, Glyph }) => (
          <Panel key={label} raised className="flex flex-col p-5">
            <div className="flex items-center justify-between">
              <Eyebrow>{label}</Eyebrow>
              <span className="text-steel"><Glyph size={20} /></span>
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-ink">
              {value}
              <span className="ml-1 font-mono text-xs font-normal text-ink-faint">{unit}</span>
            </div>
            <p className="mt-2 text-xs leading-snug text-ink-soft">{desc}</p>
          </Panel>
        ))}
      </div>

      {/* The data (#5) */}
      <Panel className="mb-8 p-6">
        <Eyebrow>The data</Eyebrow>
        <h2 className="mt-1 font-display text-xl font-semibold text-ink">Where the numbers come from</h2>
        <p className="mt-2 max-w-3xl text-sm text-ink-soft">
          We use NASA&apos;s C-MAPSS FD001 set. These are simulated jet engines that were run until they
          broke, so the real life left is known for every one. We learn from one group of engines and
          test on a completely separate group.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {DATA_STATS.map((s) => (
            <div key={s.l} className="rounded-lg border border-hairline bg-surface-sunk/50 p-3 text-center">
              <div className="font-display text-2xl font-bold text-ink tabular-nums">{s.n}</div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Eyebrow className="mb-2">How we cleaned it up</Eyebrow>
          <ul className="grid gap-2 sm:grid-cols-2">
            {DATA_STEPS.map((step) => (
              <li key={step} className="flex gap-2 text-sm text-ink-soft">
                <span className="mt-0.5 text-steel-deep">›</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      {/* Architecture explainer */}
      <Panel className="mb-8 p-6">
        <Eyebrow>What the model sees</Eyebrow>
        <h2 className="mt-1 font-display text-xl font-semibold text-ink">It looks at the last 30 flights</h2>
        <p className="mt-2 max-w-3xl text-sm text-ink-soft">
          For each guess the model reads the last 30 flights of the engine, with 17 sensor readings per
          flight (from the fan, compressor, combustor and turbine). It uses LSTM layers, the type of
          network built for data that comes in order over time, because wear builds up flight after
          flight. An <span className="text-ink">attention</span> step then helps it focus on the
          flights and sensors that matter most.
        </p>
      </Panel>

      {/* Attention over the window (#3) */}
      <Panel className="mb-8 p-6">
        <div className="mb-1 flex items-baseline justify-between">
          <div>
            <Eyebrow>Attention</Eyebrow>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">Which flights it pays attention to</h2>
          </div>
          <span className="rounded-full bg-surface-sunk px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            Example pattern
          </span>
        </div>
        <p className="mb-4 max-w-3xl text-sm text-ink-soft">
          The attention step gives each of the 30 flights a weight, a score for how much it matters to
          the final guess. Taller, brighter bars mean the model leaned on that flight more. It usually
          cares most about the recent flights, where wear shows up. (This is an example of the shape;
          wiring the live weights from the model is a quick next step.)
        </p>
        <div className="flex gap-2">
          {/* y-axis */}
          <div className="flex h-32 w-9 flex-col items-end justify-between py-0 font-mono text-[9px] text-ink-faint">
            <span>{ATTN_MAX.toFixed(1)}%</span>
            <span>{(ATTN_MAX / 2).toFixed(1)}%</span>
            <span>0%</span>
          </div>
          {/* bars */}
          <div className="flex h-32 flex-1 items-stretch gap-[3px] border-l border-hairline pl-2">
            {ATTENTION.map((w, i) => {
              const ago = 29 - i;
              const when = i === 29 ? 'most recent flight' : `${ago} flights ago`;
              return (
                <div
                  key={i}
                  className="group/bar relative flex flex-1 items-end"
                  title={`${w.toFixed(1)}% of attention · ${when}`}
                >
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{ height: `${(w / ATTN_MAX) * 100}%`, backgroundColor: thermalRamp(0.2 + (w / ATTN_MAX) * 0.6) }}
                  />
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-hairline bg-surface-raised px-2 py-1 text-[10px] text-ink-soft shadow-panel group-hover/bar:block"
                  >
                    <span className="font-semibold text-ink">{w.toFixed(1)}%</span> · {when}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-1.5 flex justify-between pl-11 font-mono text-[10px] text-ink-faint">
          <span>30 flights ago</span>
          <span className="font-semibold text-ink-soft">how much attention each flight gets</span>
          <span>most recent</span>
        </div>
      </Panel>

      {/* Architecture comparison */}
      <Panel className="mb-8 p-6">
        <div className="mb-5 flex items-baseline justify-between">
          <div>
            <Eyebrow>Architectures</Eyebrow>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">Four models, ranked</h2>
          </div>
          <span className="font-mono text-xs text-ink-soft">deployed · {DEPLOYED}</span>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {(['rmse', 'mae'] as const).map((key) => (
            <div key={key}>
              <Eyebrow className="mb-2">{key.toUpperCase()} by model · lower is better</Eyebrow>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={MODEL_COMPARISON} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={GRID} vertical={false} />
                  <XAxis dataKey="name" stroke={AXIS} fontSize={11} fontFamily="var(--font-mono)" tickLine={false} />
                  <YAxis stroke={AXIS} fontSize={11} fontFamily="var(--font-mono)" tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} cursor={{ fill: 'var(--hairline)', opacity: 0.4 }} />
                  <Bar dataKey={key} radius={[6, 6, 0, 0]}>
                    {MODEL_COMPARISON.map((m) => (
                      <Cell key={m.name} fill={m.name === DEPLOYED ? 'var(--thermal-ember)' : 'var(--steel)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-xs text-ink-soft">
          GRU has the lowest error (13.57). We still run LSTM + Attention because it can show which flights it looked at, which matters more to us than a tiny bit of accuracy.
        </p>

        {/* What each model is */}
        <div className="mt-5 border-t border-hairline pt-5">
          <Eyebrow className="mb-3">What each model is</Eyebrow>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MODEL_INFO.map((m) => {
              const isDeployed = m.name === DEPLOYED;
              return (
                <div
                  key={m.name}
                  className={`rounded-lg border p-3 ${
                    isDeployed ? 'border-thermal-ember/40 bg-thermal-ember/10' : 'border-hairline bg-surface-sunk/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-display text-sm font-semibold text-ink">{m.name}</span>
                    {isDeployed && (
                      <span className="font-mono text-[9px] uppercase tracking-wide text-thermal-ember">live</span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{m.full}</div>
                  <p className="mt-1.5 text-xs leading-snug text-ink-soft">{m.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* Training history */}
      <Panel className="mb-8 p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <Eyebrow>Convergence</Eyebrow>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">Training vs validation loss</h2>
          </div>
          <span className="rounded-full bg-surface-sunk px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            Illustrative
          </span>
        </div>
        <p className="mb-4 max-w-3xl text-sm text-ink-soft">
          "Loss" is how wrong the model is. Lower is better. The{' '}
          <span className="text-ink">training</span> line is the error on the data it studies. The{' '}
          <span className="text-ink">validation</span> line is the error on data it has not seen. We
          want both lines to go down and stay close. If the validation line starts going up while
          training keeps dropping, the model is just memorising the answers instead of learning. That
          is called <span className="text-ink">overfitting</span>, and we hold it back with the tricks
          taught in class (dropout, early stopping, and saving the best version).
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={TRAINING_DATA} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={GRID} />
            <XAxis dataKey="epoch" stroke={AXIS} fontSize={11} fontFamily="var(--font-mono)" tickLine={false} />
            <YAxis stroke={AXIS} fontSize={11} fontFamily="var(--font-mono)" tickLine={false} />
            <Tooltip contentStyle={TOOLTIP} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} />
            <Legend wrapperStyle={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-soft)' }} />
            <Line type="monotone" dataKey="train" name="Training" stroke="var(--steel)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="val" name="Validation" stroke="var(--thermal-warm)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      {/* Predicted vs actual - REAL, from the live model */}
      <Panel className="p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <Eyebrow>Calibration</Eyebrow>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">Predicted vs actual RUL</h2>
          </div>
          <span className="rounded-full bg-thermal-healthy/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-thermal-healthy-ink">
            Live model
          </span>
        </div>
        <p className="mb-4 max-w-3xl text-sm text-ink-soft">
          Every dot is one test engine. Across the bottom is the real answer, up the side is the
          model&apos;s guess. A dot on the dashed line is a perfect guess.{' '}
          <span className="text-ink">Above</span> the line means the model guessed too high (it thinks
          the engine has more life left than it does, which is the risky kind of mistake).{' '}
          <span className="text-ink">Below</span> means it guessed too low (it plays it safe). The
          closer the dots hug the line, the better.
        </p>
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: -4 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={GRID} />
            <XAxis type="number" dataKey="actual" name="Actual" stroke={AXIS} fontSize={11} fontFamily="var(--font-mono)" tickLine={false} domain={[0, 125]} />
            <YAxis type="number" dataKey="predicted" name="Predicted" stroke={AXIS} fontSize={11} fontFamily="var(--font-mono)" tickLine={false} domain={[0, 135]} />
            <Tooltip contentStyle={TOOLTIP} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} cursor={{ strokeDasharray: '3 3' }} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 125, y: 125 }]} stroke="var(--ink-faint)" strokeDasharray="5 5" />
            <Scatter data={REAL_PRED_VS_ACTUAL}>
              {REAL_PRED_VS_ACTUAL.map((p, i) => (
                <Cell key={i} fill={thermalRamp(1 - Math.min(Math.abs(p.actual - p.predicted) / 25, 1))} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <p className="mt-3 font-mono text-xs text-ink-soft">
          {REAL_EVAL.count} test engines, scored by the live model.{' '}
          <span className="text-thermal-healthy-ink">{REAL_EVAL.within10}</span> out of 100 land within 10 cycles of the real answer,{' '}
          <span className="text-thermal-healthy-ink">{REAL_EVAL.within25}</span> within 25. Dot colour shows the size of the miss (green is close, red is far).
        </p>
      </Panel>

      {/* Status buckets - confusion matrix (#1) */}
      <Panel className="mb-8 p-6">
        <div className="mb-1 flex items-baseline justify-between">
          <div>
            <Eyebrow>Right bucket?</Eyebrow>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">Did it sort each engine correctly?</h2>
          </div>
          <span className="rounded-full bg-thermal-healthy/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-thermal-healthy-ink">
            Live model
          </span>
        </div>
        <div className="mt-4 grid items-center gap-x-8 gap-y-5 md:grid-cols-[1fr_auto]">
          {/* Explanation + summary */}
          <div>
            <p className="text-sm text-ink-soft">
              In real life you mostly care about the action, not the exact number. So we sort every engine
              into three buckets by life left: <span className="text-ink">OK</span> (80+),{' '}
              <span className="text-ink">Warning</span> (30 to 80) and <span className="text-ink">Critical</span> (under 30).
              Each row is where an engine really belongs; each column is where the model put it. The boxes
              down the diagonal are correct. The box in the bottom-left is the dangerous mistake: a truly
              critical engine the model called OK.
            </p>
            <div className="mt-4 flex flex-col gap-1 font-mono text-[11px] text-ink-soft">
              <span className="text-ink">Rows = real bucket. Columns = the model&apos;s guess.</span>
              <span>
                <span className="text-thermal-healthy-ink">{confusion.correct} of {confusion.total}</span> engines
                landed in the right bucket ({Math.round((confusion.correct / confusion.total) * 100)}%).
              </span>
            </div>
          </div>
          {/* Matrix */}
          <div className="overflow-x-auto">
            <div className="mb-1.5 text-center font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              Model&apos;s guess
            </div>
            <div className="inline-grid grid-cols-[auto_repeat(3,4.5rem)] gap-1 text-center font-mono text-xs">
              <div />
              {BANDS.map((b) => (
                <div key={b} className="pb-1 text-ink-faint">{BAND_LABEL[b]}</div>
              ))}
              {BANDS.map((rowB, r) => (
                <React.Fragment key={rowB}>
                  <div className="flex items-center justify-end pr-2 text-ink-faint">{BAND_LABEL[rowB]}</div>
                  {BANDS.map((colB, c) => {
                    const v = confusion.m[r][c];
                    const onDiag = r === c;
                    const danger = r === 2 && c === 0; // actual Critical, guessed OK
                    return (
                      <div
                        key={colB}
                        title={`${v} engines were really ${BAND_LABEL[rowB]} and the model guessed ${BAND_LABEL[colB]}`}
                        className={`flex h-14 items-center justify-center rounded-md border text-base font-bold ${
                          danger
                            ? 'border-thermal-critical text-thermal-critical'
                            : onDiag
                            ? 'border-thermal-healthy/40 text-ink'
                            : 'border-hairline text-ink-soft'
                        }`}
                        style={{
                          backgroundColor: onDiag
                            ? `color-mix(in srgb, var(--thermal-healthy) ${10 + (v / confusion.max) * 45}%, transparent)`
                            : v > 0
                            ? `color-mix(in srgb, var(--thermal-critical) ${8 + (v / confusion.max) * 35}%, transparent)`
                            : 'transparent',
                        }}
                      >
                        {v}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* From accuracy to action: maintenance economics */}
      <section className="mt-8">
        <WhatIfAnalyzer rmse={perf?.rmse} />
      </section>
    </main>
  );
}
