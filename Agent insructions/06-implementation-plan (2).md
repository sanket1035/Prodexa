# 06 — Implementation Plan (Step-by-Step Build Sequence)

Scoped to a 24–30 hour hackathon window (Round 2: 24h dev + 6h deploy/test).

## Phase 1 — Setup (Hour 0–1)
- Init Next.js 14 project (App Router, TypeScript, Tailwind, shadcn/ui)
- Set up Firebase project: Auth (Google provider), Firestore, Storage
- Configure `.env.local` from `.env.example`
- Set up folder structure per TRD
- **Done when**: app boots locally, Google sign-in round-trips successfully

## Phase 2 — Database & Schema (Hour 1–2)
- Create Firestore collections per Backend Schema doc (`users`, `projects`, `validationRuns`)
- Write and deploy Firestore security rules
- Seed one test project manually via Firebase console for early UI development
- **Done when**: security rules deployed, a signed-in user can read/write only their own data (verify with a second test account)

## Phase 3 — Auth Flow (Hour 2–3)
- Implement `/login`, protected route wrapper, sign-out
- Redirect logic: logged-out → `/`, logged-in → `/projects`
- **Done when**: full login → projects list → logout loop works without manual URL edits

## Phase 4 — Core Feature: Project Creation (Hour 3–5)
- Build `/projects/new` form (URL inputs, optional PDF/screenshot upload to Storage)
- `POST /api/projects` — validate inputs with `zod`, write to Firestore
- **Done when**: submitting the form creates a `projects` doc and redirects to the dashboard in a "pending" state

## Phase 5 — Core Feature: Analysis Modules (Hour 5–14, the bulk of the build)
Build and test each module independently before wiring into the pipeline, in this order (cheapest/most reliable first, so a partial demo is always possible):

1. **Engineering Analysis** — GitHub API metadata checks (README, LICENSE, package.json, last commit, open issues) + LLM quality pass
2. **Product Understanding** — scrape landing page + README, LLM summarization
3. **UX Validation** — scrape + heuristic checks (heading hierarchy, CTA visibility, viewport meta) + LLM qualitative pass
4. **Performance Audit** — Lighthouse via Puppeteer or PageSpeed Insights API
5. **Business Review** — pitch deck PDF text extraction + landing copy, LLM evaluation
6. **Launch Planner** — pure aggregation, no external calls; takes outputs of 1–5 and produces prioritized roadmap

Each module must implement graceful degradation (try/catch → `skipped` status with a reason, never throw to the top level).

- **Done when**: each module runs standalone against `github.com/facebook/react` + a real landing page and returns real, non-mocked data

## Phase 6 — Pipeline Orchestration (Hour 14–16)
- Sequential execution engine: `POST /api/validate` runs modules 1→6 in order, writing `currentModule` + partial results to the `validationRuns` doc as it goes
- `GET /api/validate/[runId]/status` for client polling
- **Done when**: a full run completes end-to-end and the Firestore doc shows all 6 module results plus an overall score

## Phase 7 — Dashboard UI (Hour 16–20)
- Radial overall score with count-up animation
- 6 category score cards
- Progress tracker (live during a run, per App Flow doc)
- Issue list with severity badges + "Copy Fix" (clipboard API)
- Apply design system from UI/UX Design Brief (dark graphite + amber accent, Inter + Geist Mono)
- **Done when**: dashboard looks demo-ready on the primary laptop, matches design brief, no placeholder Lorem ipsum visible anywhere

## Phase 8 — Re-validation & History (Hour 20–22)
- "Re-validate" button triggers a new run against the same project
- Score comparison copy ("You were 62% ready... now you're 84%")
- `/dashboard/[projectId]/history` line chart via Recharts
- **Done when**: running validation twice on the same project shows a visible trend

## Phase 9 — Export (Hour 22–23)
- PDF export via jspdf + html2canvas
- Markdown export (simple template string, no library needed)
- **Done when**: both export buttons produce a file that actually contains the real report data, not a placeholder

## Phase 10 — Polish, Testing, Deploy (Hour 23–28)
- Test full flow against 3 real projects (own project + 2 others) to catch scraping/API edge cases
- Handle empty states, error states per App Flow doc
- Responsive pass (laptop primary, mobile secondary)
- Deploy to Anti-Gravity, verify env vars in production
- Prepare demo script: pick one judge-relevant repo/site to run live, plus one pre-run project as a safety fallback

## Done Criteria (overall)
- A fresh user can sign in, submit a real URL + repo, watch a live progress tracker, and land on a fully populated dashboard within 90 seconds
- At least 5 of 6 modules return real (non-fallback) data on the demo project
- "Copy Fix" produces genuinely usable, specific text — not generic filler
- Deployed and reachable at a stable URL before the demo slot, with one pre-validated backup project in case of live scraping failure
