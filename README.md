# Aerospace Predictive Maintenance AI

**IE University — Deep Learning Final Project | June 2026 | Prof. Concepción Díaz**

> Predicts the Remaining Useful Life (RUL) of commercial aircraft turbofan engines from
> multivariate sensor time series. Built as a deployable MVP — not a notebook demo.

---

## What We Built

A complete, end-to-end deep-learning product around NASA's CMAPSS turbofan dataset:

1. **A reproducible ML pipeline** (4 Jupyter notebooks): EDA → preprocessing → training →
   evaluation. We trained **four recurrent architectures** under identical hyperparameters
   (SimpleRNN → GRU → LSTM → LSTM + Attention) so the class's RNN curriculum is *demonstrated
   empirically*, not just asserted.
2. **A FastAPI backend** that loads the trained Keras model and serves real predictions, with
   **MC-Dropout uncertainty bands**, gradient-based sensor attribution, and a fleet-simulation
   API. Deployed live on Hugging Face Spaces (Docker).
3. **A Next.js dashboard** — a dark "aerospace ops-centre" with a live RUL gauge, a fleet
   degradation demo, sensor telemetry, and a model-performance page driven by the real
   held-out evaluation.

The whole thing is wired to **real data and a real model**: every number on the dashboard
traces back to the 100 held-out FD001 engines scored through the deployed network.

---

## Live Demo

| Service | URL |
|---|---|
| Frontend Dashboard | https://aerospace-predictive-maintenance.vercel.app/ |
| Backend API | https://mariangarabana-predictive-maintenance-api.hf.space |
| API Docs | https://mariangarabana-predictive-maintenance-api.hf.space/docs |

---

## Results

Trained on NASA CMAPSS FD001 (100 engines, 17,731 sequences):

| Model | RMSE | MAE | Note |
|---|---|---|---|
| SimpleRNN | 15.90 cycles | 11.22 | Baseline — vanishing gradient |
| GRU | **13.57 cycles** | **9.97** | Best RMSE |
| LSTM | 13.71 cycles | 10.26 | Full 4-gate cell |
| LSTM + Attention | 14.52 cycles | 10.33 | **Deployed** — chosen for interpretability |

**59% of predictions within ±10 cycles. 92% within ±25 cycles.**
Literature benchmark for FD001: RMSE 12–18 cycles.

> We deploy LSTM + Attention despite GRU's marginally lower RMSE: the attention weights and
> gradient attribution explain *which cycles and which sensors* drove each prediction. For an
> aviation MRO product, "why" is worth ~1 cycle of RMSE.

---

## How It Works

End-to-end, a prediction flows through five stages — and the inference path in
`backend/predict.py` mirrors `notebooks/02_preprocessing.ipynb` **exactly** (any drift between
training and serving = wrong predictions).

```
 raw sensors          preprocessing             model              uncertainty         dashboard
┌────────────┐   ┌──────────────────────┐   ┌───────────┐   ┌──────────────────┐   ┌──────────┐
│ 21 sensors │ → │ drop 7 constant cols │ → │ stacked   │ → │ MC Dropout ×30   │ → │ RUL gauge│
│ + 3 op set │   │ MinMax scale (train) │   │ LSTM +    │   │ → 95% CI band    │   │ + alerts │
│ × 30 cycle │   │ 30-cycle window      │   │ Attention │   │ grad attribution │   │ + drivers│
│  window    │   │ RUL cap = 125        │   │ → RUL     │   │ → top sensors    │   │          │
└────────────┘   └──────────────────────┘   └───────────┘   └──────────────────┘   └──────────┘
```

1. **Input** — a 30-cycle window of raw flight-sensor readings (the dashboard/demo can replay
   recorded CMAPSS engines, or a caller can POST their own window to `/predict`).
2. **Preprocessing** — drop 7 near-constant sensors (found in EDA), apply the persisted
   `MinMaxScaler` (fit on training data only), and stack into a `[1, 30, 17]` tensor.
3. **Model** — stacked LSTM with a dot-product self-attention head outputs a single RUL value.
4. **Uncertainty + attribution** — the model is run 30× with **dropout left active**
   (MC Dropout); the spread of outputs becomes a 95% confidence band. A gradient pass
   (`|∂RUL/∂xᵢ|`) ranks which sensors mattered most.
