import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './FleetPage.module.css';
import { api } from '@/lib/api';
import type { EngineStatus, Status } from '@/lib/types';
import { FleetCard } from '@/components/FleetCard';
import { Loading, ErrorBox } from '@/components/States';
import { statusColor } from '@/lib/status';

const ORDER: Status[] = ['CRITICAL', 'WARNING', 'OK'];

export function FleetPage() {
  const [engines, setEngines] = useState<EngineStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEngines(await api.getFleet());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load fleet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading label="Loading fleet…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  const counts = ORDER.map((s) => ({
    status: s,
    n: engines.filter((e) => e.status === s).length,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Fleet Overview</h1>
          <p className={styles.sub}>
            {engines.length} turbofan engines · remaining useful life from live model inference
          </p>
        </div>
        <div className={styles.summary}>
          {counts.map((c) => (
            <div key={c.status} className={styles.stat}>
              <span className={`${styles.statN} mono`} style={{ color: statusColor(c.status) }}>
                {c.n}
              </span>
              <span className={styles.statL}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {engines.map((e) => (
          <FleetCard key={e.engine_id} engine={e} />
        ))}
      </div>

      <Link to="/simulate" className={styles.cta}>
        ▶ Run a live degradation simulation
      </Link>
    </div>
  );
}
