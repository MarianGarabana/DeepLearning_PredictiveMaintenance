import type { Status } from './types';

// Maps the API status string -> theme tokens. The backend (utils.rul_to_status)
// is the single source of truth for the thresholds; we never recompute them.
const TOKEN: Record<Status, string> = {
  OK: '--ok',
  WARNING: '--warn',
  CRITICAL: '--crit',
};

export function statusColor(status: Status): string {
  return `var(${TOKEN[status] ?? '--text-dim'})`;
}

export function statusSoft(status: Status): string {
  return `var(${TOKEN[status] ?? '--text-dim'}-soft)`;
}

export function statusGlow(status: Status): string {
  return `var(${TOKEN[status] ?? '--text-dim'}-glow)`;
}

export function statusLabel(status: Status): string {
  return status === 'OK' ? 'NOMINAL' : status;
}
