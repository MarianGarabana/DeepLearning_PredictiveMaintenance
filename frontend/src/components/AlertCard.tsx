'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CautionMark, WarningMark } from '@/components/icons';
import { THERMAL } from '@/lib/thermal';

interface AlertCardProps {
  rul: number;
  engineId: string;
  onDismiss?: () => void;
}

const PREVENTIVE_COST = 35000;
const FAILURE_COST = 500000;
const usd = (n: number) => `$${n.toLocaleString()}`;

export function AlertCard({ rul, engineId, onDismiss }: AlertCardProps) {
  const prefersReduced = useReducedMotion();
  if (rul >= 50) return null;

  const severe = rul < 30;
  const accent = severe ? THERMAL.critical : THERMAL.warmInk;
  const Icon = severe ? WarningMark : CautionMark;
  const tier = rul < 20 ? 'WARNING' : severe ? 'WARNING' : 'CAUTION';
  const savings = FAILURE_COST - PREVENTIVE_COST;

  return (
    <motion.div
      role="alert"
      initial={prefersReduced ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-6 right-6 z-50 w-[min(92vw,24rem)] overflow-hidden rounded-xl border border-hairline bg-surface-raised shadow-panel-raised"
    >
      <div className="h-1 w-full" style={{ backgroundColor: accent }} />
      <div className="flex gap-3 p-5">
        <span className="mt-0.5 shrink-0" style={{ color: accent }}>
          <Icon size={22} />
        </span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-bold tracking-wide" style={{ color: accent }}>
              {tier} · {engineId}
            </span>
            <span className="font-mono text-xs text-ink-soft">{rul.toFixed(1)} cyc</span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Schedule preventive maintenance before the hot section reaches failure.
          </p>

          <dl className="mt-3 space-y-1 rounded-lg bg-surface-sunk p-3 font-mono text-xs">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Unplanned failure</dt>
              <dd className="font-medium text-thermal-critical">{usd(FAILURE_COST)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Preventive action</dt>
              <dd className="font-medium text-thermal-healthy-ink">{usd(PREVENTIVE_COST)}</dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-hairline pt-1 font-semibold text-ink">
              <dt>Avoided cost</dt>
              <dd>{usd(savings)}</dd>
            </div>
          </dl>

          <div className="mt-3 flex gap-2">
            <button
              className="flex-1 rounded-lg px-3 py-2 font-display text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              Schedule maintenance
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm font-medium text-ink-soft transition hover:border-steel hover:text-ink"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
