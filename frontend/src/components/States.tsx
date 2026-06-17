import styles from './States.module.css';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className={styles.center}>
      <span className={styles.spinner} />
      <span className={styles.text}>{label}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className={styles.center}>
      <div className={styles.errBox}>
        <div className={styles.errTitle}>Something went wrong</div>
        <div className={styles.errMsg}>{message}</div>
        {onRetry && (
          <button className={styles.retry} onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
