import styles from './LiveBadge.module.css';

export function LiveBadge({ label = 'LIVE', active = true }: { label?: string; active?: boolean }) {
  return (
    <span className={`${styles.badge} ${active ? styles.on : ''}`}>
      <span className={styles.dot} />
      {label}
    </span>
  );
}
