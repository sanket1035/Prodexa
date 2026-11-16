# Metrics and priority: definitions

## Priority (open issues only)
`Priority = 0.35*S + 0.25*F + 0.20*R + 0.20*B`, every factor on a 0-100 scale. **The weights and mappings are provisional design choices, not validated.** The API returns each factor with its raw input so the score can be audited, and a person can override any score (with a note); the override replaces the computed score and the computed one stays visible.

| Factor | Source | Mapping |
|---|---|---|
| S severity | GitHub labels | critical / blocker / p0 / security = 100; high / p1 / regression = 80; otherwise category from labels: bug 70, performance 50, feature request 30, question and documentation 20; unrecognised = 40 |
| F frequency | embeddings | 25 points per other open issue in the repository with cosine similarity >= 0.5, max 100. Counts as 0 and says "not embedded yet" until embeddings exist |
| R recency | `created_at` | 100 within 7 days, falling linearly to 0 at 180 days |
| B impact | `comments_count` | 10 points per comment, max 100 (a rough proxy for people affected) |

`GET /repositories/{id}/priorities` also returns a weight sensitivity check: for each factor, whether shifting 10% of the weight onto it changes the top 5. This shows how fragile the ranking is to the weights; it does not validate them. The list endpoint runs one similarity query per open issue, so it suits repositories with hundreds of open issues, not tens of thousands.

## Analytics
All values come from synced data. Each is one SQL aggregate (see `backend/app/services/analytics.py`), and the tests check them against hand-computed values and an independent query.

| Metric | Definition |
|---|---|
| open_issues / closed_issues | Count of issues by `state` (pull requests are excluded from issues at import) |
| avg_open_issue_age_days | Mean of `now() - created_at` over open issues |
| median_resolution_days | Median of `closed_at - created_at` over closed issues that have `closed_at` |
| merged_pull_requests | Pull requests with `merged_at` set |
| median_pr_cycle_days | Median of `merged_at - created_at` over merged pull requests |
| weekly opened / closed | Issues grouped by the calendar week (Monday start) of `created_at` / `closed_at`, for the last N weeks |
| categories | Category implied by GitHub labels (same mapping as the classifier); `uncategorized` if none or conflicting |
| contributors | Top 10 authors by issues opened plus pull requests opened; also merged PR count |

Limits: only data that GitHub returned and we stored is counted; issues imported before authors were stored have no author until the next sync; a reopened issue keeps its latest `closed_at` state only.
