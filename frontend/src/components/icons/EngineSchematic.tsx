import React from 'react';

export type EngineStation =
  | 'fan'
  | 'lpc'
  | 'hpc'
  | 'combustor'
  | 'hpt'
  | 'lpt'
  | 'nozzle';

interface EngineSchematicProps extends React.SVGProps<SVGSVGElement> {
  /** Tint a station steel to "place" a sensor along the gas path. */
  highlight?: EngineStation;
  /** Render station captions beneath the diagram. */
  labels?: boolean;
}

const COMPRESSOR = [
  { x: 56, h: 13 },
  { x: 68, h: 11.5 },
  { x: 80, h: 10 },
  { x: 92, h: 8.5 },
  { x: 104, h: 7.2 },
];
const TURBINE = [
  { x: 152, h: 8 },
  { x: 165, h: 10 },
  { x: 178, h: 12 },
  { x: 191, h: 13 },
];

const STEEL = 'var(--steel, #3b6e8f)';

/**
 * Turbofan gas-path cross-section - the signature explanatory graphic.
 * Inherits `currentColor` for the line-art; the combustor flame is the one
 * spot of ember, reinforcing "heat lives in the core."
 */
export function EngineSchematic({
  highlight,
  labels = false,
  ...props
}: EngineSchematicProps) {
  const tint = (s: EngineStation) =>
    highlight === s ? STEEL : 'currentColor';

  return (
    <svg
      viewBox="0 0 280 110"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Turbofan engine cross-section"
      {...props}
    >
      {/* Nacelle cowl outline */}
      <path d="M16 36C32 26 72 24 112 30c40 5 96 10 138 4l12 6" opacity="0.9" />
      <path d="M16 64C32 74 72 76 112 70c40-5 96-10 138-4l12-6" opacity="0.9" />
      {/* Intake lip */}
      <path d="M16 36a12 14 0 0 0 0 28" />

      {/* Spool shaft */}
      <path d="M34 50H198" opacity="0.45" />

      {/* Fan disc */}
      <g stroke={tint('fan')}>
        <path d="M32 32V68" strokeWidth="2.2" />
        <path d="M32 38l-6-3M32 47l-6-2M32 56l-6 2M32 62l-6 3" />
        <circle cx="32" cy="50" r="2.4" fill="currentColor" stroke="none" />
      </g>

      {/* Compressor stages - converging (LPC then HPC) */}
      {COMPRESSOR.map(({ x, h }, i) => (
        <path
          key={`c${x}`}
          d={`M${x} ${50 - h}V${50 + h}`}
          stroke={tint(i < 2 ? 'lpc' : 'hpc')}
        />
      ))}

      {/* Combustor - annular liner + flame */}
      <g stroke={tint('combustor')}>
        <rect x="114" y="41" width="32" height="18" rx="4" />
      </g>
      <path
        d="M130 43c3 3.4 3 6.6 0 11-3-4.4-3-7.6 0-11z"
        fill="var(--thermal-ember, #c8410b)"
        stroke="none"
      />
      <path
        d="M130 47c1.6 1.8 1.6 3.4 0 5.6-1.6-2.2-1.6-3.8 0-5.6z"
        fill="var(--thermal-warm, #e0a100)"
        stroke="none"
      />

      {/* Turbine stages - diverging (HPT then LPT) */}
      {TURBINE.map(({ x, h }, i) => (
        <path
          key={`t${x}`}
          d={`M${x} ${50 - h}V${50 + h}`}
          stroke={tint(i < 2 ? 'hpt' : 'lpt')}
        />
      ))}

      {/* Exhaust nozzle flow */}
      <g stroke={tint('nozzle')} opacity="0.9">
        <path d="M210 44l8 6-8 6M224 46l8 4-8 4" />
      </g>

      {labels && (
        <g
          fill="currentColor"
          stroke="none"
          opacity="0.55"
          fontSize="7"
          fontFamily="var(--font-mono, monospace)"
          textAnchor="middle"
        >
          <text x="32" y="84">FAN</text>
          <text x="74" y="84">LPC·HPC</text>
          <text x="130" y="84">COMB</text>
          <text x="172" y="84">HPT·LPT</text>
          <text x="226" y="84">NOZZLE</text>
        </g>
      )}
    </svg>
  );
}
