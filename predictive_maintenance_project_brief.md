# Predictive Maintenance AI — Project Brief & Claude Code Prompt
> Deep Learning Final Project | IE University 2026 | Prof. Concepción Díaz  
> Presentation: June 30, 2026 | Team: 4 people (Python/data background)  
> Stack: Keras + FastAPI + React via v0.dev + Vercel + Hugging Face Spaces

---

## 🎯 Project Vision

Build a production-grade **Aerospace Predictive Maintenance Intelligence Platform** that predicts the Remaining Useful Life (RUL) of commercial aircraft turbofan engines from multivariate sensor time series. The system provides real-time predictions, explainability, and actionable maintenance recommendations through a polished industrial dashboard.

This is not a notebook demo. It is a deployable MVP that looks and feels like a real aviation MRO SaaS product.

> **Natural alignment:** The NASA CMAPSS dataset is literally modeled on aircraft turbofan engines. The dataset IS the business case.

---

## 🛫 Business Case — Aerospace / Aviation

**Target customers:** Airlines (IAG, Lufthansa, Ryanair), MRO providers (Lufthansa Technik, ST Engineering, Air France Industries KLM E&M), engine OEMs (Rolls-Royce, GE Aviation, CFM International)

**Problem:** Aircraft engine failure is the most catastrophic and expensive maintenance event in aviation:
- A single widebody turbofan overhaul costs **$1–3M**
- An unplanned AOG (Aircraft on Ground) event costs airlines **$10,000–$150,000/hour**
- FAA/EASA regulations require maintenance logs — predictive data makes compliance automatic
- Current state: time-based maintenance schedules ignore actual engine degradation state

**Solution:** An LSTM-powered system that ingests live engine sensor telemetry and predicts exactly how many flight cycles remain before maintenance is required — enabling precision scheduling instead of guesswork.

**Value Proposition (quantified for the pitch):**
| Scenario | Cost |
|---|---|
| Unplanned engine failure (AOG + emergency MRO) | ~$500,000 |
| Preventive maintenance triggered by our model | ~$35,000 |
| Savings per avoided failure event | **$465,000 (13x ROI)** |
| Fleet of 50 engines, 2 avoided failures/month | **$11.2M/year** |

---

## 🧠 Model Architecture

### Dataset
**NASA CMAPSS Turbofan Engine Degradation Dataset**
- Free, public domain: https://www.nasa.gov/intelligent-systems-division/discovery-and-systems-health/pcoe/pcoe-data-set-repository/
- Also on Kaggle: search "CMAPSS Jet Engine Simulated Data"
- 4 sub-datasets (FD001–FD004)
- **Start with FD001** (single operating condition, cleanest signal)
- **Extend to FD003** for multi-condition robustness (technical depth point)
- Features: 21 sensor readings + 3 operational settings per flight cycle
- Target: Remaining Useful Life (RUL) — regression problem

### Architecture: Stacked LSTM with Attention (Keras)
```
Input: [batch_size, sequence_length=30, n_features=24]  # 21 sensors + 3 op settings
  → LSTM(128, return_sequences=True) + Dropout(0.2)
  → LSTM(64, return_sequences=True) + Dropout(0.2)
  → Attention Layer (dot-product, learns which timesteps matter most)
  → GlobalAveragePooling1D
  → Dense(32, activation='relu')
  → BatchNormalization
  → Dense(1)  # RUL regression output
```

### Training Details
```python
# Key hyperparameters
SEQUENCE_LENGTH = 30       # cycles lookback window
RUL_CAP = 125              # piecewise linear target — standard in CMAPSS literature
BATCH_SIZE = 64
EPOCHS = 100               # with early stopping
LEARNING_RATE = 0.001

# Loss & optimizer
loss = 'mse'               # or Huber loss for robustness to outliers
optimizer = Adam(lr=0.001)
callbacks = [
    EarlyStopping(patience=10, restore_best_weights=True),
    ReduceLROnPlateau(factor=0.5, patience=5),
    ModelCheckpoint('best_model.keras')
]

# Evaluation metrics
# 1. RMSE (standard)
# 2. MAE
# 3. NASA Scoring Function (asymmetric — penalizes late predictions harder than early)
#    Score = sum(exp(-d/13) - 1 for d < 0)  +  sum(exp(d/10) - 1 for d >= 0)
#    where d = predicted_RUL - true_RUL
```

