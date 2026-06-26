/**
 * Sensor → family metadata. Groups the CMAPSS channels into six instrument
 * families, each with its own glyph, a muted on-brand line colour (saturated
 * colour stays reserved for the thermal scale), and a gas-path station so a
 * reading can be "placed" on the EngineSchematic.
 *
 * Accepts both the dashboard's friendly names (T24, P30, Nf, W31…) and the
 * model's raw feature keys (sensor_3, op_set_1…).
 */
import type { ComponentType } from 'react';
import type { GlyphProps } from '@/components/icons';
import type { EngineStation } from '@/components/icons/EngineSchematic';
import type { SensorImportance } from '@/lib/types';
import {
  TemperatureGlyph,
  PressureGlyph,
  SpeedGlyph,
  FlowGlyph,
  BleedGlyph,
  VibrationGlyph,
  WhatIfGlyph,
} from '@/components/icons';

export type SensorFamily =
  | 'temperature'
  | 'pressure'
  | 'speed'
  | 'flow'
  | 'bleed'
  | 'vibration'
  | 'setting';

export interface FamilyMeta {
  label: string;
  /** Muted categorical colour for chart series + chips. */
  color: string;
  Glyph: ComponentType<GlyphProps>;
}

// Brighter categorical colours so each family reads on the dark ground.
export const FAMILY_META: Record<SensorFamily, FamilyMeta> = {
  temperature: { label: 'Temperature', color: '#E8943A', Glyph: TemperatureGlyph },
  pressure: { label: 'Pressure', color: '#4FA3CC', Glyph: PressureGlyph },
  speed: { label: 'Spool speed', color: '#6AA8E0', Glyph: SpeedGlyph },
  flow: { label: 'Mass flow', color: '#3FBE94', Glyph: FlowGlyph },
  bleed: { label: 'Bleed · ratio', color: '#C7A878', Glyph: BleedGlyph },
  vibration: { label: 'Vibration', color: '#B08CC8', Glyph: VibrationGlyph },
  setting: { label: 'Op. setting', color: '#9FB0C8', Glyph: WhatIfGlyph },
};

interface ChannelSpec {
  family: SensorFamily;
  station: EngineStation;
}

// CMAPSS FD001 sensor index (1-21) → canonical name + classification + plain-language meaning.
const CMAPSS_SENSORS: Record<number, { name: string; desc: string } & ChannelSpec> = {
  1: { name: 'T2', desc: 'Total temperature at fan inlet', family: 'temperature', station: 'fan' },
  2: { name: 'T24', desc: 'Total temperature at LPC outlet', family: 'temperature', station: 'lpc' },
  3: { name: 'T30', desc: 'Total temperature at HPC outlet', family: 'temperature', station: 'hpc' },
  4: { name: 'T50', desc: 'Total temperature at LPT outlet (turbine exit)', family: 'temperature', station: 'lpt' },
  5: { name: 'P2', desc: 'Pressure at fan inlet', family: 'pressure', station: 'fan' },
  6: { name: 'P15', desc: 'Total pressure in the bypass duct', family: 'pressure', station: 'lpc' },
  7: { name: 'P30', desc: 'Total pressure at HPC outlet', family: 'pressure', station: 'hpc' },
  8: { name: 'Nf', desc: 'Physical fan (low-spool) speed', family: 'speed', station: 'fan' },
  9: { name: 'Nc', desc: 'Physical core (high-spool) speed', family: 'speed', station: 'hpc' },
  10: { name: 'epr', desc: 'Engine pressure ratio (P50 / P2)', family: 'pressure', station: 'hpc' },
  11: { name: 'Ps30', desc: 'Static pressure at HPC outlet', family: 'pressure', station: 'hpc' },
  12: { name: 'phi', desc: 'Ratio of fuel flow to Ps30', family: 'bleed', station: 'combustor' },
  13: { name: 'NRf', desc: 'Corrected fan speed', family: 'speed', station: 'fan' },
  14: { name: 'NRc', desc: 'Corrected core speed', family: 'speed', station: 'hpc' },
  15: { name: 'BPR', desc: 'Bypass ratio', family: 'bleed', station: 'nozzle' },
  16: { name: 'farB', desc: 'Burner fuel-air ratio', family: 'bleed', station: 'combustor' },
  17: { name: 'htBleed', desc: 'Bleed enthalpy', family: 'bleed', station: 'hpt' },
  18: { name: 'Nf_dmd', desc: 'Demanded fan speed', family: 'speed', station: 'fan' },
  19: { name: 'PCNfR_dmd', desc: 'Demanded corrected fan speed', family: 'speed', station: 'hpc' },
  20: { name: 'W31', desc: 'HPT coolant bleed flow', family: 'flow', station: 'hpt' },
  21: { name: 'W32', desc: 'LPT coolant bleed flow', family: 'flow', station: 'lpt' },
};

