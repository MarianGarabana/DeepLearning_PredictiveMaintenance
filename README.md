# Aerospace Predictive Maintenance AI

**IE University — Deep Learning Final Project | June 2026 | Prof. Concepción Díaz**

> Predicts the Remaining Useful Life (RUL) of commercial aircraft turbofan engines from multivariate sensor time series. Built as a deployable MVP — not a notebook demo.

---

## Live Demo

| Service | URL |
|---|---|
| Frontend Dashboard | _coming Week 2 — Vercel_ |
| Backend API | _coming Week 2 — Hugging Face Spaces_ |
| API Docs | `{backend_url}/docs` |

---

## Results

Trained on NASA CMAPSS FD001 (100 engines, 17,731 sequences):

| Model | RMSE | MAE | Note |
|---|---|---|---|
| SimpleRNN | 15.90 cycles | 11.22 | Baseline — vanishing gradient |
| GRU | **13.57 cycles** | **9.97** | Best performer |
| LSTM | 13.71 cycles | 10.26 | |
| LSTM + Attention | 14.52 cycles | 10.33 | Deployed model |

**59% of predictions within ±10 cycles. 92% within ±25 cycles.**
Literature benchmark for FD001: RMSE 12–18 cycles.

---

## Architecture

```
Input: [batch, 30 cycles, 17 features]  ← 30-cycle sliding window
    → LSTM(128, return_sequences=True) + Dropout(0.2)
    → LSTM(64,  return_sequences=True) + Dropout(0.2)
    → DotProductAttention  ← learns which cycles matter most
    → GlobalAveragePooling1D
    → Dense(32, ReLU) + BatchNormalization
    → Dense(1)  ← RUL in cycles
```

**Dataset:** NASA CMAPSS FD001 — 21 sensors, 3 operational settings per flight cycle.
7 constant-variance sensors dropped → 17 features. RUL capped at 125 cycles.

---

## Repo Structure

```
predictive-maintenance-ai/
│
├── README.md
├── requirements.txt               ← root Python deps (notebooks)
│
├── data/
│   ├── raw/                       ← NASA CMAPSS .txt files (committed)
│   └── processed/                 ← numpy arrays + plots (gitignored, regenerate via notebook 02)
│
├── notebooks/
│   ├── 01_EDA.ipynb               ← sensor variance, RUL distribution, degradation trends
│   ├── 02_preprocessing.ipynb     ← sliding window, scaler, RUL cap → saves scaler.pkl + .npy
│   ├── 03_model_training.ipynb    ← 4 architectures compared, best saved to backend/model/
│   └── 04_evaluation.ipynb        ← metrics, plots, attention viz, demo JSON generation
│
├── backend/
│   ├── main.py                    ← FastAPI app, all 6 endpoints
│   ├── predict.py                 ← inference pipeline (mirrors preprocessing exactly)
│   ├── schemas.py                 ← Pydantic request/response models
│   ├── utils.py                   ← NASA scoring function, RUL→status helpers
│   ├── Dockerfile                 ← Hugging Face Spaces deploy (port 7860)
│   ├── requirements.txt
│   └── model/
│       ├── lstm_model.keras       ← trained model
│       ├── scaler.pkl             ← fitted MinMaxScaler + pipeline config
│       └── metrics.json           ← RMSE, MAE, NASA Score, feature importance
│
├── frontend/                      ← React app (Week 2 — v0.dev generated)
│   └── src/
│       ├── components/            ← RULGauge, SensorChart, FleetGrid, AlertCard, ...
│       ├── lib/api.ts             ← all backend calls (never fetch from components)
│       └── public/demo-data/      ← pre-recorded engine sequences for live demo
│
├── presentation/
│   └── demo_script.md
│
└── docs/
    ├── session_01_summary.md      ← what was built in session 1
    └── api_reference.md
```

---

## Setup

### 1. Create environment

```bash
conda create -n dl_project python=3.11 -y
conda activate dl_project
pip install tensorflow==2.15.0
pip install -r requirements.txt
pip install ipykernel && python -m ipykernel install --user --name dl_project
```

### 2. Select kernel

In your IDE (VS Code / Antigravity / Jupyter): select **dl_project** kernel before running notebooks.

### 3. Run notebooks in order

```bash
# All run locally — no Colab needed (M4 Mac trains in ~20 min)
notebooks/01_EDA.ipynb
notebooks/02_preprocessing.ipynb    ← generates data/processed/ + backend/model/scaler.pkl
notebooks/03_model_training.ipynb   ← trains 4 models, saves backend/model/lstm_model.keras
notebooks/04_evaluation.ipynb       ← metrics, plots, frontend/src/public/demo-data/*.json
```

### 4. Run backend locally

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs
```

---

## API Contract

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Model loaded status |
| `/predict` | POST | Single RUL prediction from 30-cycle sensor window |
| `/fleet` | GET | All 6 demo engine statuses |
| `/engine/{id}` | GET | Single engine detail |
| `/simulate/start` | POST | Start degradation simulation session |
| `/simulate/next/{session_id}` | GET | Next cycle in simulation |

**POST /predict request:**
```json
{
  "engine_id": "ENG-001",
  "sensor_window": [[...17 values...] × 30 cycles]
}
```

**POST /predict response:**
```json
{
  "engine_id": "ENG-001",
  "rul": 87.3,
  "ci_lower": 74.2,
  "ci_upper": 100.4,
  "status": "WARNING",
  "top_sensors": [{"name": "SENSOR 9", "importance": 0.148}, ...]
}
```

---

## Team Roles

| Role | Owner | Focus |
|---|---|---|
| ML Lead | — | Notebooks 01–04, model training, evaluation plots |
| Backend Lead | — | FastAPI, `predict.py`, Dockerfile, HF Spaces deploy |
| Frontend Lead | — | v0.dev components, React wiring, Vercel deploy |
| Business & Slides | — | Gamma deck, ROI calculations, demo script, rehearsal |

---

## Tech Stack

| Layer | Tool | Status |
|---|---|---|
| Model | Keras + TensorFlow 2.15 | ✅ Trained |
| Backend | FastAPI + Uvicorn | ✅ Built, deploy pending |
| Backend hosting | Hugging Face Spaces | ⬜ Week 2 |
| Frontend | React via v0.dev | ⬜ Week 2 |
| Frontend hosting | Vercel | ⬜ Week 2 |
| Dataset | NASA CMAPSS FD001 | ✅ In repo |

---

## Business Case

Unplanned turbofan failure costs airlines **$500,000+** per event (AOG + emergency MRO).
Preventive maintenance triggered by this model costs **~$35,000**.
Fleet of 50 engines, 2 avoided failures/month → **$11.2M/year saved**.

**Presentation: June 30, 2026**