5. **Serving** — FastAPI returns `{rul, ci_lower, ci_upper, status, top_sensors}`; the React
   dashboard renders the gauge, the OK/WARNING/CRITICAL status, and the sensor-driver panel.

---

## Architecture

```
Input: [batch, 30 cycles, 17 features]  ← 30-cycle sliding window
    → LSTM(128, return_sequences=True) + Dropout(0.2)
    → LSTM(64,  return_sequences=True) + Dropout(0.2)
    → DotProductAttention  ← learns which cycles matter most
    → GlobalAveragePooling1D
    → Dense(32, ReLU) + BatchNormalization
    → Dense(1)  ← RUL in cycles (linear regression output)
```

**Dataset:** NASA CMAPSS FD001 — 21 sensors, 3 operational settings per flight cycle.
7 constant-variance sensors dropped → 17 features. RUL capped at 125 cycles (piecewise-linear).

**Uncertainty:** because the network keeps `Dropout(0.2)` layers, the backend uses
**MC Dropout** (Gal & Ghahramani, 2016) — 30 stochastic forward passes with dropout on — and
reports `±1.96σ` as a 95% band. BatchNorm is frozen during sampling so the moving statistics
(and therefore the deterministic point estimate) don't drift between requests.

Full design rationale and the class-concept mapping: [`docs/architecture.md`](docs/architecture.md).

---

## Deep Learning Concepts Applied (from class)

Each design choice maps to a concept from the course. Where a topic was taught on
classification, we adapted it to our **regression** task (`Dense(1)` linear output + Huber/MSE
loss instead of sigmoid + cross-entropy).

| Concept | Where it's applied here |
|---|---|
| **Choosing the right network family** | RUL is a *temporal* signal → RNN family. A plain ANN (flattening loses order) and a CNN (no spatial structure) were explicitly rejected — see `notebooks/03` markdown. |
| **SimpleRNN & the vanishing gradient** | Trained as the baseline; it's measurably worst (RMSE 15.90), reproducing the lesson that tanh recurrence dilutes early-cycle signal over 30 steps. |
| **GRU (reset/update gates)** | Second model — fewer parameters, comparable accuracy; actually best RMSE here. |
| **LSTM (cell-state highway, 4 gates)** | `LSTM(128, return_sequences=True) → LSTM(64)` stacked sequential pattern, adapted from classification to regression. |
| **Attention mechanism** | Custom `DotProductAttention` over the 30 timesteps: `softmax(XXᵀ/√d)·X` — lets the model weight cycles by relevance and exposes *which* cycles drove the prediction. |
| **Sliding-window sequence modelling** | 30-cycle overlapping windows per engine turn each life into many `[30, 17]` training samples. |
| **Loss functions** | **Huber loss (δ=10)** — MSE for small errors, MAE for large — robust to the few engines with extreme RUL. Evaluation uses RMSE / MAE. |
| **Optimizer & learning-rate schedule** | Adam (lr 1e-3) + `ReduceLROnPlateau` (halve on plateau) — the "LR too large = bouncing" lesson. |
| **Mini-batch gradient descent** | `batch_size=64`, 80/20 train/val split. |
| **Dropout regularization** | `Dropout(0.2)` after each recurrent layer to prevent co-adaptation; reused at inference for MC Dropout. |
| **L2 / weight decay** | `kernel_regularizer=l2(1e-4)` on recurrent and dense layers. |
| **Batch normalization** | Stabilizes the dense head's training. |
| **Overfitting control / callbacks** | `EarlyStopping(patience=10, restore_best_weights)` + `ModelCheckpoint(save_best_only)`. |
| **Generalization diagnostics** | Predicted-vs-actual scatter and zero-mean residual histogram on 100 held-out engines (`notebooks/04`). |
| **Backpropagation / gradient flow** | Gradient-based feature importance (`|∂RUL/∂xᵢ|`) ranks sensor drivers — same `GradientTape` mechanics as backprop. |
| **Uncertainty estimation** | **MC Dropout** (Gal & Ghahramani, 2016) — dropout as a Bayesian approximation — for the confidence band. |

**Why not a CNN or a plain ANN?** Engine data is sequential, not spatial: a CNN kernel has no
analog for adjacent timesteps, and flattening 30 cycles into 510 numbers for a Dense net throws
away the ordering that *is* the degradation signal. The RNN family is the right fit for time
series, and the four-model ablation proves the SimpleRNN → LSTM progression on our own data.

---

## Dashboard

