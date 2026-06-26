'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { EngineStatus, SimulateStartResponse, SimulateNextResponse, ModelPerformanceResponse, SensorImportance } from '@/lib/types';
import { RULGauge } from '@/components/RULGauge';
import { SensorChart } from '@/components/SensorChart';
import { AlertCard } from '@/components/AlertCard';
import { FeatureImportance } from '@/components/FeatureImportance';
import { Panel, Eyebrow, StatusAnnunciator } from '@/components/ui';
import { RUL_MAX, statusForRul, statusInk, rampForRul } from '@/lib/thermal';
import { toSensorImportance } from '@/lib/sensorMeta';

interface SimulationState {
  isRunning: boolean;
  sessionId: string | null;
  currentCycle: number;
  totalCycles: number;
  currentRul: number;
  currentSensors: number[];
  sensorHistory: number[][];
  topSensors: SensorImportance[];
}

const EMPTY_SIM: SimulationState = {
  isRunning: false,
  sessionId: null,
  currentCycle: 0,
  totalCycles: 0,
  currentRul: 0,
  currentSensors: [],
  sensorHistory: [],
  topSensors: [],
};

export default function Home() {
  const [engines, setEngines] = useState<EngineStatus[]>([]);
  const [selectedEngine, setSelectedEngine] = useState<EngineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [simulation, setSimulation] = useState<SimulationState>(EMPTY_SIM);
  const [perf, setPerf] = useState<ModelPerformanceResponse | null>(null);
  // Per-engine degradation trajectories so the whole fleet ticks live during the demo.
  const [trajectories, setTrajectories] = useState<Record<string, number[]>>({});
  const [startIdx, setStartIdx] = useState<Record<string, number>>({});
  const prefersReduced = useReducedMotion();
  // Live-attribution plumbing: rolling 30-cycle window + an in-flight guard so
  // we never stack /predict calls. Failures fall back to static importance.
  const windowRef = useRef<number[][]>([]);
  const predictInFlight = useRef(false);

  // Each fleet card's RUL at the current demo cycle, walking its own trajectory
  // from its present state. Before the demo starts, show the /fleet snapshot.
  const fleetLiveRul = (e: EngineStatus) => {
    const traj = trajectories[e.engine_id];
    if (simulation.currentCycle === 0 || !traj || traj.length === 0) return e.rul;
    const start = startIdx[e.engine_id] ?? 0;
    return traj[Math.min(start + simulation.currentCycle, traj.length - 1)];
  };

  // Most-degraded engine - the one the eye should land on first.
  const mostCritical = useMemo(
    () =>
      engines.reduce<EngineStatus | null>(
        (worst, e) => (!worst || e.rul < worst.rul ? e : worst),
        null
      ),
    [engines]
  );

  useEffect(() => {
    async function loadFleet() {
      try {
        setLoading(true);
        const data = await api.fleet();
        setEngines(data);
        if (data.length > 0) {
          const worst = data.reduce((w, e) => (e.rul < w.rul ? e : w), data[0]);
          setSelectedEngine(worst);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fleet');
      } finally {
        setLoading(false);
      }
    }
    loadFleet();
  }, []);

  // Real gradient-attribution feature importance from the deployed model.
  useEffect(() => {
    api
      .modelPerformance()
      .then(setPerf)
      .catch((err) => console.error('Failed to load model performance:', err));
  }, []);

  // Load each engine's real degradation trajectory so all cards animate together.
  useEffect(() => {
    if (engines.length === 0) return;
    let active = true;
    Promise.all(
      engines.map((e) =>
        api
          .engineDetail(e.engine_id)
          .then((d) => ({ id: e.engine_id, rul: e.rul, hist: d.rul_history }))
          .catch(() => null),
      ),
    ).then((results) => {
      if (!active) return;
      const traj: Record<string, number[]> = {};
      const starts: Record<string, number> = {};
      for (const r of results) {
        if (!r || !r.hist || r.hist.length === 0) continue;
        traj[r.id] = r.hist;
        // Begin from the trajectory point closest to the engine's current RUL.
        let best = 0;
        let bestDelta = Infinity;
        r.hist.forEach((v, i) => {
          const delta = Math.abs(v - r.rul);
          if (delta < bestDelta) { bestDelta = delta; best = i; }
        });
        starts[r.id] = best;
      }
      setTrajectories(traj);
      setStartIdx(starts);
    });
    return () => { active = false; };
  }, [engines]);

  useEffect(() => {
    if (!simulation.isRunning || !simulation.sessionId) return;
    const timer = setInterval(async () => {
      try {
        const next: SimulateNextResponse = await api.simulateNext(simulation.sessionId!);
        setSimulation((prev) => ({
          ...prev,
          currentCycle: next.cycle,
          currentRul: next.rul,
          currentSensors: next.sensors,
          sensorHistory: [...prev.sensorHistory, next.sensors].slice(-80),
          isRunning: !next.done,
        }));

        // Live gradient attribution from the real model - throttled, non-blocking.
        // The gauge runs off the pre-computed RUL above, so this never affects it.
        windowRef.current = [...windowRef.current, next.sensors].slice(-30);
        if (next.sensors.length >= 21 && next.cycle % 6 === 0 && !predictInFlight.current) {
          predictInFlight.current = true;
          const sid = simulation.sessionId; // ignore the result if the run changed
          api
            .predict({ engine_id: selectedEngine?.engine_id ?? 'SIM', sensor_window: windowRef.current })
            .then((r) =>
              setSimulation((prev) =>
                prev.sessionId === sid && prev.isRunning ? { ...prev, topSensors: r.top_sensors } : prev,
              ),
            )
            .catch(() => {/* keep static fallback */})
            .finally(() => { predictInFlight.current = false; });
        }
      } catch (err) {
        console.error('Simulation error:', err);
        setSimulation((prev) => ({ ...prev, isRunning: false }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [simulation.isRunning, simulation.sessionId, selectedEngine?.engine_id]);

  const startSimulation = async () => {
    try {
      const start: SimulateStartResponse = await api.simulateStart({ scenario: 'degrading' });
      windowRef.current = [];
      predictInFlight.current = false;
      setSimulation({ ...EMPTY_SIM, isRunning: true, sessionId: start.session_id, totalCycles: start.total_cycles, currentRul: RUL_MAX });
      setAlertDismissed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start simulation');
    }
  };
  const pauseSimulation = () => setSimulation((p) => ({ ...p, isRunning: false }));
  const resetSimulation = () => {
    windowRef.current = [];
    setSimulation(EMPTY_SIM);
    setAlertDismissed(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <span className="eyebrow animate-pulse">Loading engines…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-2 text-center">
        <span className="eyebrow text-thermal-critical">Could not reach the server</span>
        <p className="text-ink-soft">{error}</p>
        <p className="text-sm text-ink-faint">Make sure the backend is running, then reload the page.</p>
      </div>
    );
  }

  const liveRul =
    simulation.isRunning || simulation.currentRul > 0
      ? simulation.currentRul
      : selectedEngine?.rul ?? 0;
  const liveStatus = statusForRul(liveRul);

  const fade = (delay = 0) =>
    prefersReduced
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  // Scroll-reveal for below-fold sections.
  const reveal = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-80px' },
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <main id="main" className="mx-auto max-w-7xl px-6 py-8 md:px-8">
      {/* ── Hero: the gauge is the thesis ──────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div {...fade(0)}>
          <Panel raised className="flex h-full flex-col items-center p-8 text-center">
            <Eyebrow>NASA CMAPSS FD001 · Engine health monitor</Eyebrow>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
              How much life is left?
            </h1>
            <p className="mt-2 max-w-md text-sm text-ink-soft">
              The dial shows how many flights{' '}
              <span className="font-mono text-ink">{selectedEngine?.engine_id}</span> has left before it
              needs a check-up. Green means healthy, red means fix it soon.
            </p>
            <div className="mt-4">
              <RULGauge rul={liveRul} animate />
            </div>
          </Panel>
        </motion.div>

        <motion.div {...fade(0.08)}>
          <Panel className="flex h-full flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <Eyebrow>Active engine</Eyebrow>
                <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                  {selectedEngine?.engine_id}
                </h2>
              </div>
              <StatusAnnunciator status={liveStatus} />
            </div>

            {/* Live readout - updates cycle-by-cycle during the demo */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-surface-sunk p-3 text-center">
                <div className="font-display text-2xl font-bold tabular-nums" style={{ color: statusInk(liveStatus) }}>
                  {liveRul.toFixed(0)}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">RUL · cyc</div>
              </div>
              <div className="rounded-lg bg-surface-sunk p-3 text-center">
                <div className="font-display text-2xl font-bold tabular-nums text-ink">
                  {simulation.currentCycle || 0}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Cycle</div>
              </div>
              <div className="rounded-lg bg-surface-sunk p-3 text-center">
                <div className="flex h-8 items-center justify-center font-display text-sm font-bold" style={{ color: statusInk(liveStatus) }}>
                  {liveStatus}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">State</div>
              </div>
            </div>

            <div className="mt-auto">
              <Eyebrow className="mb-2">Degradation demo</Eyebrow>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={startSimulation}
                  disabled={simulation.isRunning}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-steel px-3 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-steel-deep disabled:opacity-40"
                >
                  <Play size={15} /> Run
                </button>
                <button
                  onClick={pauseSimulation}
                  disabled={!simulation.isRunning}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-hairline bg-surface-raised px-3 py-2.5 font-display text-sm font-semibold text-ink transition hover:border-steel disabled:opacity-40"
                >
                  <Pause size={15} /> Pause
                </button>
                <button
                  onClick={resetSimulation}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-hairline bg-surface-raised px-3 py-2.5 font-display text-sm font-semibold text-ink transition hover:border-steel"
                >
                  <RotateCcw size={15} /> Reset
                </button>
              </div>
              {simulation.currentCycle > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between font-mono text-xs text-ink-soft">
                    <span>Cycle {simulation.currentCycle}</span>
                    <span>{simulation.totalCycles} total</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk">
                    <div
                      className="h-full rounded-full bg-steel transition-all"
                      style={{ width: `${(simulation.currentCycle / simulation.totalCycles) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </motion.div>
      </section>

      {/* ── Fleet strip ────────────────────────────────────────────────── */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <Eyebrow>Fleet</Eyebrow>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">Monitored engines</h2>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="eyebrow">Critical</span>
            <span className="thermal-gradient h-1.5 w-28 rounded-full" />
            <span className="eyebrow">Nominal</span>
          </div>
        </div>

        <motion.div
          className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6"
          initial={prefersReduced ? false : 'hidden'}
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {engines.map((engine) => {
            const isSelected = selectedEngine?.engine_id === engine.engine_id;
            const isCritical = mostCritical?.engine_id === engine.engine_id;
            const liveRul = fleetLiveRul(engine);
            const status = statusForRul(liveRul);
            const ink = statusInk(status);
            return (
              <motion.button
                key={engine.engine_id}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                onClick={() => {
                  setSelectedEngine(engine);
                  resetSimulation();
                }}
                className={`hairline-hover group rounded-xl border bg-surface-raised p-4 text-left shadow-panel ${
                  isSelected ? 'border-steel ring-1 ring-steel' : 'border-hairline'
                } ${isCritical && !isSelected ? 'animate-halo-pulse' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-semibold text-ink">
                    {engine.engine_id}
                  </span>
                  <StatusAnnunciator status={status} size={13} className="!px-1.5 !py-0.5" />
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-2xl font-bold tabular-nums" style={{ color: ink }}>
                    {liveRul.toFixed(0)}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                    cyc
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: `${(liveRul / RUL_MAX) * 100}%`,
                      backgroundColor: rampForRul(liveRul),
                    }}
                  />
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </section>

      {/* ── Analysis ───────────────────────────────────────────────────── */}
      {selectedEngine && (
        <motion.section className="mt-10 grid gap-6 lg:grid-cols-2" {...reveal}>
          <SensorChart sensors={simulation.sensorHistory} />
          <FeatureImportance
            sensors={
              simulation.topSensors.length > 0
                ? simulation.topSensors
                : toSensorImportance(perf?.feature_importance)
            }
          />
        </motion.section>
      )}

      {!alertDismissed && (
        <AlertCard
          rul={liveRul}
          engineId={selectedEngine?.engine_id || 'N/A'}
          onDismiss={() => setAlertDismissed(true)}
        />
      )}
    </main>
  );
}
