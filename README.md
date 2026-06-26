---
title: Aerospace Predictive Maintenance API
emoji: 🛫
colorFrom: blue
colorTo: blue
sdk: docker
pinned: false
short_description: FastAPI backend for turbofan engine RUL prediction
---

# Aerospace Predictive Maintenance AI

**IE University — Deep Learning Final Project | June 2026 | Prof. Concepción Díaz**

> Predicts the Remaining Useful Life (RUL) of commercial aircraft turbofan engines from multivariate sensor time series. Built as a deployable MVP — not a notebook demo.

---

## Live Demo

| Service | URL |
|---|---|
| Frontend Dashboard | run locally (see [Running Locally](#running-locally)) — Vercel-ready |
| Backend API | https://mariangarabana-predictive-maintenance-api.hf.space |
| API Docs | https://mariangarabana-predictive-maintenance-api.hf.space/docs |

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

## Dashboard

A dark "aerospace ops-centre" interface built on a small custom design system. Two pages:

**Fleet (`/`)**
- RUL gauge for the selected engine, with a power-on sweep and a live needle.
- "Run demo" plays the degradation: the whole fleet ticks down along each engine's own real trajectory, the gauge drops, and an alert fires when life runs low.
- Live sensor telemetry (per-channel sparklines) and a "top sensor drivers" panel fed by the model's real gradient attribution. Hover a sensor name to see what it measures.

**Performance (`/performance`)**
- Headline metrics (RMSE, MAE, NASA score, within ±10) each with a plain-language explanation.
- Where-the-data-comes-from summary and a primer on all four models (SimpleRNN / GRU / LSTM / LSTM + Attention).
- Real predicted-vs-actual scatter from the 100 held-out engines scored on the live model.
- Confusion matrix sorting engines into OK / Warning / Critical buckets.
- Attention view and a maintenance-cost "what-if" tool whose failure risk comes from the model's real error (RMSE).

Every backend call goes through `src/lib/api.ts`. The real evaluation metrics and predicted-vs-actual data are also bundled in the app, so the charts still show real numbers if the API is unreachable.

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
├── frontend/                      ← Next.js 14 dashboard (TypeScript + Tailwind)
│   ├── src/app/                   ← pages: fleet (/), engine/[id], performance
│   ├── src/components/            ← RULGauge, SensorChart, FeatureImportance,
│   │                                WhatIfAnalyzer, AlertCard, Navigation, ui, icons
│   ├── src/lib/                   ← api.ts (all backend calls), sensorMeta, thermal,
│   │                                modelMetrics + evalData (bundled real fallbacks)
│   └── public/demo-data/          ← pre-recorded engine sequences for the live demo
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
notebooks/04_evaluation.ipynb       ← metrics, plots, frontend/public/demo-data/*.json
```

---

## Running Locally

The app is two services: a **FastAPI backend** (serves the model) and a **Next.js frontend**
(the dashboard). Run them in two terminals. The trained model, scaler, and demo data are
committed, so you can run both without retraining.

### Backend — FastAPI (port 8000)

```bash
cd backend
pip install -r requirements.txt      # reuse the dl_project env, or a fresh venv
uvicorn main:app --reload --port 8000
```

- API docs (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/health → `{"status": "ok", "model_loaded": true}`

### Frontend — Next.js (port 3000)

Requires Node.js 18+. In a second terminal:

```bash
cd frontend
npm install
cp .env.local.example .env.local     # then point it at the backend (see below)
npm run dev
```

- Dashboard: http://localhost:3000

`.env.local` controls which backend the dashboard talks to via `NEXT_PUBLIC_API_URL`:

```bash
# Local backend (the uvicorn command above)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Or the deployed Hugging Face backend (no local backend needed)
NEXT_PUBLIC_API_URL=https://mariangarabana-predictive-maintenance-api.hf.space
```

> Restart `npm run dev` after changing `.env.local` — Next.js only reads it at startup.

---

## Deploying to Hugging Face Spaces

The backend deploys to a **Docker Space**. The root `Dockerfile` is the build entrypoint: it
installs `backend/requirements.txt`, copies `backend/` and `frontend/public/demo-data/`, and
starts FastAPI on port **7860** (the port Spaces expects). Notebooks, raw data, and frontend
build folders are excluded via `.dockerignore`.

### One-time setup

```bash
git lfs install                       # the .keras model is tracked via LFS
git remote add hf https://huggingface.co/spaces/MarianGarabana/predictive-maintenance-api
```

When Git prompts for credentials, use the Hugging Face account that owns the Space and an
access token from https://huggingface.co/settings/tokens (a *write* token).

### Deploy

```bash
git push hf main                      # HF builds the Docker image automatically
```

Watch the build in the Space's **Logs** tab. A successful start logs:

```text
Model loaded. Input shape: (None, 30, 17)
Uvicorn running on http://0.0.0.0:7860
```

Then verify:

- https://mariangarabana-predictive-maintenance-api.hf.space/health
- https://mariangarabana-predictive-maintenance-api.hf.space/docs

Once the frontend is hosted, add an `ALLOWED_ORIGINS` variable in the Space's **Settings** so
the browser can call the API (e.g. `https://YOUR_APP.vercel.app,http://localhost:3000`).

Full details and troubleshooting: [`docs/huggingface_deployment.md`](docs/huggingface_deployment.md).

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
| `/model-performance` | GET | Metrics + feature importance (frontend has a bundled fallback) |

**POST /predict request:**
```json
{
  "engine_id": "ENG-001",
  "sensor_window": [[...21 raw sensor values...] × 30 cycles]
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
| Model | Keras + TensorFlow 2.15 — stacked LSTM + Attention | ✅ Trained |
| Backend | FastAPI + Uvicorn | ✅ Built |
| Backend hosting | Hugging Face Spaces (Docker) | ✅ Live |
| Frontend | Next.js 14 + TypeScript + Tailwind + Recharts + Framer Motion | ✅ Built |
| Frontend hosting | Vercel | ⬜ Ready to deploy |
| Dataset | NASA CMAPSS FD001 | ✅ In repo |

---

## Business Case

Unplanned turbofan failure costs airlines **$500,000+** per event (AOG + emergency MRO).
Preventive maintenance triggered by this model costs **~$35,000**.
Fleet of 50 engines, 2 avoided failures/month → **$11.2M/year saved**.

**Presentation: June 30, 2026**
