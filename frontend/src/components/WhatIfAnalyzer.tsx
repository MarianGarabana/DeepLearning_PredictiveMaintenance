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
const DEFAULT_SIGMA = 14.52; // model RMSE fallback (real value from /model-performance)
const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

/** Standard normal CDF (Abramowitz-Stegun erf approximation, |err| < 8e-8). */
function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-(x * x) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

// Planning model: schedule maintenance when predicted RUL hits `t` cycles.
// Because the model has error σ (= RMSE), true RUL at that point is ~N(t, σ),
// so the engine has already failed with probability Φ(-t/σ). Too low → failure
// risk dominates; too high → you discard usable life.
function expectedCost(t: number, sigma: number) {
  const failureProb = normalCdf(-t / sigma);
  const riskCost = failureProb * (FAILURE_COST - PREVENTIVE_COST);
  const wasted = Math.max(0, t - SAFETY_BUFFER) * WASTED_PER_CYCLE;
  return { failureProb, total: PREVENTIVE_COST + riskCost + wasted, wasted };
}

interface WhatIfAnalyzerProps {
  currentRul?: number;
  /** Model RMSE, used as the prediction-uncertainty σ. */
  rmse?: number;
}

export function WhatIfAnalyzer({ currentRul = 40, rmse }: WhatIfAnalyzerProps) {
  const sigma = rmse && rmse > 0 ? rmse : DEFAULT_SIGMA;
  const [threshold, setThreshold] = useState(20);
  const here = expectedCost(threshold, sigma);

  const { optimal, curve, min, max } = useMemo(() => {
    const pts = Array.from({ length: T_MAX + 1 }, (_, t) => ({ t, ...expectedCost(t, sigma) }));
    const opt = pts.reduce((a, b) => (b.total < a.total ? b : a));
    const totals = pts.map((p) => p.total);
    return { optimal: opt, curve: pts, min: Math.min(...totals), max: Math.max(...totals) };
  }, [sigma]);

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
          <Eyebrow>Cost planning · example</Eyebrow>
          <h3 className="font-display text-lg font-semibold text-ink">When is the best time to fix the engine?</h3>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Lever */}
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="threshold" className="text-sm font-medium text-ink">
              Fix it when life left is
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
            <Stat label="Chance it fails" value={`${(here.failureProb * 100).toFixed(0)}%`} />
            <Stat label="Good flights wasted" value={usd(here.wasted)} />
            <Stat label="Likely cost" value={usd(here.total)} emphasize />
          </div>
        </div>

        {/* Cost curve */}
        <div className="rounded-lg border border-hairline bg-surface-raised p-4">
          <div className="mb-1 flex items-center justify-between">
            <Eyebrow>Cost at each choice</Eyebrow>
            <span className="font-mono text-[11px] text-ink-soft">
              best ≈ {optimal.t} cyc · {usd(optimal.total)}
            </span>
          </div>
          <svg viewBox={`0 0 ${W} ${H + 8}`} className="w-full">
            <path d={`${path}`} fill="none" stroke="var(--ink-soft)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            {/* optimum marker */}
            <circle cx={x(optimal.t)} cy={y(optimal.total)} r="3.5" fill={thermalRamp(0.8)} />
            {/* current threshold marker */}
            <line x1={x(threshold)} y1="0" x2={x(threshold)} y2={H} stroke="var(--steel-deep)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={x(threshold)} cy={y(here.total)} r="3.5" fill="var(--steel-deep)" />
          </svg>
          <p className="mt-2 text-xs text-ink-soft">
            Fix it too early and you throw away good flights. Leave it too late and you risk a{' '}
            <span className="font-medium text-thermal-critical">{usd(FAILURE_COST)}</span> surprise breakdown.
            The sweet spot saves about{' '}
            <span className="font-medium text-thermal-healthy-ink">{usd(FAILURE_COST - optimal.total)}</span> each time.
          </p>
          <p className="mt-1 font-mono text-[10px] text-ink-faint">
            The failure chance comes from how much the model usually misses by (about {sigma.toFixed(0)} cycles).
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