A dark "aerospace ops-centre" interface built on a small custom design system. Two pages:

**Fleet (`/`)**
- RUL gauge for the selected engine, with a power-on sweep and a live needle.
- "Run demo" plays the degradation: the whole fleet ticks down along each engine's own real
  trajectory, the gauge drops, and an alert fires when life runs low.
- Live sensor telemetry (per-channel sparklines) and a "top sensor drivers" panel fed by the
  model's real gradient attribution. Hover a sensor name to see what it measures.

**Performance (`/performance`)**
- Headline metrics (RMSE, MAE, NASA score, within ±10) each with a plain-language explanation.
- Where-the-data-comes-from summary and a primer on all four models (SimpleRNN / GRU / LSTM /
  LSTM + Attention).
- Real predicted-vs-actual scatter from the 100 held-out engines scored on the live model.
- Confusion matrix sorting engines into OK / Warning / Critical buckets.
- Attention view and a maintenance-cost "what-if" tool whose failure risk comes from the
  model's real error (RMSE).

Every backend call goes through `src/lib/api.ts`. The real evaluation metrics and
predicted-vs-actual data are also bundled in the app, so the charts still show real numbers if
the API is unreachable.

---

## Repo Structure

```
DeepLearning_PredictiveMaintenance/
│
├── README.md
├── requirements.txt               ← root Python deps (notebooks)
├── Dockerfile                     ← Hugging Face Spaces build entrypoint
│
├── data/
│   ├── raw/                       ← NASA CMAPSS .txt files (committed)
│   └── processed/                 ← numpy arrays + plots (regenerate via notebook 02/04)
│
├── notebooks/
│   ├── 01_EDA.ipynb               ← sensor variance, RUL distribution, degradation trends
│   ├── 02_preprocessing.ipynb     ← sliding window, scaler, RUL cap → saves scaler.pkl + .npy
│   ├── 03_model_training.ipynb    ← 4 architectures compared, best saved to backend/model/
│   └── 04_evaluation.ipynb        ← metrics, plots, attention viz, demo JSON generation
│
├── backend/
│   ├── main.py                    ← FastAPI app, all 7 endpoints
│   ├── predict.py                 ← inference pipeline + MC Dropout + gradient attribution
│   ├── schemas.py                 ← Pydantic request/response models
│   ├── utils.py                   ← NASA scoring function, RUL→status helpers
│   ├── Dockerfile                 ← Hugging Face Spaces deploy (port 7860)
│   ├── requirements.txt
│   └── model/
│       ├── lstm_model.keras       ← deployed model (LSTM + Attention)
│       ├── simple_rnn / gru / lstm_base.keras  ← the other trained architectures
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
└── docs/
    ├── architecture.md            ← model design + full class-concept mapping
    ├── huggingface_deployment.md  ← deploy walkthrough + troubleshooting
    └── session_*.md               ← build-session notes
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
- On startup the log confirms uncertainty mode:
  `Uncertainty estimation: MC Dropout (30 samples)`

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
Uncertainty estimation: MC Dropout (30 samples)
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

`ci_lower` / `ci_upper` are a **95% MC-Dropout band** (`rul ± 1.96σ` over 30 stochastic forward
passes). `MC_DROPOUT_SAMPLES` is configurable via env var; if a model without dropout layers is
loaded, the backend falls back to a ±15% heuristic. `top_sensors` is the gradient-based
attribution (`|∂RUL/∂xᵢ|`).

---

## Tech Stack

| Layer | Tool | Status |
|---|---|---|
| Model | Keras + TensorFlow 2.15 — stacked LSTM + Attention | ✅ Trained |
| Uncertainty | MC Dropout (30 stochastic passes) | ✅ Live |
| Backend | FastAPI + Uvicorn | ✅ Built |
| Backend hosting | Hugging Face Spaces (Docker) | ✅ Live |
| Frontend | Next.js 14 + TypeScript + Tailwind + Recharts + Framer Motion | ✅ Built |
| Frontend hosting | Vercel | ✅ Live |
| Dataset | NASA CMAPSS FD001 | ✅ In repo |

---

## Business Case

Unplanned turbofan failure costs airlines **$500,000+** per event (AOG + emergency MRO).
Preventive maintenance triggered by this model costs **~$35,000**.
Fleet of 50 engines, 2 avoided failures/month → **$11.2M/year saved**.

**Presentation: June 30, 2026**
</content>
</invoke>