/** Matches the model's raw sensor keys (`sensor_9`) and the /predict short form (`S9`). */
const SENSOR_KEY_RE = /^(?:sensor[_ ]?|s)(\d+)$/;

function classify(raw: string): ChannelSpec {
  const name = raw.trim();
  const lower = name.toLowerCase();

  if (lower.startsWith('op_set') || lower.startsWith('op ')) {
    return { family: 'setting', station: 'fan' };
  }

  const sensorKey = lower.match(SENSOR_KEY_RE);
  if (sensorKey) {
    const spec = CMAPSS_SENSORS[Number(sensorKey[1])];
    if (spec) return { family: spec.family, station: spec.station };
  }

  // Friendly-name fallback by leading token. Check explicit bleed/ratio names
  // before the generic 'p' prefix so 'phi' is not mis-read as a pressure.
  if (['bpr', 'farb', 'htbleed', 'phi'].includes(lower))
    return { family: 'bleed', station: 'combustor' };
  if (lower.startsWith('t')) return { family: 'temperature', station: 'hpc' };
  if (lower.startsWith('ps') || lower.startsWith('p') || lower === 'epr')
    return { family: 'pressure', station: 'hpc' };
  if (lower.startsWith('n')) return { family: 'speed', station: 'fan' };
  if (lower.startsWith('w')) return { family: 'flow', station: 'lpt' };
  return { family: 'vibration', station: 'hpc' };
}

export interface SensorMeta extends FamilyMeta, ChannelSpec {
  /** Display name (canonical CMAPSS name where resolvable). */
  name: string;
  /** Plain-language meaning of the channel (for tooltips). */
  description: string;
}

/** Resolve any sensor name or feature key to its full display metadata. */
export function getSensorMeta(raw: string): SensorMeta {
  const lower = raw.trim().toLowerCase();
  const sensorKey = lower.match(SENSOR_KEY_RE);
  const opKey = lower.match(/^op[_ ]?set[_ ]?(\d+)$/);
  const sensorIdx = sensorKey ? Number(sensorKey[1]) : undefined;
  const name =
    sensorIdx !== undefined
      ? CMAPSS_SENSORS[sensorIdx]?.name ?? raw
      : opKey
      ? `Op ${opKey[1]}`
      : raw;
  const spec = classify(raw);
  const meta = FAMILY_META[spec.family];
  const description =
    sensorIdx !== undefined
      ? CMAPSS_SENSORS[sensorIdx]?.desc ?? meta.label
      : opKey
      ? `Operating-condition setting ${opKey[1]}`
      : meta.label;
  return { name, description, ...spec, ...meta };
}

/**
 * Convert the backend `feature_importance` dict (keyed by raw model feature
 * names - `sensor_9`, `op_set_1`) into the `{ name, importance }[]` the
 * FeatureImportance chart renders, resolving each key to its canonical CMAPSS
 * symbol (sensor_9 → Nc). Sorted highest-first.
 */
export function toSensorImportance(
  featureImportance: Record<string, number> | undefined,
): SensorImportance[] {
  if (!featureImportance) return [];
  return Object.entries(featureImportance)
    .map(([key, importance]) => ({ name: getSensorMeta(key).name, importance }))
    .sort((a, b) => b.importance - a.importance);
}
