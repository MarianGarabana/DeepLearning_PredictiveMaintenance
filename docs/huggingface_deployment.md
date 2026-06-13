# Hugging Face Spaces Backend Deployment

Use the Hugging Face Space you already created with the Docker SDK. Push this repository root to that Space; the root `Dockerfile` is configured for Hugging Face.

## What The Docker Space Builds

The root `Dockerfile` installs `backend/requirements.txt`, copies `backend/`, copies `frontend/public/demo-data/`, starts FastAPI from `/app/backend`, and exposes port `7860`.

The Docker image intentionally excludes notebooks, raw data, local virtual environments, and frontend build folders.

## One-Time Setup

Install Git LFS if you do not already have it:

```bash
git lfs install
```

Add your Hugging Face Space as a Git remote:

```bash
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
```

If Git asks for credentials, use your Hugging Face username and a token from:

```text
https://huggingface.co/settings/tokens
```

## Deploy

Commit the current backend readiness changes, then push to the Space:

```bash
git push hf main
```

Hugging Face will build the Docker image automatically.

## Verify

Open the Space logs and look for:

```text
Model loaded. Input shape: (None, 30, 17)
Uvicorn running on http://0.0.0.0:7860
```

Then test:

```text
https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space/health
https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space/docs
```

Expected `/health` response:

```json
{
  "status": "ok",
  "model_loaded": true
}
```

Test the demo simulation:

```bash
curl -X POST https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space/simulate/start \
  -H "Content-Type: application/json" \
  -d '{"scenario":"degrading"}'
```

## Later, Before Vercel

When the frontend is deployed, add this Hugging Face Space variable in Settings:

```text
ALLOWED_ORIGINS=https://YOUR_VERCEL_APP.vercel.app,http://localhost:3000
```
