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

Other tenants' repositories return 404, not 403.

## Known limits
- OAuth scope is `public_repo`, so only public repositories work. Private repositories need a GitHub App (planned).
- The OAuth callback is not covered by automated tests (it needs a real GitHub OAuth app); the sync and webhook paths are tested with a fake GitHub transport.
- Sync is synchronous and has no resume cursor yet.
