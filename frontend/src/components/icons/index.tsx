/**
 * The visual universe — a cohesive, hand-authored icon set for aerospace
 * turbofan predictive maintenance. Every glyph shares the <Glyph> base
 * (24px grid, currentColor, one stroke language) so the family is unmistakable.
 *
 * Groups: brand · sensor families · model metrics · status annunciators · nav.
 */
import React from 'react';
import { Glyph, GlyphProps } from './Glyph';

export { Glyph } from './Glyph';
export type { GlyphProps } from './Glyph';
export { EngineSchematic } from './EngineSchematic';

/* ── Brand ──────────────────────────────────────────────────────────────
 * Turbofan seen head-on: intake ring, radiating fan blades, spinner hub.
 */
export function TurbofanMark(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.6" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <path d="M12 9.4V4M14.85 10.4 18.7 6.6M15.6 12h5.4M14.85 13.6l3.85 3.8M12 14.6V20M9.15 13.6 5.3 17.4M8.4 12H3M9.15 10.4 5.3 6.6" />
    </Glyph>
  );
}

/* ── Sensor families ────────────────────────────────────────────────────*/

/** Temperature stations (T24/T30/T50) — EGT probe / thermometer. */
export function TemperatureGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M10.5 14.4V6.5a1.5 1.5 0 0 1 3 0v7.9" />
      <circle cx="12" cy="17" r="3.1" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" stroke="none" />
      <path d="M12 16v-4" />
      <path d="M15 8.5h1.8M15 11h1.8" />
    </Glyph>
  );
}

/** Pressure stations (P30/Ps30…) — dial gauge with needle. */
export function PressureGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 12 16 8.4" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <path d="M12 4v1.6M20 12h-1.6M4 12h1.6M12 20v-1.6" />
    </Glyph>
  );
}

/** Spool speed (Nf/Nc/NRc) — rotating spool / tachometer. */
export function SpeedGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M19 12a7 7 0 1 1-2.5-5.37" />
      <path d="M19 5.5V9h-3.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <path d="M12 12V8.4M12 12l3.1 1.6M12 12l-3.1 1.6" />
    </Glyph>
  );
}

/** Mass flow (W31/W32) — duct with flow chevrons. */
export function FlowGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M3 7.5h18M3 16.5h18" />
      <path d="M8 9l3 3-3 3M13.5 9l3 3-3 3" />
    </Glyph>
  );
}

/** Bleed air / ratios (htBleed/BPR/farB) — ISA gate-valve bowtie. */
export function BleedGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M5 8l7 4-7 4zM19 8l-7 4 7 4z" />
      <path d="M12 12V5.5M9.8 5.5h4.4" />
    </Glyph>
  );
}

/** Vibration / health residual — seismograph spike. */
export function VibrationGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M2 12h3.5l2-6 3.2 12L14 5l2 7h6" />
    </Glyph>
  );
}

/* ── Model metrics ──────────────────────────────────────────────────────*/

/** RMSE — residual scatter around the ideal line. */
export function RmseGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 20 20 4" strokeDasharray="2.5 2.5" />
      <circle cx="8.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="17" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="11" r="1.1" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

/** MAE — absolute deviations from a mean line. */
export function MaeGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M3 12h18" />
      <path d="M7 12V6.5M11 12v6M15 12V8.5M19 12v4.5" />
    </Glyph>
  );
}

/** NASA Score — asymmetric penalty curve (late predictions cost more). */
export function NasaScoreGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M3 19h18" />
      <path d="M5 7c2.8 6 4.2 10 6 10s3.5-3.5 8-13" />
      <circle cx="11" cy="17" r="1" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

/** Accuracy band — concentric ±10 / ±25 target rings. */
export function AccuracyBandGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

/** Remaining Useful Life — open-arc life gauge with needle. */
export function RulGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M5.4 18.4a9 9 0 1 1 13.2 0" />
      <path d="M12 12 8.6 8.2" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <path d="M5.4 18.4l1.4-1.2M18.6 18.4l-1.4-1.2" />
    </Glyph>
  );
}

/** Confidence interval — capped error bar. */
export function ConfidenceGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M12 4v16M8 4h8M8 20h8" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

/* ── Status annunciators (EICAS silhouettes: circle / diamond / octagon) ──*/

/** OK — advisory, healthy. */
export function OkMark(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.2l2.6 2.6L16 9" />
    </Glyph>
  );
}

/** Caution — amber semantics. */
export function CautionMark(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M12 3l9 9-9 9-9-9z" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16" r="0.9" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

/** Warning — red semantics, the loudest silhouette. */
export function WarningMark(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M8.2 3h7.6l5.2 5.2v7.6L15.8 21H8.2L3 15.8V8.2z" />
      <path d="M12 7v6" />
      <circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

/* ── Navigation / section glyphs ────────────────────────────────────────*/

/** Fleet — grid of engine discs. */
export function FleetGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      {[7, 12, 17].map((x) =>
        [8.5, 15.5].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.9" />
        ))
      )}
    </Glyph>
  );
}

/** Performance — rising trend line. */
export function PerformanceGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 20V4M4 20h16" />
      <path d="M7 16l4-4 3 2 5-7" />
      <path d="M19 7h-3M19 7v3" />
    </Glyph>
  );
}

/** Engine — side cross-section profile. */
export function EngineGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M3 9.5 7 11v2l-4 1.5z" />
      <path d="M7 9.5h10l4 2.5-4 2.5H7z" />
      <path d="M11 9.5v5M14.5 9.5v5" />
    </Glyph>
  );
}

/** Simulation — play head over a timeline. */
export function SimulationGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M9 6.5l7 4.5-7 4.5z" />
      <path d="M4 19.5h16M8 19.5v-2M12 19.5v-2M16 19.5v-2" />
    </Glyph>
  );
}

/** What-if — twin slider levers. */
export function WhatIfGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 9h16M4 15h16" />
      <circle cx="9" cy="9" r="2.2" fill="var(--surface-raised, #fff)" />
      <circle cx="15" cy="15" r="2.2" fill="var(--surface-raised, #fff)" />
    </Glyph>
  );
}