### Overfitting Prevention
- Dropout (0.2) after each LSTM layer
- Early Stopping with patience=10
- L2 regularization on Dense layers (optional)
- Validation split: 80/20 on training set

### Preprocessing Pipeline
```python
# This EXACT pipeline must be replicated at inference time in backend/predict.py
# 1. Drop constant sensors (sensors 1, 5, 6, 10, 16, 18, 19 — near-zero variance in FD001)
# 2. MinMaxScaler fit on training data only (save scaler.pkl)
# 3. Sliding window: for each engine, extract sequences of length 30
# 4. RUL target: cap at 125, then linear decrease to 0
```

---

## 🖥️ Frontend — Aviation Dashboard

### Design Language
- **Theme:** Dark aerospace (deep navy #0a0f1e background, cyan #00d4ff accents, amber #f59e0b alerts)
- **Feel:** Airbus/Boeing flight operations center — authoritative, data-dense, zero clutter
- **Note:** No one on the team writes React from scratch. Use **v0.dev** to generate all components via prompts, then use **Claude Code** with the GitHub MCP to wire API calls. You are prompting, not coding.

### How to Build the Frontend (No React Experience)
1. Go to v0.dev
2. Prompt each component described below (copy the component spec as your v0 prompt)
3. Download the generated React code
4. Use Claude Code to: add API calls, connect to FastAPI backend, fix TypeScript errors
5. Deploy to Vercel with one command: `vercel deploy`

### MVP Features (All Required)

#### Feature 1: RUL Gauge (Hero Visual)
**v0 prompt:** *"A dark-themed speedometer gauge component in React using recharts or recharts-speedometer. Shows a value from 0 to 500 labeled 'Cycles Remaining'. Color zones: green (>200), yellow (100-200), red (<100). Large number display in center. Label underneath shows 'REMAINING USEFUL LIFE'. Dark navy background #0a0f1e, cyan accent color."*

#### Feature 2: Simulate Degradation Button
- Loads pre-recorded engine sequences from `/public/demo-data/engine_degrading.json`
- Feeds data cycle-by-cycle to the backend `/predict` endpoint on a 1-second interval
- Updates the gauge, sensor chart, and status badge in real time
- When RUL < 50, alert card fires automatically
- **This is your 4-minute live demo. Pre-load it. Test it 10 times before presentation day.**

#### Feature 3: What-If Cost Analyzer
**v0 prompt:** *"A dark-themed React card component with two sliders labeled 'Perform maintenance at cycle X' and 'Perform maintenance at cycle Y'. Below each slider shows: estimated maintenance cost, risk of failure, and projected savings vs emergency repair. Values update dynamically. Style: dark navy background, cyan sliders, amber warning colors."*
- Logic is pure frontend arithmetic — no backend needed
- Cost formulas: `preventive_cost = 35000`, `failure_cost = 500000`, `savings = failure_cost - preventive_cost`

#### Feature 4: Sensor Feature Importance Chart
- Bar chart (horizontal) showing which of the 21 sensors contributed most to the current RUL prediction
- Values come from the backend: either SHAP values (ideal) or a simpler proxy — the absolute gradient of the output with respect to each input feature
- **v0 prompt:** *"Horizontal bar chart in React using recharts. Title: 'Top Sensor Drivers'. Shows sensor names on Y axis (T50, P30, Nf, NRc, etc.) and importance score 0-1 on X axis. Bars colored cyan (#00d4ff) fading to navy. Dark background."*

#### Feature 5: Model Performance Tab
Pre-computed offline, displayed as static charts + metric cards:
- RMSE card, MAE card, NASA Score card
- Predicted vs Actual RUL scatter plot
- Training loss / validation loss curves
- **v0 prompt:** *"A dark-themed dashboard tab with 3 KPI cards at top (RMSE, MAE, NASA Score) and two charts below: a scatter plot of predicted vs actual RUL, and a line chart of training history. Aviation/aerospace aesthetic, dark navy background, cyan accents."*

### Additional Components
- **Fleet Grid:** 6 engine cards with health status badges (pre-loaded at different degradation stages)
- **Alert Card:** Fires when RUL < 50, shows cost savings calculation
- **Sensor Feed Chart:** Animated multi-line chart of last 30 cycles of key sensors

---

## ⚙️ Full Tech Stack

| Layer | Tool | Cost | Notes |
|---|---|---|---|
| Model Training | Keras + TensorFlow | Free | Use Google Colab (free GPU) |
| Backend API | FastAPI + Uvicorn | Free | Python — your team knows this |
| Backend Hosting | Hugging Face Spaces (Docker) | Free | Simple Dockerfile, push once |
| Frontend | React via v0.dev | Free credits | Prompt → download → deploy |
| Frontend Hosting | Vercel | Free | `vercel deploy` one command |
| Version Control | GitHub | Free | Use GitHub MCP with Claude |
| Data | NASA CMAPSS | Free | Kaggle or NASA direct |
| Slides | Gamma | Free | Connected to Claude — generate from this brief |

---

## 🗂️ Repository Structure

```
predictive-maintenance-ai/
│
├── README.md                        # Setup guide, demo URL, team names, architecture diagram
├── .gitignore                       # Ignore: data/raw/, *.h5, __pycache__, .env, node_modules/
├── requirements.txt                 # Top-level Python deps
│
├── data/
│   ├── raw/                         # NASA CMAPSS raw .txt files (add to .gitignore if >50MB)
│   │   ├── train_FD001.txt
│   │   ├── test_FD001.txt
│   │   └── RUL_FD001.txt
│   └── processed/                   # Saved numpy arrays after preprocessing
│       ├── X_train.npy
│       ├── X_test.npy
│       ├── y_train.npy
│       └── y_test.npy
│
├── notebooks/
│   ├── 01_EDA.ipynb                 # Sensor distributions, correlations, RUL distribution
│   ├── 02_preprocessing.ipynb       # Window extraction, scaling, RUL capping
│   ├── 03_model_training.ipynb      # LSTM training, callbacks, hyperparameter tuning
│   └── 04_evaluation.ipynb          # RMSE/MAE/NASA score, visualizations for slides
│
├── backend/
│   ├── main.py                      # FastAPI app — all endpoints defined here
│   ├── predict.py                   # Inference pipeline (MUST mirror training preprocessing)
│   ├── schemas.py                   # Pydantic models for request/response validation
│   ├── utils.py                     # NASA scoring function, RUL helpers
│   ├── Dockerfile                   # For Hugging Face Spaces deployment
│   ├── requirements.txt             # fastapi, uvicorn, keras, tensorflow, numpy, scikit-learn
│   └── model/
│       ├── lstm_model.keras         # Saved model (use Git LFS or HF Hub if >100MB)
│       └── scaler.pkl               # Fitted MinMaxScaler — MUST match training
│
├── frontend/
│   ├── package.json
│   ├── .env.local                   # NEXT_PUBLIC_API_URL=https://your-hf-space.hf.space
│   └── src/
│       ├── app/
│       │   ├── page.tsx             # Fleet overview landing page
│       │   └── engine/[id]/
│       │       └── page.tsx         # Engine detail view
│       ├── components/
│       │   ├── FleetGrid.tsx        # 6 engine health cards
│       │   ├── RULGauge.tsx         # Speedometer — HERO COMPONENT
│       │   ├── SensorChart.tsx      # Animated multi-line sensor chart
│       │   ├── AlertCard.tsx        # AOG warning + ROI card
│       │   ├── FeatureImportance.tsx # Horizontal bar chart
│       │   ├── WhatIfAnalyzer.tsx   # Cost scenario sliders — DIFFERENTIATOR
│       │   └── ModelPerformance.tsx # Metrics tab — static charts
│       ├── lib/
│       │   ├── api.ts               # All backend calls — never call API from components
│       │   └── types.ts             # TypeScript interfaces matching backend schemas
│       └── public/
│           └── demo-data/
│               ├── engine_healthy.json     # Pre-recorded: stable RUL ~400
│               ├── engine_degrading.json   # Pre-recorded: RUL drops from 200→0 (USE THIS FOR DEMO)
│               └── engine_critical.json   # Pre-recorded: RUL already <50
│
├── presentation/
│   ├── slides_gamma_link.txt        # Link to Gamma presentation
│   └── demo_script.md              # Exact script for the 4-minute live demo segment
│
└── docs/
    ├── architecture.md              # LSTM design decisions + why not CNN/ANN for this problem
    ├── api_reference.md             # All endpoints, request/response examples
    └── deployment.md               # Step-by-step: HF Spaces + Vercel
```

---

## 🔌 MCP Setup — Development with Claude

### GitHub MCP (Free — Official)
Lets Claude push code, create branches, write files directly to your repo from chat.

```json
// Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
// Windows: %APPDATA%\Claude\claude_desktop_config.json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_PAT_HERE"
      }
    }
  }
}
```
Get your PAT: github.com/settings/tokens → Fine-grained → grant Contents (read/write), Pull requests, Issues
**Best for:** Pushing model files, keeping repo clean, updating README, Claude writing code directly into your codebase

### Context7 MCP (Free — Already Connected)
Fetches live version-specific docs for Keras, FastAPI, React, Recharts at call time.
No hallucinated API params. Just say: *"Use Context7 to check the Keras LSTM docs for return_sequences"*
**Best for:** Accurate syntax for every library you'll use — critical when no one on the team writes React daily

### Gamma MCP (Free — Already Connected)
Lets Claude generate your presentation slides directly from this brief.
When ready: *"Generate a Gamma presentation from my project brief for a 15-minute pitch to IE University professors"*
**Best for:** Slides — don't waste time on PowerPoint formatting

### Firecrawl MCP (Free tier — 500 credits/month)
Scrapes documentation pages when Context7 doesn't cover something.
Setup: Get free API key at firecrawl.dev
**Best for:** Pulling Hugging Face Spaces deployment docs, specific library examples

---

## 👥 Suggested Role Split (4 People, Python/Data Background)

| Role | Responsibilities | Weeks 1–3 Focus |
|---|---|---|
| **ML Lead** | Notebooks 01–04, model training, evaluation metrics, saving model artifacts | Owns `notebooks/` and `backend/model/` |
| **Backend Lead** | FastAPI endpoints, predict.py pipeline, Dockerfile, HF Spaces deployment | Owns `backend/` |
| **Frontend Lead** | v0.dev prompting, React wiring with Claude Code, Vercel deployment | Owns `frontend/` — no React experience needed, use Claude Code |
| **Business & Slides Lead** | ROI calculations, Gamma slides, demo script, rehearsal timing, README | Owns `presentation/` and `docs/` |

> **Frontend note:** No React experience needed. The Frontend Lead's job is to prompt v0.dev with the component specs in this brief, download the code, and use Claude Code (with GitHub MCP active) to add the API calls from `lib/api.ts`. Claude Code handles the TypeScript — you handle the prompting and testing.

---

## 📅 Build Timeline

### Week 1 — June 9–15: Data + Model (ML Lead)
- [ ] Download NASA CMAPSS FD001 from Kaggle
- [ ] EDA: sensor variance analysis, identify and drop constant sensors, RUL distribution
- [ ] Preprocessing: sliding window (length=30), MinMaxScaler, RUL cap at 125
- [ ] Baseline LSTM (2 layers, no attention): establish RMSE benchmark
- [ ] Add Attention layer, compare metrics
- [ ] Hyperparameter sweep: window size (20/30/50), hidden units (64/128/256), dropout
- [ ] Save `lstm_model.keras` + `scaler.pkl`
- [ ] Run notebook 04: generate all evaluation plots for slides

### Week 2 — June 16–22: Backend + Frontend (Backend Lead + Frontend Lead)
**Backend Lead:**
- [ ] Build FastAPI app with all endpoints (see contract below)
- [ ] Write `predict.py`: mirror training preprocessing exactly
- [ ] Test locally with sample sensor data
- [ ] Write Dockerfile, deploy to Hugging Face Spaces
- [ ] Test deployed API endpoint with Postman

**Frontend Lead:**
- [ ] Generate each component in v0.dev using the prompt specs in this brief
- [ ] Scaffold Next.js app, drop in generated components
- [ ] Use Claude Code to write `lib/api.ts` (all backend calls)
- [ ] Wire RULGauge + SensorChart to live `/predict` endpoint
- [ ] Build Simulate Degradation: load `demo-data/engine_degrading.json`, feed cycle-by-cycle
- [ ] Deploy to Vercel

### Week 3 — June 23–29: Integration + Presentation (All)
- [ ] Full end-to-end test: frontend → HF Spaces backend → prediction → gauge update
- [ ] Generate all 6 pre-loaded demo engine sequences (save as JSON in `demo-data/`)
- [ ] Polish dark theme, fix layout on presentation laptop screen size
- [ ] Business & Slides Lead: build Gamma deck from this brief
- [ ] Full dry run: time the 15-minute pitch including live demo
- [ ] **Record a video backup of the full demo flow** (non-negotiable)
- [ ] Test deployed URLs on presentation day morning from presentation laptop

---

## 🔑 FastAPI Endpoint Contract

```python
# backend/main.py

# POST /predict
# Input:  { "engine_id": "FD001-01", "sensor_window": [[...21 values...] x 30 cycles] }
# Output: { "rul": 87.3, "ci_lower": 71.2, "ci_upper": 103.4,
#           "status": "WARNING", "top_sensors": [{"name": "T50", "importance": 0.34}, ...] }

# GET /fleet
# Output: [{ "engine_id": str, "rul": float, "status": str, "last_updated": str }, ...]

# GET /engine/{engine_id}
# Output: { "engine_id": str, "current_rul": float, "status": str,
#           "sensor_history": [...], "rul_history": [...] }

# POST /simulate/start
# Input:  { "scenario": "degrading" }   # loads demo-data sequence
# Output: { "session_id": str, "total_cycles": int }

# GET /simulate/next/{session_id}
# Output: { "cycle": int, "sensors": [float x 21], "rul": float,
#           "status": str, "done": bool }

# GET /health
# Output: { "status": "ok", "model_loaded": true }
```

**CORS config (required for Vercel → HF Spaces):**
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware,
    allow_origins=["https://your-app.vercel.app", "http://localhost:3000"],
    allow_methods=["*"], allow_headers=["*"])
