# API (implemented so far)

All routes are under `/api/v1`. Auth is a signed session cookie; the GitHub token is stored encrypted server-side and never sent to the browser.

| Method | Path | Notes |
|---|---|---|
| GET | /auth/github/login | Redirects to GitHub; sets a random `state` in the session |
| GET | /auth/github/callback | Verifies `state`, exchanges the code, creates the user + personal organization on first login |
| GET | /auth/me, POST /auth/logout | |
| GET | /repositories | Only repositories in the caller's organizations |
| GET | /repositories/available | The caller's repositories on GitHub |
| POST | /repositories/connect | `{"full_name": "owner/repo"}` |
| POST | /repositories/{id}/sync | Imports issues and PRs (follows pagination, upserts, safe to repeat). Runs inline for now; moves to a worker later |
| POST | /webhooks/github | HMAC-SHA256 verified; `X-GitHub-Delivery` is stored as the primary key so replays are ignored |

| GET | /repositories/{id}/issues | Filters: `state` (open/closed), `q` (title/body search, case-insensitive, `%` and `_` literal), `label`; `page`, `page_size` (max 100); newest first |
| GET | /issues/{id} | Issue with body and latest prediction |
| POST | /issues/{id}/classify | Returns the stored prediction for the current model, else computes and stores it. 409 if no model is trained |
| POST | /repositories/{id}/embed | Embeds issues that have no vector for the current embedder version (idempotent) |
| GET | /issues/{id}/duplicates | `k` (1-20), `min_similarity`. Ranked candidates with similarity, shared terms, your verdict. 409 if the issue is not embedded yet |
| POST | /issues/{id}/duplicates/feedback | `{candidate_id, is_duplicate}`; one verdict per user and pair, overwritten on repeat |
| GET | /issues/{id}/priority | Score, factors with raw inputs, override if any. Open issues only |
| PUT / DELETE | /issues/{id}/priority/override | `{score 0-100, note}`; human override of the computed score |
| GET | /repositories/{id}/priorities | Open issues ranked by effective score, plus weight sensitivity |
| GET | /analytics/overview?repo_id= | Counts, ages, median resolution and PR cycle time |
| GET | /analytics/issues?repo_id=&weeks= | Weekly opened/closed, categories, contributors |
| POST | /repositories/{id}/jobs | `{kind: sync, embed or history}`; queues a background job, returns 202 with the job |
| GET | /repositories/{id}/jobs | Job list with status, attempts, last error; filter `status` (failed jobs stay visible) |
| POST | /jobs/{id}/retry | Requeue a failed job |
| POST | /repositories/{id}/impact | `{pr_number}` or `{files:[{path,additions,deletions}]}`; risk, evidence, affected modules and tests. 409 until a `history` job has run |
| GET | /audit-logs | Recent audit entries for organizations where you are owner or admin |
| GET | /health, /health/ready | Liveness; readiness (database required, redis reported) |

Definitions: [analytics.md](analytics.md). Errors are `{detail, request_id}`; rate-limited routes return 429 with `Retry-After`.

Other tenants' repositories return 404, not 403.

## Known limits
- OAuth scope is `public_repo`, so only public repositories work. Private repositories need a GitHub App (planned).
- The OAuth callback is not covered by automated tests (it needs a real GitHub OAuth app); the sync and webhook paths are tested with a fake GitHub transport.
- Sync is synchronous and has no resume cursor yet.
