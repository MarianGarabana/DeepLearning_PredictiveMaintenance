'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TurbofanMark, FleetGlyph, PerformanceGlyph, GlyphProps } from '@/components/icons';

const NAV_LINKS: { href: string; label: string; Glyph: React.ComponentType<GlyphProps> }[] = [
  { href: '/', label: 'Fleet', Glyph: FleetGlyph },
  { href: '/performance', label: 'Performance', Glyph: PerformanceGlyph },
];

type Link = 'checking' | 'ok' | 'down';

export function Navigation() {
  const pathname = usePathname();
  const [link, setLink] = useState<Link>('checking');

  useEffect(() => {
    let active = true;
    api
      .health()
      .then((h) => active && setLink(h.model_loaded ? 'ok' : 'down'))
      .catch(() => active && setLink('down'));
    return () => {
      active = false;
    };
  }, []);

  const linkColor =
    link === 'ok' ? '#1F6E55' : link === 'down' ? '#8E1B0E' : '#8C857B';
  const linkLabel =
    link === 'ok' ? 'Link OK' : link === 'down' ? 'Link down' : 'Linking…';

  return (
    <nav className="sticky top-0 z-40 border-b border-hairline bg-surface-raised/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 md:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 text-ink">
          <span className="text-steel">
            <TurbofanMark size={28} />
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="font-display text-sm font-bold tracking-tight">
              PREDICTIVE&nbsp;MAINTENANCE
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              Turbofan · FD001
            </span>
          </span>
        </Link>

        {/* Sections */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, Glyph }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 font-display text-sm font-semibold transition ${
                  active
                    ? 'bg-steel-wash text-steel-deep'
                    : 'text-ink-soft hover:bg-surface-sunk hover:text-ink'
                }`}
              >
                <Glyph size={17} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Live API signal */}
        <div className="hidden items-center gap-2 sm:flex">
          <span
            className={`h-2 w-2 rounded-full ${link === 'checking' ? 'animate-pulse' : 'animate-signal-blink'}`}
            style={{ backgroundColor: linkColor }}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
            {linkLabel}
          </span>
        </div>
      </div>
    </nav>
  );
}
