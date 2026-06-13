import os
import uuid
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import predict as pred_module
from schemas import (
    PredictRequest, PredictResponse,
    EngineStatus, EngineDetail,
    SimulateStartRequest, SimulateStartResponse, SimulateNextResponse,
    HealthResponse,
)
from utils import rul_to_status

load_dotenv()

app = FastAPI(title='Predictive Maintenance API', version='1.0.0')

ALLOWED_ORIGINS = os.getenv(
    'ALLOWED_ORIGINS',
    'http://localhost:3000,http://localhost:3001'
).split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=['*'],
    allow_headers=['*'],
)

# ── In-memory simulation sessions (stateless prod would use Redis) ─────────
_simulate_sessions: dict = {}

DEMO_DATA_DIR = Path(__file__).parent.parent / 'frontend' / 'public' / 'demo-data'


@app.get('/health', response_model=HealthResponse)
def health():
    return {'status': 'ok', 'model_loaded': pred_module.is_loaded()}


@app.post('/predict', response_model=PredictResponse)
def predict(req: PredictRequest):
    if len(req.sensor_window) < 1:
        raise HTTPException(status_code=422, detail='sensor_window must not be empty')
    try:
        result = pred_module.predict(req.sensor_window)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return PredictResponse(
        engine_id=req.engine_id,
        **result,
    )


@app.get('/fleet', response_model=List[EngineStatus])
def fleet():
    # Pre-loaded demo fleet at different degradation stages
    engines = [
        {'engine_id': 'ENG-001', 'rul': 125.0},
        {'engine_id': 'ENG-002', 'rul': 110.0},
        {'engine_id': 'ENG-003', 'rul': 74.0},
        {'engine_id': 'ENG-004', 'rul': 24.0},
        {'engine_id': 'ENG-005', 'rul': 96.0},
        {'engine_id': 'ENG-006', 'rul': 52.0},
    ]
    now = datetime.now(timezone.utc).isoformat()
    return [
        EngineStatus(**e, status=rul_to_status(e['rul']), last_updated=now)
        for e in engines
    ]


@app.get('/engine/{engine_id}', response_model=EngineDetail)
def engine_detail(engine_id: str):
    # Placeholder — in prod, load from DB
    current_rul = 74.0
    return EngineDetail(
        engine_id=engine_id,
        current_rul=current_rul,
        status=rul_to_status(current_rul),
        sensor_history=[],
        rul_history=[],
    )


@app.post('/simulate/start', response_model=SimulateStartResponse)
def simulate_start(req: SimulateStartRequest):
    scenario_file = DEMO_DATA_DIR / f'engine_{req.scenario}.json'
    if not scenario_file.exists():
        raise HTTPException(status_code=404, detail=f'Scenario file not found: {scenario_file}')

    with open(scenario_file) as f:
        data = json.load(f)

    session_id = str(uuid.uuid4())
    _simulate_sessions[session_id] = {'data': data, 'cursor': 0}

    return SimulateStartResponse(session_id=session_id, total_cycles=len(data))


@app.get('/simulate/next/{session_id}', response_model=SimulateNextResponse)
def simulate_next(session_id: str):
    session = _simulate_sessions.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail='Session not found or expired')

    cursor = session['cursor']
    data   = session['data']

    if cursor >= len(data):
        return SimulateNextResponse(
            cycle=cursor, sensors=[], rul=0.0, status='CRITICAL', done=True
        )

    row = data[cursor]
    session['cursor'] += 1

    sensors      = row['sensors']
    rul_override = row.get('rul')  # pre-computed in demo JSON

    if rul_override is None:
        # Run live inference — needs 30 rows; pad with current row
        window = [sensors] * 30
        result = pred_module.predict(window)
        rul    = result['rul']
        status = result['status']
    else:
        rul    = float(rul_override)
        status = rul_to_status(rul)

    done = session['cursor'] >= len(data)
    return SimulateNextResponse(
        cycle=cursor + 1,
        sensors=sensors,
        rul=rul,
        status=status,
        done=done,
    )
