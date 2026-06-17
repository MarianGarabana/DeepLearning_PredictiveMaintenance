// The backend reports contributing sensors as "S<n>" where n is the 1-based
// CMAPSS sensor number (predict.py: "sensor_9" -> "S9"). That maps to raw
// array index n-1 in the 21-value sensor row the demo data / API uses.
//
// Symbolic NASA names, by raw index, kept for reference / tooltips.
export const SENSOR_NAMES = [
  'T2', 'T24', 'T30', 'T50', 'P2', 'P15', 'P30', 'Nf', 'Nc', 'epr',
  'Ps30', 'phi', 'NRf', 'NRc', 'BPR', 'farB', 'htBleed', 'Nf_dmd', 'PCNfR_dmd', 'W31', 'W32',
] as const;

// "S9" -> 8. Returns -1 for anything that isn't a sensor column (e.g. "OP SET 1").
export function sensorRawIndex(name: string): number {
  const m = /^S(\d+)$/i.exec(name.trim());
  if (!m) return -1;
  const n = Number(m[1]);
  return n >= 1 && n <= 21 ? n - 1 : -1;
}

// "S9" -> "S9 · Nc" for friendlier chart labels.
export function sensorLabel(name: string): string {
  const idx = sensorRawIndex(name);
  return idx >= 0 ? `${name} · ${SENSOR_NAMES[idx]}` : name;
}

// Distinct line colors for multi-sensor charts.
export const SENSOR_COLORS = ['#00d4ff', '#f5a623', '#a78bfa', '#2ecc71', '#ff6b9d'];
