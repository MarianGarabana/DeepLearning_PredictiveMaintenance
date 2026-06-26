import React from 'react';
import { OkMark, CautionMark, WarningMark } from '@/components/icons';
import { RulStatus, statusInk, statusLabel } from '@/lib/thermal';

/** Instrument panel — the single card primitive (replaces the cloned divs). */
export function Panel({
  className = '',
  raised = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { raised?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-hairline ${
        raised ? 'bg-surface-raised shadow-panel-raised' : 'bg-surface shadow-panel'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/** Uppercase mono eyebrow — encodes section/context, not decoration. */
export function Eyebrow({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

/** EICAS-style status pill: silhouette + label, thermal-inked. */
export function StatusAnnunciator({
  status,
  size = 16,
  className = '',
}: {
  status: RulStatus;
  size?: number;
  className?: string;
}) {
  const ink = statusInk(status);
  const Icon =
    status === 'OK' ? OkMark : status === 'WARNING' ? CautionMark : WarningMark;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-xs font-semibold ${className}`}
      style={{ color: ink, borderColor: `${ink}55`, backgroundColor: `${ink}12` }}
    >
      <Icon size={size} />
      {statusLabel(status)}
    </span>
  );
}
