'use client';

import React, { useMemo } from 'react';
import { SensorImportance } from '@/lib/types';
import { Panel, Eyebrow } from '@/components/ui';
import { getSensorMeta } from '@/lib/sensorMeta';

interface FeatureImportanceProps {
  sensors: SensorImportance[];
  title?: string;
}

export function FeatureImportance({ sensors, title = 'Top sensor drivers' }: FeatureImportanceProps) {
  const rows = useMemo(() => {
    const sorted = [...sensors].sort((a, b) => b.importance - a.importance).slice(0, 8);
    const max = sorted[0]?.importance ?? 1;
    return sorted.map((s) => ({ ...s, meta: getSensorMeta(s.name), pct: (s.importance / max) * 100 }));
  }, [sensors]);

  return (
    <Panel className="p-6">
      <div className="mb-4">
        <Eyebrow>Attribution</Eyebrow>
        <h3 className="mt-1 font-display text-lg font-semibold text-ink">{title}</h3>
      </div>

      {rows.length === 0 ? (
        <div className="flex h-[300px] flex-col items-center justify-center gap-1 text-center">
          <span className="eyebrow">No attribution yet</span>
          <p className="text-sm text-ink-faint">Run the demo to rank which sensors drive the prediction.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map(({ name, importance, meta, pct }) => {
            const Glyph = meta.Glyph;
            return (
              <li key={name} className="flex items-center gap-3">
                <span className="flex w-20 shrink-0 items-center gap-1.5" style={{ color: meta.color }}>
                  <Glyph size={16} />
                  <span className="font-mono text-xs text-ink">{name}</span>
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-sunk">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: meta.color }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-xs text-ink-soft">
                  {importance.toFixed(3)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
