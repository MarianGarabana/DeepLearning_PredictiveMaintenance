export interface SensorImportance {
  name: string;
  importance: number;
}

export interface PredictRequest {
  engine_id: string;
  sensor_window: number[][];
}

export interface PredictResponse {
  engine_id: string;
  rul: number;
  ci_lower: number;
  ci_upper: number;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  top_sensors: SensorImportance[];
}

export interface EngineStatus {
  engine_id: string;
  rul: number;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  last_updated: string;
}

export interface EngineDetail {
  engine_id: string;
  current_rul: number;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  sensor_history: number[][];
  rul_history: number[];
}

export interface SimulateStartRequest {
  scenario: 'healthy' | 'degrading' | 'critical';
}

export interface SimulateStartResponse {
  session_id: string;
  total_cycles: number;
}

export interface SimulateNextResponse {
  cycle: number;
  sensors: number[];
  rul: number;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  done: boolean;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
}
