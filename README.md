# Prodexa

A GitHub-integrated engineering intelligence tool: sync repository issues and pull requests, suggest likely duplicate issues with semantic search, recommend issue priority with a visible factor breakdown, and compute engineering metrics from stored data.

> **Status: early rebuild.** GitHub login and issue/PR import exist (public repositories). No ML, priority scoring or analytics is implemented yet, and no accuracy or performance numbers exist. Claims will be added here only after they are measured.

## What exists today
- FastAPI backend with a `/health` endpoint
- PostgreSQL + pgvector schema with an Alembic migration (applied and rolled back against a real Postgres 16)
- GitHub OAuth login, connect a repository, import its issues and pull requests (idempotent), verified webhook receiver that ignores replayed deliveries
- Issue list with search, state and label filters, pagination; issue detail; frontend page to connect a repo, sync and browse issues
- Issue classification baseline (TF-IDF + logistic regression, trained on GitHub labels as weak labels); **not yet evaluated on a real repository**, see [docs/ml-evaluation.md](docs/ml-evaluation.md)
- Similar-issue suggestions: pgvector cosine search within a repository, with shared terms as evidence and a human confirm/reject button. Default embedder is lexical (word overlap), not semantic; the MiniLM option is untested here. No precision/recall measured yet, see [docs/ml-evaluation.md](docs/ml-evaluation.md)
- Issue priority with a visible factor breakdown and human override; engineering analytics (open/closed, resolution and PR cycle time, weekly trends, categories, contributors) with written definitions in [docs/analytics.md](docs/analytics.md). The priority weights are provisional and not validated
- Background jobs (Celery + Redis) with retry and backoff, failed-job visibility and hourly reconciliation; audit log; rate limiting; security headers; structured logs; production config checks. Verified once end to end with a real Redis, worker and a fake GitHub server
- CI runs ruff and the tests; Docker Compose has db, redis, api, worker and beat (not run here)
- Change impact: for a PR or list of files, affected Python modules and tests, a provisional regression-risk score and the evidence behind it ([docs/impact.md](docs/impact.md)). The research question (does this beat a size-only model?) is **not answered**: the evaluation harness exists but has not been run on enough real history
- Tests: 64 passing, including tenant isolation, sync idempotency, webhook signature and replay
- React + TypeScript (Vite) placeholder page
- Docker Compose (db, redis, api) and a GitHub Actions workflow

## Planned (not built)
a public deployment (see [docs/deployment.md](docs/deployment.md)), private repositories (needs a GitHub App), other languages for impact analysis.

## Run locally
```bash
cp .env.example .env
docker compose up db redis -d
cd backend && pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload     # http://localhost:8000/health
pytest -q
cd ../frontend && npm install && npm run dev
```

## Docs
[API](docs/api.md) · [Architecture](docs/architecture.md) · [Change impact](docs/impact.md) · [Security](docs/security.md) · [Deployment](docs/deployment.md) · [Database](docs/database.md)

## History
This repository previously held a different product, an AI URL-scraping "launch readiness" scorer built for InnovaHack 2026 (team: Sanket Chaudhari, Purva Chopade, Rahil Shah, Kushagra Vispute). Some of its scores were not based on real measurements, so it was removed. The old code is in git history at commit `a576c4b`.

## License
MIT
