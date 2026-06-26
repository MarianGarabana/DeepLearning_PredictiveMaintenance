import React from 'react';

export interface GlyphProps extends React.SVGProps<SVGSVGElement> {
  /** Pixel size for a square icon. Default 24. */
  size?: number;
  /** Stroke weight on the 24px grid. Default 1.75. */
  strokeWidth?: number;
  /** Optional accessible label; when omitted the glyph is aria-hidden. */
  title?: string;
}

/**
 * Shared base for the whole icon universe. Every glyph is drawn on a 24px
 * grid, inherits colour via `currentColor`, and shares one stroke language
 * (round caps/joins, consistent weight) so the set reads as one system.
 */
export function Glyph({
  size = 24,
  strokeWidth = 1.75,
  title,
  children,
  ...props
}: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}
