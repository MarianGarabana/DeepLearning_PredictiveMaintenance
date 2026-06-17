import type { DemoRow, Scenario } from './types';

// Map an engine's RUL band -> demo file. Mirrors the status bands but chooses a
// representative recorded sequence to drive the Engine Detail charts, since the
// /engine/{id} endpoint returns empty history (see plan).
//   > 80  -> healthy    30–80 -> degrading    < 30 -> critical
export function scenarioForRul(rul: number): Scenario {
  if (rul < 30) return 'critical';
  if (rul < 80) return 'degrading';
  return 'healthy';
}

// Vite serves public/ at the web root, so these fetch directly.
export async function loadDemo(scenario: Scenario): Promise<DemoRow[]> {
  const res = await fetch(`/demo-data/engine_${scenario}.json`);
  if (!res.ok) throw new Error(`Failed to load demo data: engine_${scenario}.json`);
  return res.json() as Promise<DemoRow[]>;
}

// A 30-cycle window positioned at the engine's life stage. The demo files run
// all the way to failure, so the *last* 30 cycles always predict ~0 RUL; instead
// we end the window at the recorded cycle whose RUL is closest to the engine's
// headline RUL, so the model's prediction is coherent with the fleet status.
// (The backend front-pads windows shorter than 30, so early matches are fine.)
export function windowEndingNear(rows: DemoRow[], targetRul: number, n = 30): number[][] {
  if (!rows.length) return [];
  let best = 0;
  let bestDiff = Infinity;
  rows.forEach((r, i) => {
    const d = Math.abs(r.rul - targetRul);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  });
  return rows.slice(Math.max(0, best - n + 1), best + 1).map((r) => r.sensors);
}
