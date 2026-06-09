from pydantic import BaseModel, Field
from typing import List, Optional


class SensorImportance(BaseModel):
    name: str
    importance: float


class PredictRequest(BaseModel):
    engine_id: str
    sensor_window: List[List[float]] = Field(
        ...,
        description="30 rows × 21 sensor values (raw, unscaled)"
    )


class PredictResponse(BaseModel):
    engine_id: str
    rul: float
    ci_lower: float
    ci_upper: float
    status: str  # "OK" | "WARNING" | "CRITICAL"
    top_sensors: List[SensorImportance]


class EngineStatus(BaseModel):
    engine_id: str
    rul: float
    status: str
    last_updated: str


class EngineDetail(BaseModel):
    engine_id: str
    current_rul: float
    status: str
    sensor_history: List[List[float]]
    rul_history: List[float]


class SimulateStartRequest(BaseModel):
    scenario: str = "degrading"  # "healthy" | "degrading" | "critical"


class SimulateStartResponse(BaseModel):
    session_id: str
    total_cycles: int


class SimulateNextResponse(BaseModel):
    cycle: int
    sensors: List[float]
    rul: float
    status: str
    done: bool


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
