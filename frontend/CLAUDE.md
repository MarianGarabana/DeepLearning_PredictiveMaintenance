# Frontend — Aerospace Predictive Maintenance dashboard

Standard **Next.js 14 (App Router) + React + TypeScript + Tailwind**. Nothing exotic — the
previous note here claiming a non-standard Next.js was incorrect.

## Design system — "Titanium & Ember"

- **Tokens** live in `tailwind.config.js` + `src/app/globals.css` (CSS vars). Warm titanium
  neutrals (`ground`/`surface`/`hairline`/`ink`/`steel`); the only saturated colour is the
  **thermal scale** (`thermal.*`), which encodes RUL/wear. See `src/lib/thermal.ts`.
- **Type:** Chakra Petch (display) / IBM Plex Sans (body) / IBM Plex Mono (data), loaded via
  `next/font` in `src/app/layout.tsx` → `font-display` / `font-sans` / `font-mono`.
- **Icons:** hand-authored SVG set in `src/components/icons/` on the shared `<Glyph>` base.
  Sensor channels map to families + glyphs via `src/lib/sensorMeta.ts`.
- **Primitives:** `Panel` / `Eyebrow` / `StatusAnnunciator` in `src/components/ui.tsx`.
- **Motion:** `framer-motion`, always gated behind `useReducedMotion()` (plus a global
  reduced-motion safety net in `globals.css`).

## Conventions
- All backend calls go through `src/lib/api.ts` — never `fetch` from components.
- `NEXT_PUBLIC_API_URL` points at the backend (`http://localhost:8000` in dev via `.env.local`).
