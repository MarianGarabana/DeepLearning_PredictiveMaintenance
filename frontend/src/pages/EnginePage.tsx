import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import styles from './EnginePage.module.css';
import { api } from '@/lib/api';
import type { DemoRow, EngineStatus, PredictResponse } from '@/lib/types';
import { scenarioForRul, loadDemo, windowEndingNear } from '@/lib/scenario';
import { sensorRawIndex, sensorLabel, SENSOR_COLORS } from '@/lib/sensors';
import { RulGauge } from '@/components/RulGauge';
import { TopSensors } from '@/components/TopSensors';
import { SensorChart } from '@/components/SensorChart';
import { StatusPill } from '@/components/StatusPill';
import { Loading, ErrorBox } from '@/components/States';

const FALLBACK_SENSORS = ['S9', 'S11', 'S4'];

export function EnginePage() {
  const { id = '' } = useParams();
  const headline = (useLocation().state as { engine?: EngineStatus } | null)?.engine;

  const [engine, setEngine] = useState<EngineStatus | undefined>(headline);
  const [rows, setRows] = useState<DemoRow[]>([]);
  const [pred, setPred] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predError, setPredError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      setPred(null);
      setPredError(null);
      try {
        let eng = headline;
        if (!eng) {
          const fleet = await api.getFleet();
          eng = fleet.find((e) => e.engine_id === id);
          if (!eng) throw new Error(`Engine "${id}" was not found in the fleet.`);
        }
        if (!alive) return;
        setEngine(eng);

        const demo = await loadDemo(scenarioForRul(eng.rul));
        if (!alive) return;
        setRows(demo);

        try {
          const p = await api.predict({
            engine_id: eng.engine_id,
            sensor_window: windowEndingNear(demo, eng.rul, 30),
          });
          if (alive) setPred(p);
        } catch (e) {
          if (alive) setPredError(e instanceof Error ? e.message : 'Model inference failed');
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Failed to load engine');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <Loading label={`Loading ${id}…`} />;
  if (error) return <ErrorBox message={error} />;
  if (!engine) return <ErrorBox message="Engine unavailable." />;

  // Gauge + status are the fleet headline (the value on the card the user clicked),
  // so the detail view stays coherent with the fleet grid. /predict drives the
  // real top-sensor attribution; CI is the backend's flat ±15% band around the RUL.
  const rul = engine.rul;
  const status = engine.status;
  const ciLower = Math.max(0, rul * 0.85);
  const ciUpper = rul * 1.15;
  const scenario = scenarioForRul(rul);

  // Which sensors to trend: the model's top contributors, else informative defaults.
  const names = (pred?.top_sensors.slice(0, 3).map((s) => s.name) ?? FALLBACK_SENSORS).filter(
    (n) => sensorRawIndex(n) >= 0,
  );
  const series = names.map((n, i) => ({
    key: n,
    name: sensorLabel(n),
    color: SENSOR_COLORS[i % SENSOR_COLORS.length],
  }));
  const sensorData = rows.map((r) => {
    const o: Record<string, number> = { cycle: r.cycle };
    names.forEach((n) => (o[n] = r.sensors[sensorRawIndex(n)]));
    return o;
  });
  const rulData = rows.map((r) => ({ cycle: r.cycle, rul: r.rul }));

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>
        ← Fleet
      </Link>

      <div className={styles.head}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{engine.engine_id}</h1>
          <StatusPill status={status} />
        </div>
        <div className={styles.meta}>
          <span>
            Demo profile: <span className={styles.scenario}>{scenario}</span>
          </span>
          <span className={styles.dot}>·</span>
          <span>{rows.length} recorded cycles</span>
        </div>
      </div>

      {predError && (
        <div className={styles.warn}>
          Sensor attribution unavailable ({predError}). The RUL gauge and recorded history are
          unaffected.
        </div>
      )}

      <div className={styles.top}>
        <div className={styles.panel}>
          <div className={styles.panelLabel}>Remaining Useful Life</div>
          <RulGauge rul={rul} status={status} ciLower={ciLower} ciUpper={ciUpper} />
        </div>
        <div className={styles.side}>
          {pred && pred.top_sensors.length > 0 ? (
            <TopSensors sensors={pred.top_sensors} />
          ) : (
            <div className={styles.placeholder}>
              Top-sensor attribution requires the model. Backend reported it unavailable.
            </div>
          )}
        </div>
      </div>

      <div className={styles.charts}>
        <SensorChart
          title="Sensor trends over cycles"
          data={sensorData}
          series={series}
          xLabel="cycle"
        />
        <SensorChart
          title="RUL degradation profile"
          data={rulData}
          series={[{ key: 'rul', name: 'RUL', color: '#00d4ff' }]}
          xLabel="cycle"
          yDomain={[0, 'auto']}
        />
      </div>
    </div>
  );
}
