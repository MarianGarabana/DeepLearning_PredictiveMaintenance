'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  RUL_MAX,
  statusForRul,
  statusInk,
  statusLabel,
  thermalRamp,
} from '@/lib/thermal';
import { OkMark, CautionMark, WarningMark } from '@/components/icons';

interface RULGaugeProps {
  rul: number;
  ciLower?: number;
  ciUpper?: number;
  animate?: boolean;
}

const CX = 120;
const CY = 120;
const R = 92; // track radius
const START = 135; // degrees (down-left)
const SWEEP = 270; // total travel
const SEGMENTS = 56;

const polar = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};

const arc = (r: number, a0: number, a1: number): string => {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
};

const angleFor = (value: number) =>
  START + (Math.max(0, Math.min(RUL_MAX, value)) / RUL_MAX) * SWEEP;

const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInOut = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

export function RULGauge({ rul, ciLower, ciUpper, animate = true }: RULGaugeProps) {
  const prefersReduced = useReducedMotion();
  const motion = animate && !prefersReduced;
  const [displayRul, setDisplayRul] = useState(motion ? 0 : rul);
  const poweredOn = useRef(false);

  // Power-on self-test: sweep 0 → max → settle on value (runs once).
  useEffect(() => {
    if (!motion) {
      setDisplayRul(rul);
      poweredOn.current = true;
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const up = 520;
    const settle = 1000;
    const target = rul;
    const tick = (now: number) => {
      const e = now - t0;
      if (e < up) {
        setDisplayRul(RUL_MAX * easeOut(e / up));
      } else if (e < up + settle) {
        const p = (e - up) / settle;
        setDisplayRul(RUL_MAX + (target - RUL_MAX) * easeInOut(p));
      } else {
        setDisplayRul(target);
        poweredOn.current = true;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subsequent value changes (e.g. simulation): quick tween, skip first mount.
  useEffect(() => {
    if (!poweredOn.current) return;
    if (!motion) {
      setDisplayRul(rul);
      return;
    }
    let raf = 0;
    const from = displayRul;
    const t0 = performance.now();
    const dur = 450;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setDisplayRul(from + (rul - from) * easeInOut(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rul]);

  const status = statusForRul(displayRul);
  const ink = statusInk(status);
  const needleAngle = angleFor(displayRul);
  const [nx, ny] = polar(R - 16, needleAngle);
  const [tailX, tailY] = polar(14, needleAngle + 180);

  const StatusIcon =
    status === 'OK' ? OkMark : status === 'WARNING' ? CautionMark : WarningMark;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-72 max-w-full">
        <svg viewBox="0 0 240 240" className="w-full">
          {/* Recessed track */}
          <path
            d={arc(R, START, START + SWEEP)}
            fill="none"
            stroke="#E2DED7"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Thermal gradient track — left=critical, right=healthy */}
          {Array.from({ length: SEGMENTS }).map((_, i) => {
            const a0 = START + (i / SEGMENTS) * SWEEP;
            const a1 = START + ((i + 1) / SEGMENTS) * SWEEP + 0.6;
            return (
              <path
                key={i}
                d={arc(R, a0, a1)}
                fill="none"
                stroke={thermalRamp(i / SEGMENTS)}
                strokeWidth="10"
                strokeLinecap="butt"
                opacity={displayRul >= (i / SEGMENTS) * RUL_MAX ? 1 : 0.22}
              />
            );
          })}

          {/* Confidence band */}
          {ciLower !== undefined && ciUpper !== undefined && (
            <path
              d={arc(R + 13, angleFor(ciLower), angleFor(ciUpper))}
              fill="none"
              stroke={ink}
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.55"
            />
          )}

          {/* Ticks + labels */}
          {[0, 25, 50, 75, 100, 125].map((v) => {
            const a = angleFor(v);
            const [x1, y1] = polar(R - 18, a);
            const [x2, y2] = polar(R - 11, a);
            const [lx, ly] = polar(R - 30, a);
            return (
              <g key={v}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8C857B" strokeWidth="1.5" />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fontFamily="var(--font-mono, monospace)"
                  fill="#8C857B"
                >
                  {v}
                </text>
              </g>
            );
          })}

          {/* Needle */}
          <line
            x1={tailX}
            y1={tailY}
            x2={nx}
            y2={ny}
            stroke="#1A1714"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx={CX} cy={CY} r="9" fill="#FBFAF8" stroke="#1A1714" strokeWidth="2" />
          <circle cx={CX} cy={CY} r="2.6" fill={ink} />

          {/* Central readout */}
          <text
            x={CX}
            y={CY + 58}
            textAnchor="middle"
            fontSize="46"
            fontFamily="var(--font-display, sans-serif)"
            fontWeight="600"
            fill={ink}
          >
            {displayRul.toFixed(1)}
          </text>
          <text
            x={CX}
            y={CY + 76}
            textAnchor="middle"
            fontSize="9.5"
            letterSpacing="3"
            fontFamily="var(--font-mono, monospace)"
            fill="#5A544C"
          >
            CYCLES RUL
          </text>
        </svg>
      </div>

      {/* Status + confidence readout */}
      <div className="mt-1 flex flex-col items-center gap-2">
        <span
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-display text-sm font-semibold"
          style={{ color: ink, borderColor: ink, backgroundColor: `${ink}12` }}
        >
          <StatusIcon size={16} />
          {statusLabel(status)}
        </span>
        {ciLower !== undefined && ciUpper !== undefined && (
          <span className="font-mono text-xs text-ink-soft">
            95% CI · {ciLower.toFixed(0)}–{ciUpper.toFixed(0)} cycles
          </span>
        )}
      </div>
    </div>
  );
}
