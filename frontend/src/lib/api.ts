import {
  PredictRequest,
  PredictResponse,
  EngineStatus,
  EngineDetail,
  SimulateStartRequest,
  SimulateStartResponse,
  SimulateNextResponse,
  HealthResponse,
  ModelPerformanceResponse,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new APIError(response.status, `API Error: ${error}`);
  }

  return response.json();
}

export const api = {
  async health(): Promise<HealthResponse> {
    return fetchAPI('/health');
  },

  async predict(req: PredictRequest): Promise<PredictResponse> {
    return fetchAPI('/predict', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async fleet(): Promise<EngineStatus[]> {
    return fetchAPI('/fleet');
  },

  async engineDetail(engineId: string): Promise<EngineDetail> {
    return fetchAPI(`/engine/${engineId}`);
  },

  async simulateStart(req: SimulateStartRequest): Promise<SimulateStartResponse> {
    return fetchAPI('/simulate/start', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async simulateNext(sessionId: string): Promise<SimulateNextResponse> {
    return fetchAPI(`/simulate/next/${sessionId}`);
  },

  async modelPerformance(): Promise<ModelPerformanceResponse> {
    return fetchAPI('/model-performance');
  },
};
