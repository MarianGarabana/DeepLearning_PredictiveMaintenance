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

export const FAMILY_META: Record<SensorFamily, FamilyMeta> = {
  temperature: { label: 'Temperature', color: '#B26A00', Glyph: TemperatureGlyph },
  pressure: { label: 'Pressure', color: '#3B6E8F', Glyph: PressureGlyph },
  speed: { label: 'Spool speed', color: '#2A506A', Glyph: SpeedGlyph },
  flow: { label: 'Mass flow', color: '#1F6E55', Glyph: FlowGlyph },
  bleed: { label: 'Bleed · ratio', color: '#7A6A55', Glyph: BleedGlyph },
  vibration: { label: 'Vibration', color: '#6E5A7A', Glyph: VibrationGlyph },
  setting: { label: 'Op. setting', color: '#8C857B', Glyph: WhatIfGlyph },
};

interface ChannelSpec {
  family: SensorFamily;
  station: EngineStation;
}

// CMAPSS FD001 sensor index (1–21) → canonical name + classification.
const CMAPSS_SENSORS: Record<number, { name: string } & ChannelSpec> = {
  1: { name: 'T2', family: 'temperature', station: 'fan' },
  2: { name: 'T24', family: 'temperature', station: 'lpc' },
  3: { name: 'T30', family: 'temperature', station: 'hpc' },
  4: { name: 'T50', family: 'temperature', station: 'lpt' },
  5: { name: 'P2', family: 'pressure', station: 'fan' },
  6: { name: 'P15', family: 'pressure', station: 'lpc' },
  7: { name: 'P30', family: 'pressure', station: 'hpc' },
  8: { name: 'Nf', family: 'speed', station: 'fan' },
  9: { name: 'Nc', family: 'speed', station: 'hpc' },
  10: { name: 'epr', family: 'pressure', station: 'hpc' },
  11: { name: 'Ps30', family: 'pressure', station: 'hpc' },
  12: { name: 'phi', family: 'bleed', station: 'combustor' },
  13: { name: 'NRf', family: 'speed', station: 'fan' },
  14: { name: 'NRc', family: 'speed', station: 'hpc' },
  15: { name: 'BPR', family: 'bleed', station: 'nozzle' },
  16: { name: 'farB', family: 'bleed', station: 'combustor' },
  17: { name: 'htBleed', family: 'bleed', station: 'hpt' },
  18: { name: 'Nf_dmd', family: 'speed', station: 'fan' },
  19: { name: 'PCNfR_dmd', family: 'speed', station: 'hpc' },
  20: { name: 'W31', family: 'flow', station: 'hpt' },
  21: { name: 'W32', family: 'flow', station: 'lpt' },
};

function classify(raw: string): ChannelSpec {
  const name = raw.trim();
  const lower = name.toLowerCase();

  if (lower.startsWith('op_set') || lower.startsWith('op ')) {
    return { family: 'setting', station: 'fan' };
  }

  const sensorKey = lower.match(/^sensor[_ ]?(\d+)$/);
  if (sensorKey) {
    const spec = CMAPSS_SENSORS[Number(sensorKey[1])];
    if (spec) return { family: spec.family, station: spec.station };
  }

  // Friendly-name fallback by leading token.
  if (lower.startsWith('t')) return { family: 'temperature', station: 'hpc' };
  if (lower.startsWith('ps') || lower.startsWith('p') || lower === 'epr')
    return { family: 'pressure', station: 'hpc' };
  if (['bpr', 'farb', 'htbleed', 'phi'].includes(lower))
    return { family: 'bleed', station: 'combustor' };
  if (lower.startsWith('n')) return { family: 'speed', station: 'fan' };
  if (lower.startsWith('w')) return { family: 'flow', station: 'lpt' };
  return { family: 'vibration', station: 'hpc' };
}

export interface SensorMeta extends FamilyMeta, ChannelSpec {
  /** Display name (canonical CMAPSS name where resolvable). */
  name: string;
}

/** Resolve any sensor name or feature key to its full display metadata. */
export function getSensorMeta(raw: string): SensorMeta {
  const lower = raw.trim().toLowerCase();
  const sensorKey = lower.match(/^sensor[_ ]?(\d+)$/);
  const name = sensorKey
    ? CMAPSS_SENSORS[Number(sensorKey[1])]?.name ?? raw
    : raw;
  const spec = classify(raw);
  return { name, ...spec, ...FAMILY_META[spec.family] };
}
