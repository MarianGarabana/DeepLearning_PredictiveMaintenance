import styles from './StatusPill.module.css';
import { statusColor, statusSoft, statusLabel } from '@/lib/status';
import type { Status } from '@/lib/types';

export function StatusPill({ status, size = 'md' }: { status: Status; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`${styles.pill} ${size === 'sm' ? styles.sm : ''}`}
      style={{ color: statusColor(status), background: statusSoft(status) }}
    >
      <span className={styles.dot} />
      {statusLabel(status)}
    </span>
  );
}
