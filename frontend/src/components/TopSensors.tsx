import styles from './TopSensors.module.css';
import type { SensorImportance } from '@/lib/types';

export function TopSensors({ sensors }: { sensors: SensorImportance[] }) {
  const max = Math.max(...sensors.map((s) => s.importance), 1e-6);
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Top Contributing Sensors</h3>
      <ul className={styles.list}>
        {sensors.map((s, i) => (
          <li key={s.name} className={styles.row}>
            <span className={styles.rank}>{i + 1}</span>
            <span className={styles.name}>{s.name}</span>
            <span className={styles.track}>
              <span className={styles.fill} style={{ width: `${(s.importance / max) * 100}%` }} />
            </span>
            <span className={`${styles.val} mono`}>{(s.importance * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
