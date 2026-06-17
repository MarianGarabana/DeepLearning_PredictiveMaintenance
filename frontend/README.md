# Turbofan PdM — Dashboard

Dark "aerospace ops-center" dashboard for the Remaining Useful Life (RUL) predictive-maintenance
MVP. **Vite + React + TypeScript + CSS Modules** (no Tailwind), charts via Recharts, RUL gauge as
a custom SVG arc. It consumes the FastAPI backend over HTTP.

## Views

- **Fleet** (`/`) — `GET /fleet`: status-colored cards for the 6 demo engines.
- **Engine detail** (`/engine/:id`) — gauge + status from the fleet headline (kept coherent with the
  card you clicked), real top-sensor attribution from `POST /predict`, and sensor / RUL-decay charts
  driven by `public/demo-data/engine_*.json` (the engine's RUL band picks the demo profile:
  `>80` healthy, `30–80` degrading, `<30` critical).
- **Live Simulation** (`/simulate`) — `POST /simulate/start` then polls `GET /simulate/next/{id}`
  once per second, animating the RUL gauge and streaming sensor lines.

## Run locally

The backend must be running on `:8000` first (see repo root `CLAUDE.md`):

```bash
cd backend && uvicorn main:app --reload --port 8000   # /health should report model_loaded:true
```

Then the frontend:

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

In dev the app calls `/api/*`, which Vite proxies to the backend (`vite.config.ts`) — no CORS setup
needed. To point the dev proxy at a backend on another port:

```bash
VITE_PROXY_TARGET=http://localhost:8001 npm run dev
```

Other scripts: `npm run build` (typecheck + production build to `dist/`), `npm run preview`,
`npm run typecheck`.

## Configuration

`VITE_API_BASE_URL` (see `.env.example`):

- **Unset (dev)** → defaults to `/api`, proxied to the backend by Vite.
- **Set (prod)** → absolute backend URL, e.g. the Hugging Face Space. The browser then calls the
  backend directly, so add the frontend's origin to the backend's `ALLOWED_ORIGINS`.

## Deploy to Vercel

1. Import the repo; set **Root Directory** to `frontend/`. Vercel auto-detects Vite
   (build `npm run build`, output `dist`).
2. Add env var `VITE_API_BASE_URL` = your deployed backend URL (the HF Space).
3. On the backend, set `ALLOWED_ORIGINS` to include the Vercel domain (e.g.
   `https://your-app.vercel.app`) so the browser's cross-origin calls are accepted.

## Notes

- `public/demo-data/*.json` is shared with the backend (its `/simulate/*` endpoints read the same
  files); leave it in place.
- Status colors are always taken from the API's status string — never recompute the thresholds
  client-side (`backend/utils.rul_to_status` is the source of truth).
