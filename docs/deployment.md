# Deployment

**Status: not deployed.** Nothing here has been run against a hosting provider; it is the checklist for doing it. There is no public demo yet.

## Pieces
- API: `backend/Dockerfile` (uvicorn). Run `alembic upgrade head` before starting a new version.
- Worker and scheduler: same image, commands `celery -A app.workers.celery_app worker` and `celery -A app.workers.celery_app beat` (see `docker-compose.yml`). Run exactly one `beat`.
- PostgreSQL with the `pgvector` extension (the migration runs `CREATE EXTENSION IF NOT EXISTS vector`; the database role must be allowed to). Redis for the job queue.
- Frontend: static build from `frontend/` (`npm run build`).

## Environment (production)
`ENVIRONMENT=production`, a random `SESSION_SECRET` (32+ chars), `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_WEBHOOK_SECRET`, `DATABASE_URL`, `REDIS_URL`, `FRONTEND_URL`. The API will not start if the secrets are missing or weak.

## GitHub
1. Create an OAuth app (Settings, Developer settings). Callback URL: `https://<api-host>/api/v1/auth/github/callback`.
2. On each repository you connect, add a webhook: payload URL `https://<api-host>/api/v1/webhooks/github`, content type `application/json`, the same secret as `GITHUB_WEBHOOK_SECRET`, events: Issues and Pull requests. (Automatic webhook registration is not built.)

## Vercel (frontend)
The old Vercel project `prodexa-ai` was built for the previous Next.js app and fails on this repository until it is reconfigured: set **Root Directory** to `frontend` and **Framework Preset** to Vite. The frontend calls relative `/api/...` paths, so add a rewrite from `/api/:path*` to the API host, or serve both behind one domain, so the session cookie stays same-site.

## Smoke test after deploying
`GET /health` returns ok, `GET /health/ready` shows database and redis ok, sign in with GitHub, connect a public repository, enqueue a sync job and watch it reach `succeeded` under `GET /api/v1/repositories/{id}/jobs`.