```

---

## 🎤 Presentation Flow (15 Minutes, 4 Speakers)

| Segment | Time | Speaker | Content |
|---|---|---|---|
| Hook | 1 min | Speaker 1 | Open with: *"Every hour a widebody aircraft sits grounded costs an airline up to $150,000. Most of those groundings are preventable."* |
| Business Problem | 1.5 min | Speaker 1 | Time-based vs predictive maintenance, regulatory context, target customers (MROs, airlines) |
| Our Solution | 1 min | Speaker 2 | One sentence on what we built, then architecture slide |
| Technical Deep Dive | 2.5 min | Speaker 2 | LSTM diagram, NASA CMAPSS dataset, preprocessing pipeline, evaluation metrics |
| Live Demo | 4 min | Speaker 3 | Fleet overview → click degrading engine → hit Simulate → watch gauge drop → alert fires → show ROI card → What-If Analyzer |
| Business Impact | 2 min | Speaker 4 | ROI table, target market size, deployment scenario |
| Model Performance | 1 min | Speaker 2 | RMSE/MAE/NASA score, predicted vs actual scatter plot |
| Close | 1 min | Speaker 1 | Summarize value prop, invite questions |
| Q&A | 2 min | All | |

---

## ⚠️ Demo Reliability Rules (Non-Negotiable)

- **Record a full video backup** before June 30. If the live demo fails, play the video.
- **Pre-load demo sequences.** Never type sensor values live. Use the Simulate button.
- **Test deployed URLs** from the exact presentation laptop the morning of June 30.
- **Bring a mobile hotspot.** Venue WiFi may block Hugging Face Spaces or Vercel.
- **Set RUL alert threshold at 80** (not 50) so the alert fires reliably during the 4-minute demo window.
- **The gauge animation is your hook.** Make sure it runs smoothly — no lag, no white flash.

---

## 📌 Claude Code Instructions

When Claude Code builds this project, follow these rules:

1. **Preprocessing parity:** `backend/predict.py` must use the EXACT same scaler, window length, sensor drop list, and RUL cap as `notebooks/02_preprocessing.ipynb`. Any mismatch = wrong predictions.
2. **Single API client:** All frontend HTTP calls go through `frontend/src/lib/api.ts`. No direct `fetch` calls inside components.
3. **Demo data format:** Each file in `frontend/public/demo-data/` is a JSON array of objects: `[{ "cycle": 1, "sensors": [float x 21] }, ...]`. The Simulate button reads this file, not the live model.
4. **Model storage:** If `lstm_model.keras` exceeds 100MB, store on Hugging Face Hub and load via `from huggingface_hub import hf_hub_download`.
5. **Environment variables:** Backend uses `.env`: `MODEL_PATH`, `SCALER_PATH`. Frontend uses `.env.local`: `NEXT_PUBLIC_API_URL`. Never hardcode.
6. **Error handling:** Every API endpoint returns `{ "error": str }` on failure with appropriate HTTP status. The live demo cannot crash with an unhandled exception.
7. **TypeScript interfaces** in `frontend/src/lib/types.ts` must exactly mirror the Pydantic schemas in `backend/schemas.py`.

---

*Document version: 2.0 — Tailored for 4-person team, v0+React frontend, Aerospace/Aviation angle*  
*Last updated: June 2026*
