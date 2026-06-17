import { useState } from 'react';
import styles from './SimulatePage.module.css';
import { useSimulation } from '@/hooks/useSimulation';
import { sensorRawIndex, sensorLabel, SENSOR_COLORS } from '@/lib/sensors';
import type { Scenario } from '@/lib/types';
import { RulGauge } from '@/components/RulGauge';
import { SensorChart } from '@/components/SensorChart';
import { LiveBadge } from '@/components/LiveBadge';
import { ErrorBox } from '@/components/States';

const SCENARIOS: { id: Scenario; label: string; blurb: string }[] = [
  { id: 'healthy', label: 'Healthy', blurb: 'Stable, high RUL' },
  { id: 'degrading', label: 'Degrading', blurb: 'Gradual decline' },
  { id: 'critical', label: 'Critical', blurb: 'Imminent failure' },
];

const STREAM_SENSORS = ['S9', 'S11', 'S4'];

export function SimulatePage() {
  const [scenario, setScenario] = useState<Scenario>('degrading');
  const sim = useSimulation();

  const running = sim.phase === 'running';
  const paused = sim.phase === 'paused';
  const active = running || paused || sim.phase === 'done';

  const series = STREAM_SENSORS.map((n, i) => ({
    key: n,
    name: sensorLabel(n),
    color: SENSOR_COLORS[i % SENSOR_COLORS.length],
  }));
  const sensorData = sim.history.map((p) => {
    const o: Record<string, number> = { cycle: p.cycle };
    STREAM_SENSORS.forEach((n) => (o[n] = p.sensors[sensorRawIndex(n)]));
    return o;
  });
  const rulData = sim.history.map((p) => ({ cycle: p.cycle, rul: p.rul }));
  const progress = sim.totalCycles ? (sim.cycle / sim.totalCycles) * 100 : 0;

  let primaryLabel = 'Start';
  let primaryAction: () => void = () => {
    void sim.start(scenario);
  };
  if (running) {
    primaryLabel = 'Pause';
    primaryAction = sim.pause;
  } else if (paused) {
    primaryLabel = 'Resume';
    primaryAction = sim.resume;
  } else if (sim.phase === 'done') {
    primaryLabel = 'Restart';
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Live Simulation</h1>
          <p className={styles.sub}>
            Streams a recorded engine run through the backend one cycle per second.
          </p>
        </div>
        {active && <LiveBadge label={running ? 'LIVE' : sim.phase === 'done' ? 'ENDED' : 'PAUSED'} active={running} />}
      </div>

      <div className={styles.controls}>
        <div className={styles.picker}>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              className={`${styles.scenario} ${scenario === s.id ? styles.scenarioOn : ''}`}
              onClick={() => setScenario(s.id)}
              disabled={running || paused}
            >
              <span className={styles.scLabel}>{s.label}</span>
              <span className={styles.scBlurb}>{s.blurb}</span>
            </button>
          ))}
        </div>
        <div className={styles.buttons}>
          <button className={styles.primary} onClick={primaryAction}>
            {primaryLabel}
          </button>
          <button className={styles.reset} onClick={sim.reset} disabled={sim.phase === 'idle'}>
            Reset
          </button>
        </div>
      </div>

      {active && (
        <div className={styles.progressWrap}>
          <div className={styles.progressMeta}>
            <span className="mono">
              cycle {sim.cycle} / {sim.totalCycles}
            </span>
            <span className="mono">{progress.toFixed(0)}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {sim.phase === 'error' ? (
        <ErrorBox message={sim.error ?? 'Simulation failed'} onRetry={() => sim.start(scenario)} />
      ) : sim.phase === 'idle' ? (
        <div className={styles.idle}>
          <div className={styles.idleArt} />
          <p>
            Pick a scenario and press <strong>Start</strong> to watch the model track an engine’s
            remaining useful life in real time.
          </p>
        </div>
      ) : (
        <div className={styles.live}>
          <div className={styles.gaugePanel}>
            <RulGauge rul={sim.rul} status={sim.status} />
          </div>
          <div className={styles.charts}>
            <SensorChart title="Sensor stream" data={sensorData} series={series} xLabel="cycle" />
            <SensorChart
              title="Predicted RUL"
              data={rulData}
              series={[{ key: 'rul', name: 'RUL', color: '#00d4ff' }]}
              xLabel="cycle"
              yDomain={[0, 130]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
