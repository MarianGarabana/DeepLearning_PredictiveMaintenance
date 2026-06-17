import type {
  HealthResponse,
  EngineStatus,
  PredictRequest,
  PredictResponse,
  SimulateStartRequest,
  SimulateStartResponse,
  SimulateNextResponse,
} from './types';

// Dev: defaults to "/api", proxied to :8000 by Vite (no CORS).
// Prod: set VITE_API_BASE_URL to the deployed backend.
const BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the backend. Is it running on :8000?');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, body || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<HealthResponse>('/health'),
  getFleet: () => request<EngineStatus[]>('/fleet'),
  predict: (req: PredictRequest) =>
    request<PredictResponse>('/predict', { method: 'POST', body: JSON.stringify(req) }),
  simulateStart: (req: SimulateStartRequest) =>
    request<SimulateStartResponse>('/simulate/start', {
      method: 'POST',
      body: JSON.stringify(req),
    }),
  simulateNext: (sessionId: string) =>
    request<SimulateNextResponse>(`/simulate/next/${sessionId}`),
};
