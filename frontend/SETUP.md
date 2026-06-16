# Frontend Setup & Deployment

## Local Development

### 1. Prerequisites
- Node.js 18+ installed
- Backend API running (see `/backend` README)

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Configure API URL

Create `.env.local`:

```bash
cp .env.local.example .env.local
```

Update `NEXT_PUBLIC_API_URL` to your backend:
- Local: `http://localhost:8000`
- Hugging Face Spaces: `https://your-space.hf.space`

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Deployment to Vercel

### Option 1: Via Vercel CLI (Fast)

```bash
npm i -g vercel
cd frontend
vercel
```

Follow prompts. Set environment variables during deployment.

### Option 2: GitHub Integration (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select your GitHub repo
4. Set root directory: `frontend`
5. Add environment variable: `NEXT_PUBLIC_API_URL=<your-hf-space-url>`
6. Click Deploy

---

## Architecture

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Fleet overview + simulation
│   │   ├── engine/[id]/page.tsx  # Individual engine details
│   │   ├── performance/page.tsx  # Model metrics dashboard
│   │   ├── layout.tsx            # Root layout with nav
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   ├── Navigation.tsx        # Top nav bar
│   │   ├── RULGauge.tsx          # SVG speedometer
│   │   ├── SensorChart.tsx       # Time series visualization
│   │   ├── AlertCard.tsx         # Critical alert notification
│   │   ├── FeatureImportance.tsx # Sensor importance bar chart
│   │   └── WhatIfAnalyzer.tsx    # Cost scenario sliders
│   └── lib/
│       ├── api.ts               # Centralized API client
│       └── types.ts             # TypeScript interfaces
├── public/
│   └── demo-data/               # Pre-recorded engine sequences
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## Key Features

✅ **Live Simulation** — Pre-recorded engine sequences play at 1-cycle/sec
✅ **Animated RUL Gauge** — Real-time needle movement
✅ **Sensor Visualization** — Multi-line chart of 5 key sensors
✅ **Alert System** — Fires when RUL < 50 cycles
✅ **Cost Analyzer** — What-if scenarios for maintenance timing
✅ **Feature Importance** — Top sensors driving predictions
✅ **Model Performance** — Training curves, accuracy metrics, architecture comparison
✅ **Dark Aerospace Theme** — Navy background, cyan accents, aviation feel

---

## Troubleshooting

### API Connection Errors

**Problem:** `Failed to connect to backend API`

**Solution:**
1. Check backend is running: `curl http://localhost:8000/health`
2. Verify `.env.local` has correct `NEXT_PUBLIC_API_URL`
3. Check CORS headers in backend `main.py`

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Gauge Not Animating

- Ensure React 18+ is installed
- Check browser DevTools console for errors
- Try hard refresh (Cmd+Shift+R on Mac)

---

## Demo Script (4 Minutes)

1. **Fleet Overview** (30s)
   - Show 6 engine cards with different RUL states
   - Explain color coding: Green (OK), Yellow (WARNING), Red (CRITICAL)

2. **Start Simulation** (1 min 30s)
   - Click "Start Demo" on ENG-003 (degrading engine)
   - Watch RUL Gauge needle drop from 125 → 0 over ~80 cycles
   - Sensor chart updates in real-time
   - Feature importance shows stable top-5 sensors

3. **Alert Fires** (30s)
   - When RUL drops below 50, red alert card appears
   - Show ROI calculation: Save $465,000 with preventive maintenance
   - Click "Schedule Maintenance" button (demo only)

4. **What-If Analysis** (30s)
   - Explain scenario sliders
   - Show cost comparison: $35k preventive vs $500k failure
   - Highlight savings potential

5. **Performance Tab** (30s)
   - Navigate to Performance page
   - Show model metrics: RMSE 13.57, MAE 9.97
   - Point out prediction scatter plot accuracy

---

## Next Steps

- [ ] Deploy backend to Hugging Face Spaces
- [ ] Deploy frontend to Vercel
- [ ] Generate demo data JSON files (from notebooks/04_evaluation.ipynb)
- [ ] Test deployed URLs on presentation laptop
- [ ] Record video backup of full demo flow
