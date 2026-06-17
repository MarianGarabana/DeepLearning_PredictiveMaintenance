import { Link } from 'react-router-dom';
import styles from './FleetCard.module.css';
import { StatusPill } from './StatusPill';
import { statusColor } from '@/lib/status';
import type { EngineStatus } from '@/lib/types';

function sinceLabel(iso: string): string {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${Math.round(secs)}s ago`;
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  return `${Math.round(secs / 3600)}h ago`;
}

export function FleetCard({ engine }: { engine: EngineStatus }) {
  const color = statusColor(engine.status);
  return (
    <Link
      to={`/engine/${engine.engine_id}`}
      state={{ engine }}
      className={styles.card}
      style={{ ['--c' as string]: color }}
    >
      <span className={styles.rail} />
      <div className={styles.head}>
        <span className={styles.id}>{engine.engine_id}</span>
        <StatusPill status={engine.status} size="sm" />
      </div>
      <div className={styles.rul} style={{ color }}>
        {engine.rul.toFixed(0)}
        <span className={styles.unit}>cyc</span>
      </div>
      <div className={styles.foot}>
        <span>Remaining useful life</span>
        <span className="mono">{sinceLabel(engine.last_updated)}</span>
      </div>
    </Link>
  );
}
