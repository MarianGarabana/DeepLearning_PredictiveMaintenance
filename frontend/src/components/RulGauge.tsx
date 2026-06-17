import { useEffect, useRef, useState } from 'react';
import styles from './RulGauge.module.css';
import { StatusPill } from './StatusPill';
import { statusColor } from '@/lib/status';
import type { Status } from '@/lib/types';

interface RulGaugeProps {
  rul: number;
  status: Status;
  ciLower?: number;
  ciUpper?: number;
  max?: number;
  animate?: boolean;
}

const CX = 120;
const CY = 130;
const R = 100; // value-arc radius
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Point on the upper semicircle at fraction f (0 = left/empty, 1 = right/full).
function pointAt(f: number, radius: number) {
  const phi = (1 - f) * Math.PI;
  return { x: CX + radius * Math.cos(phi), y: CY - radius * Math.sin(phi) };
}

export function RulGauge({ rul, status, ciLower, ciUpper, max = 125, animate = true }: RulGaugeProps) {
  const [shown, setShown] = useState(animate ? 0 : rul);
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    if (!animate) {
      setShown(rul);
      return;
    }
    const from = shownRef.current;
    const to = rul;
    const dur = 450;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(from + (to - from) * eased);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [rul, animate]);

  const color = statusColor(status);
  const f = clamp(shown / max, 0, 1);
  const rot = (f - 0.5) * 180; // needle rotation, -90deg (empty) .. +90deg (full)
  const needle = R * 0.72;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((tf) => ({
    tf,
    label: Math.round(tf * max),
    inner: pointAt(tf, R - 7),
    outer: pointAt(tf, R),
    text: pointAt(tf, R + 15),
  }));

  const hasCi = ciLower !== undefined && ciUpper !== undefined;
  const loF = hasCi ? clamp(ciLower! / max, 0, 1) : 0;
  const hiF = hasCi ? clamp(ciUpper! / max, 0, 1) : 0;

  return (
    <div className={styles.wrap}>
      <svg className={styles.dial} viewBox="0 0 240 142" role="img" aria-label={`RUL ${rul.toFixed(0)} of ${max}`}>
        {/* track */}
        <path className={styles.track} d="M 20 130 A 100 100 0 0 1 220 130" fill="none" strokeWidth={10} strokeLinecap="round" />

        {/* CI bracket (outer, faint) */}
        {hasCi && hiF > loF && (
          <path
            d="M 8 130 A 112 112 0 0 1 232 130"
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeOpacity={0.4}
            pathLength={100}
            strokeDasharray={`0 ${loF * 100} ${(hiF - loF) * 100} 100`}
          />
        )}

        {/* value arc */}
        <path
          d="M 20 130 A 100 100 0 0 1 220 130"
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${f * 100} 100`}
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: animate ? 'stroke-dasharray .12s linear' : 'none' }}
        />

        {/* ticks */}
        {ticks.map((t) => (
          <g key={t.label}>
            <line x1={t.inner.x} y1={t.inner.y} x2={t.outer.x} y2={t.outer.y} stroke="var(--text-faint)" strokeWidth={1.5} />
            <text className={styles.tickLabel} x={t.text.x} y={t.text.y} textAnchor="middle" dominantBaseline="middle">
              {t.label}
            </text>
          </g>
        ))}

        {/* needle */}
        <g style={{ transform: `rotate(${rot}deg)`, transformOrigin: `${CX}px ${CY}px`, transition: animate ? 'transform .12s linear' : 'none' }}>
          <line x1={CX} y1={CY} x2={CX} y2={CY - needle} stroke={color} strokeWidth={3} strokeLinecap="round" />
        </g>
        <circle cx={CX} cy={CY} r={7} fill="var(--panel)" stroke={color} strokeWidth={2.5} />
      </svg>

      <div className={styles.readout}>
        <div className={styles.value} style={{ color }}>
          {shown.toFixed(0)}
        </div>
        <div className={styles.unit}>Cycles RUL</div>
        <div className={styles.pill}>
          <StatusPill status={status} />
        </div>
        {hasCi && (
          <div className={`${styles.ci} mono`}>
            95% CI&nbsp; {ciLower!.toFixed(0)} – {ciUpper!.toFixed(0)}
          </div>
        )}
      </div>
    </div>
  );
}
