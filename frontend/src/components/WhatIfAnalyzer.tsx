'use client';

import React, { useMemo, useState } from 'react';
import { Panel, Eyebrow } from '@/components/ui';
import { WhatIfGlyph } from '@/components/icons';
import { thermalRamp } from '@/lib/thermal';

const PREVENTIVE_COST = 35000;
const FAILURE_COST = 500000;
const WASTED_PER_CYCLE = 1500; // illustrative value of a thrown-away flight cycle
const SAFETY_BUFFER = 8; // cycles of margin before wasted-life is counted
const T_MAX = 60;
const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

// Illustrative planning model: schedule maintenance when RUL hits `t` cycles.
// Too low → failure risk dominates; too high → you discard usable life.
function expectedCost(t: number) {
  const failureProb = Math.exp(-t / 12);
  const riskCost = failureProb * (FAILURE_COST - PREVENTIVE_COST);
  const wasted = Math.max(0, t - SAFETY_BUFFER) * WASTED_PER_CYCLE;
  return { failureProb, total: PREVENTIVE_COST + riskCost + wasted, wasted };
}

interface WhatIfAnalyzerProps {
  currentRul?: number;
}

export function WhatIfAnalyzer({ currentRul = 40 }: WhatIfAnalyzerProps) {
  const [threshold, setThreshold] = useState(20);
  const here = expectedCost(threshold);

  const { optimal, curve, min, max } = useMemo(() => {
    const pts = Array.from({ length: T_MAX + 1 }, (_, t) => ({ t, ...expectedCost(t) }));
    const opt = pts.reduce((a, b) => (b.total < a.total ? b : a));
    const totals = pts.map((p) => p.total);
    return { optimal: opt, curve: pts, min: Math.min(...totals), max: Math.max(...totals) };
  }, []);

  const W = 320;
  const H = 70;
  const x = (t: number) => (t / T_MAX) * W;
  const y = (v: number) => H - ((v - min) / (max - min)) * H;
  const path = curve.map((p, i) => `${i ? 'L' : 'M'} ${x(p.t).toFixed(1)} ${y(p.total).toFixed(1)}`).join(' ');

  return (
    <Panel className="p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-steel">
          <WhatIfGlyph size={20} />
        </span>
        <div>
          <Eyebrow>Maintenance economics · illustrative</Eyebrow>
          <h3 className="font-display text-lg font-semibold text-ink">When should we pull the engine?</h3>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Lever */}
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="threshold" className="text-sm font-medium text-ink">
              Schedule at RUL
            </label>
            <span className="font-display text-2xl font-bold text-steel-deep">
              {threshold}
              <span className="ml-1 font-mono text-xs text-ink-faint">cyc</span>
            </span>
          </div>
          <input
            id="threshold"
            type="range"
            min={0}
            max={T_MAX}
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value))}
            className="mt-3 w-full"
          />

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="Failure risk" value={`${(here.failureProb * 100).toFixed(0)}%`} />
            <Stat label="Wasted life" value={usd(here.wasted)} />
            <Stat label="Expected cost" value={usd(here.total)} emphasize />
          </div>
        </div>

        {/* Cost curve */}
        <div className="rounded-lg border border-hairline bg-surface-raised p-4">
          <div className="mb-1 flex items-center justify-between">
            <Eyebrow>Expected cost vs threshold</Eyebrow>
            <span className="font-mono text-[11px] text-ink-soft">
              optimum ≈ {optimal.t} cyc · {usd(optimal.total)}
            </span>
          </div>
          <svg viewBox={`0 0 ${W} ${H + 8}`} className="w-full">
            <path d={`${path}`} fill="none" stroke="#5A544C" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            {/* optimum marker */}
            <circle cx={x(optimal.t)} cy={y(optimal.total)} r="3.5" fill={thermalRamp(0.8)} />
            {/* current threshold marker */}
            <line x1={x(threshold)} y1="0" x2={x(threshold)} y2={H} stroke="#3B6E8F" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={x(threshold)} cy={y(here.total)} r="3.5" fill="#3B6E8F" />
          </svg>
          <p className="mt-2 text-xs text-ink-soft">
            Pulling too early discards usable cycles; too late risks a{' '}
            <span className="font-medium text-thermal-critical">{usd(FAILURE_COST)}</span> unplanned failure.
            The model-optimal window saves about{' '}
            <span className="font-medium text-thermal-healthy-ink">{usd(FAILURE_COST - optimal.total)}</span> per event.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function Stat({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={`rounded-lg p-2.5 ${emphasize ? 'bg-steel-wash' : 'bg-surface-sunk'}`}>
      <div className={`font-display text-base font-bold ${emphasize ? 'text-steel-deep' : 'text-ink'}`}>{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
    </div>
  );
}
