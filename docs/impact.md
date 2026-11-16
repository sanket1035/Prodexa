# Change impact and regression risk

Given a set of changed files (or a pull request number), the API returns which modules and tests may be affected, a regression-risk score, and the evidence behind every part of the score. It never runs repository code: Python files are parsed with `ast`, history comes from `git log`.

## How to use
1. Enqueue a `history` job for the repository (`POST /repositories/{id}/jobs {"kind": "history"}`). It makes a shallow clone (default depth 500) under `WORKSPACE_DIR`, or fetches it again if it exists. Public repositories only.
2. `POST /repositories/{id}/impact` with `{"pr_number": 12}` or `{"files": [{"path": "app/x.py", "additions": 10, "deletions": 2}]}`.

## What it computes
- **Co-change:** for each file, which other files changed in the same commits, with support (commit count) and confidence (share of the file's commits). Commits touching more than 40 files are ignored.
- **Dependency graph:** which Python files import the changed files, directly or through one more hop. Other languages are not analysed. Names that resolve to more than one file are skipped; dynamic imports are invisible.
- **Affected tests:** test files (paths under `tests/` or `test/`, `test_*.py`, `*_test.py`) that import the changed files, plus tests that usually change together with them.
- **Risk score** `0.15*size + 0.20*churn + 0.25*fan_in + 0.25*missing_cochange + 0.15*fix_history`, each factor 0-100:

| Factor | Meaning | Saturates at |
|---|---|---|
| size | lines changed / 5, or files changed x 10 (larger of the two) | 500 lines or 10 files |
| churn | most earlier commits touching any changed file, x 5 | 20 commits |
| fan_in | files that import the changed files, x 10 | 10 files |
| missing_cochange | files that changed with a changed file in >= 50% of its commits (and >= 2 commits) but are not in this change, x 25 | 4 files |
| fix_history | share of earlier commits on these files whose subject looks like a bug fix (`fix`, `bug`, `hotfix`, `regression`, `crash`, `patch`); needs >= 3 earlier commits | 100% |

Every factor lists its evidence in plain words (for example "models.py changed together with schema.sql in 7 commits (88% of models.py's history), e.g. 1a2b3c4d 'rename column'; not in this change").

**The weights and saturation points are provisional design choices.** They were not fitted or validated.

## Research question and what is actually known
> Can combining code dependencies, historical co-change and PR metadata predict impact better than conventional change-risk models?

**Not answered.** A harness exists (`python -m app.impact.evaluate /path/to/clone`). It labels a commit as "followed by a fix" when a later bug-fix commit touches one of its files within 30 days, computes features from earlier history only, trains a size-only baseline (lines, files) and a combined model on the first 70% of labeled commits, and compares AUC on the last 30% with a bootstrap interval for the difference. It refuses to report anything below 100 labeled commits or when a split has one class.

Limits that apply to any number it produces:
- Labels are a keyword proxy for bug-inducing changes, not ground truth.
- The dependency graph comes from the checked-out HEAD, which can leak future structure.
- One repository at a time; no claim generalises beyond it.

**Results so far:** none. On this repository's own history it reports `insufficient_data` (14 labeled commits). The tests exercise the mechanics on a synthetic history only. Record a result here only with repository, commit count, labeled commits, positive rate, AUCs and the interval.
