import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { Scenario, Status } from '@/lib/types';

export interface SimPoint {
  cycle: number;
  rul: number;
  sensors: number[];
}

type Phase = 'idle' | 'running' | 'paused' | 'done' | 'error';

interface SimState {
  phase: Phase;
  sessionId: string | null;
  cycle: number;
  totalCycles: number;
  rul: number;
  status: Status;
  sensors: number[];
  history: SimPoint[];
  error: string | null;
}

const INITIAL: SimState = {
  phase: 'idle',
  sessionId: null,
  cycle: 0,
  totalCycles: 0,
  rul: 0,
  status: 'OK',
  sensors: [],
  history: [],
  error: null,
};

const TICK_MS = 1000;

/**
 * Drives the live demo: POST /simulate/start, then poll GET /simulate/next
 * once per second, accumulating history. Cleans up the interval on pause,
 * completion, and unmount.
 */
export function useSimulation() {
  const [state, setState] = useState<SimState>(INITIAL);
  const timer = useRef<number | null>(null);

  const stopTimer = () => {
    if (timer.current !== null) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  const reset = useCallback(() => {
    stopTimer();
    setState(INITIAL);
  }, []);

  const start = useCallback(async (scenario: Scenario) => {
    stopTimer();
    setState({ ...INITIAL, phase: 'running' });
    try {
      const { session_id, total_cycles } = await api.simulateStart({ scenario });
      setState((s) => ({ ...s, sessionId: session_id, totalCycles: total_cycles }));
    } catch (e) {
      setState((s) => ({
        ...s,
        phase: 'error',
        error: e instanceof Error ? e.message : 'Failed to start simulation',
      }));
    }
  }, []);

  const pause = useCallback(() => {
    setState((s) => (s.phase === 'running' ? { ...s, phase: 'paused' } : s));
  }, []);

  const resume = useCallback(() => {
    setState((s) => (s.phase === 'paused' ? { ...s, phase: 'running' } : s));
  }, []);

  // Polling loop — runs only while phase is 'running' with a live session.
  useEffect(() => {
    if (state.phase !== 'running' || !state.sessionId) return;
    const sid = state.sessionId;
    timer.current = window.setInterval(async () => {
      try {
        const next = await api.simulateNext(sid);
        setState((s) => {
          if (s.phase !== 'running') return s;
          const hasRow = next.sensors.length > 0;
          return {
            ...s,
            cycle: next.cycle,
            rul: next.rul,
            status: next.status,
            sensors: hasRow ? next.sensors : s.sensors,
            history: hasRow
              ? [...s.history, { cycle: next.cycle, rul: next.rul, sensors: next.sensors }]
              : s.history,
            phase: next.done ? 'done' : 'running',
          };
        });
      } catch (e) {
        setState((s) => ({
          ...s,
          phase: 'error',
          error: e instanceof Error ? e.message : 'Simulation stream error',
        }));
      }
    }, TICK_MS);
    return stopTimer;
  }, [state.phase, state.sessionId]);

  // Safety net: clear any timer if the consumer unmounts.
  useEffect(() => stopTimer, []);

  return { ...state, start, pause, resume, reset };
}
