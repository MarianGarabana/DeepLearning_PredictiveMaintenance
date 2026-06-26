/**
 * The thermal language — the one place saturated colour lives.
 * Maps Remaining Useful Life onto heat: low RUL = critical/ember, high = healthy.
 */
export type RulStatus = 'OK' | 'WARNING' | 'CRITICAL';

export const RUL_MAX = 125;

// Matches backend rul_to_status thresholds.
export function statusForRul(rul: number): RulStatus {
  if (rul < 30) return 'CRITICAL';
  if (rul < 80) return 'WARNING';
  return 'OK';
}

export const THERMAL = {
  healthy: '#2E9E7B',
  healthyInk: '#1F6E55',
  warm: '#E0A100',
  warmInk: '#946800',
  ember: '#C8410B',
  critical: '#8E1B0E',
} as const;

/** Saturated fill colour for a status (gauge arcs, chips). */
export function statusFill(status: RulStatus): string {
  return status === 'OK'
    ? THERMAL.healthy
    : status === 'WARNING'
    ? THERMAL.warm
    : THERMAL.critical;
}

/** Darkened, text-legible colour for a status on the light ground. */
export function statusInk(status: RulStatus): string {
  return status === 'OK'
    ? THERMAL.healthyInk
    : status === 'WARNING'
    ? THERMAL.warmInk
    : THERMAL.critical;
}

export function statusLabel(status: RulStatus): string {
  return status === 'OK' ? 'NOMINAL' : status === 'WARNING' ? 'CAUTION' : 'WARNING';
}

// ── Continuous thermal ramp: t=0 (no life, critical) → t=1 (full life) ──
const STOPS: [number, string][] = [
  [0, THERMAL.critical],
  [0.24, THERMAL.ember],
  [0.42, THERMAL.warm],
  [0.64, THERMAL.healthy],
  [1, THERMAL.healthy],
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Interpolated thermal colour for a normalised position 0..1. */
export function thermalRamp(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  for (let i = 1; i < STOPS.length; i++) {
    const [t0, c0] = STOPS[i - 1];
    const [t1, c1] = STOPS[i];
    if (x <= t1) {
      const p = (x - t0) / (t1 - t0 || 1);
      const a = hexToRgb(c0);
      const b = hexToRgb(c1);
      return rgbToHex(
        a[0] + (b[0] - a[0]) * p,
        a[1] + (b[1] - a[1]) * p,
        a[2] + (b[2] - a[2]) * p
      );
    }
  }
  return STOPS[STOPS.length - 1][1];
}

export const rampForRul = (rul: number, max = RUL_MAX) => thermalRamp(rul / max);
