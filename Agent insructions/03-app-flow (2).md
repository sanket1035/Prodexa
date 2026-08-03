# 03 — App Flow (Navigation & User Journey)

## Pages
| Route | Purpose |
|---|---|
| `/` | Landing page — value prop, "Sign in with Google" CTA |
| `/login` | Google sign-in (Firebase Auth) |
| `/projects` | List of the user's projects with last score + last validated date |
| `/projects/new` | Form: Website URL, GitHub Repo URL, Pitch Deck PDF (optional), Screenshots (optional) |
| `/dashboard/[projectId]` | Main report — overall score, 6 category cards, issue list, export/re-validate actions |
| `/dashboard/[projectId]/history` | Score-over-time line chart across all validation runs for this project |

## Navigation Type
Left sidebar (desktop, primary demo device) collapsing to a top bar on mobile. Sidebar items: Projects, New Validation, Sign out.

## First Screen (new visitor)
Landing page: one-line description, tagline, single "Sign in with Google" button. No feature tour, no scroll wall — the product speaks for itself once they submit their first URL.

## Auth Flow
Sign in with Google → redirect to `/projects` → if zero projects exist, show empty state with a single "Validate your first product" CTA → `/projects/new`.

## Core User Journey 1 — First Validation
1. User lands on `/projects/new`
2. Enters Website URL + GitHub Repo URL (deck/screenshots optional)
3. Clicks "Validate Product"
4. Redirected to `/dashboard/[projectId]` in a running state
5. Progress tracker shows each module in sequence: "Analyzing landing page…" → "Reading repository…" → "Running performance audit…" → "Reviewing business positioning…" → "Building launch roadmap…"
6. On completion, radial score animates in, category cards populate, issue list renders below
7. User clicks "Copy Fix" on a Critical issue → toast confirms "Copied to clipboard"

## Core User Journey 2 — Re-validation & Improvement Tracking
1. Returning user opens `/projects`, selects an existing project
2. Clicks "Re-validate" on the dashboard
3. Same 6-module run executes against the same URL/repo
4. New score is compared against the previous run: "You were 62% ready 3 days ago. Now you're 84%."
5. User can open `/dashboard/[projectId]/history` to see the full trend line

## Empty States
- `/projects` with no projects: illustration-free card, one line of copy, single CTA button
- Dashboard mid-run before first module completes: skeleton cards, no fake numbers shown

## Error States
- A module fails (e.g., site blocks scraping, GitHub API rate-limited): that module's card shows "Unable to analyze — [reason]" instead of a score; overall score is calculated from the remaining completed modules and clearly labeled "Partial score (5/6 modules)"
- PDF parse fails: Business Review proceeds using landing page copy only, with a note

## Redirects
- After login → `/projects`
- After logout → `/`
- After completing `/projects/new` submission → `/dashboard/[projectId]` (running state)
