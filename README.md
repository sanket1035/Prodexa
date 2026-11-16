# Prodexa

A GitHub-integrated engineering intelligence tool: sync repository issues and pull requests, suggest likely duplicate issues with semantic search, recommend issue priority with a visible factor breakdown, and compute engineering metrics from stored data.

> **Status: early rebuild.** GitHub login and issue/PR import exist (public repositories). No ML, priority scoring or analytics is implemented yet, and no accuracy or performance numbers exist. Claims will be added here only after they are measured.

## What exists today
- FastAPI backend with a `/health` endpoint
- PostgreSQL + pgvector schema with an Alembic migration (applied and rolled back against a real Postgres 16)
- GitHub OAuth login, connect a repository, import its issues and pull requests (idempotent), verified webhook receiver that ignores replayed deliveries
- Issue list with search, state and label filters, pagination; issue detail; frontend page to connect a repo, sync and browse issues
- Issue classification baseline (TF-IDF + logistic regression, trained on GitHub labels as weak labels); **not yet evaluated on a real repository**, see [docs/ml-evaluation.md](docs/ml-evaluation.md)
- Tests: 18 passing, including tenant isolation, sync idempotency, webhook signature and replay
- React + TypeScript (Vite) placeholder page
- Docker Compose (db, redis, api) and a GitHub Actions workflow

## Planned (not built)
duplicate detection (sentence embeddings + pgvector), priority scoring, analytics, Redis/Celery worker, deployment.

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
[API](docs/api.md) · [Architecture](docs/architecture.md) · [Database](docs/database.md)

## History
This repository previously held a different product, an AI URL-scraping "launch readiness" scorer built for InnovaHack 2026 (team: Sanket Chaudhari, Purva Chopade, Rahil Shah, Kushagra Vispute). Some of its scores were not based on real measurements, so it was removed. The old code is in git history at commit `a576c4b`.

## License
MIT
