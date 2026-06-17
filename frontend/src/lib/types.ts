// Mirrors backend/schemas.py — keep in sync with the API contract.

export type Status = 'OK' | 'WARNING' | 'CRITICAL';

export interface SensorImportance {
  name: string;
  importance: number;
}

export interface PredictRequest {
  engine_id: string;
  sensor_window: number[][]; // 30 rows × 21 raw sensor values
}

export interface PredictResponse {
  engine_id: string;
  rul: number;
  ci_lower: number;
  ci_upper: number;
  status: Status;
  top_sensors: SensorImportance[];
}

export interface EngineStatus {
  engine_id: string;
  rul: number;
  status: Status;
  last_updated: string;
}

export interface SimulateStartRequest {
  scenario: Scenario;
}

export interface SimulateStartResponse {
  session_id: string;
  total_cycles: number;
}

export interface SimulateNextResponse {
  cycle: number;
  sensors: number[];
  rul: number;
  status: Status;
  done: boolean;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
}

// ── Demo data (frontend/public/demo-data/engine_*.json) ──────────────────
export type Scenario = 'healthy' | 'degrading' | 'critical';

export interface DemoRow {
  cycle: number;
  sensors: number[]; // 21 raw sensor values
  rul: number;
}
