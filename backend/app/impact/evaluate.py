"""Does the combined feature set predict later bug fixes better than a size-only baseline?

Usage (from backend/):  python -m app.impact.evaluate /path/to/git/clone

Proxy label: a non-fix commit is "followed by a fix" if a later commit whose subject looks like a bug fix touches
one of the same files within 30 days. This is NOT ground truth (fixes may be unrelated, bugs may never be fixed,
subjects are keyword-matched), so results measure agreement with that proxy only.
Features for a commit use ONLY earlier history. Exception: the dependency graph is taken from the checked-out HEAD
(an approximation that can leak structure from the future), and files deleted since then have no dependents.
Temporal split: the first 70% of labeled commits train the models, the last 30% test them.
"""
import json
import sys
from datetime import timedelta

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from app.impact.cochange import CoChangeIndex
from app.impact.depgraph import DepGraph
from app.impact.gitlog import Commit, read_history, run_git
from app.impact.risk import MIN_CONFIDENCE, MIN_SUPPORT, WEIGHTS

HORIZON = int(timedelta(days=30).total_seconds())
MAX_FILES = 30
MIN_LABELED = 100
BASELINE_COLS = [0, 1]  # lines, files
FEATURES = ["lines", "files", "max_churn", "fix_ratio", "missing_cochange", "fan_in"]


def build_dataset(commits: list[Commit], graph: DepGraph) -> tuple[np.ndarray, np.ndarray, list[int]]:
    last_ts = commits[-1].ts if commits else 0
    index = CoChangeIndex()
    rows, labels, order = [], [], []
    for i, c in enumerate(commits):
        files = sorted(set(c.files))
        usable = (not c.is_fix) and 0 < len(files) <= MAX_FILES and c.ts + HORIZON <= last_ts
        if usable:
            fset = set(files)
            total = sum(index.file_commits.get(f, 0) for f in files)
            fixes = sum(index.fix_commits.get(f, 0) for f in files)
            missing = {p.path for f in files for p in index.partners(f, MIN_SUPPORT, MIN_CONFIDENCE) if p.path not in fset}
            deps = graph.dependents_of([f for f in files if f.endswith(".py")])
            rows.append([c.lines, len(files), max((index.file_commits.get(f, 0) for f in files), default=0),
                         fixes / total if total >= 3 else 0.0, len(missing), len(deps)])
            y = any(j.is_fix and j.ts > c.ts and j.ts <= c.ts + HORIZON and fset & set(j.files) for j in commits[i + 1:])
            labels.append(int(y))
            order.append(i)
        index.add(c)
    return np.array(rows, dtype=float), np.array(labels), order


def heuristic_scores(x: np.ndarray) -> np.ndarray:
    size = np.maximum(np.minimum(100, x[:, 0] / 5), np.minimum(100, x[:, 1] * 10))
    churn = np.minimum(100, x[:, 2] * 5)
    fan = np.minimum(100, x[:, 5] * 10)
    miss = np.minimum(100, x[:, 4] * 25)
    fix = 100 * x[:, 3]
    return (WEIGHTS["size"] * size + WEIGHTS["churn"] * churn + WEIGHTS["fan_in"] * fan
            + WEIGHTS["missing_cochange"] * miss + WEIGHTS["fix_history"] * fix)


def _auc(y, s):
    return float(roc_auc_score(y, s))


def evaluate_repo(path: str, seed: int = 0, bootstrap: int = 300) -> dict:
    commits = read_history(path)
    files = [f for f in run_git(path, "ls-files").splitlines() if f.endswith(".py")]
    x, y, _ = build_dataset(commits, DepGraph(path, files))
    n = len(y)
    out: dict = {"commits_in_history": len(commits), "labeled_commits": n, "positives": int(y.sum()) if n else 0}
    if n < MIN_LABELED:
        return {**out, "status": "insufficient_data", "message": f"Need at least {MIN_LABELED} labeled commits, found {n}. No result."}
    cut = int(n * 0.7)
    xtr, xte, ytr, yte = x[:cut], x[cut:], y[:cut], y[cut:]
    if len(set(ytr)) < 2 or len(set(yte)) < 2:
        return {**out, "status": "insufficient_data", "message": "Train or test split has only one class. No result."}

    def fit(cols):
        m = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, class_weight="balanced", random_state=seed))
        return m.fit(xtr[:, cols], ytr)

    base, full = fit(BASELINE_COLS), fit(list(range(len(FEATURES))))
    s_base, s_full = base.predict_proba(xte[:, BASELINE_COLS])[:, 1], full.predict_proba(xte)[:, 1]
    s_heur = heuristic_scores(xte)
    rng = np.random.default_rng(seed)
    diffs = []
    for _ in range(bootstrap):
        idx = rng.integers(0, len(yte), len(yte))
        if len(set(yte[idx])) < 2:
            continue
        diffs.append(_auc(yte[idx], s_full[idx]) - _auc(yte[idx], s_base[idx]))
    lo, hi = (float(np.percentile(diffs, 2.5)), float(np.percentile(diffs, 97.5))) if diffs else (None, None)
    return {**out, "status": "ok", "train": len(ytr), "test": len(yte), "test_positive_rate": float(yte.mean()),
            "auc_size_only": _auc(yte, s_base), "auc_combined": _auc(yte, s_full), "auc_heuristic_score": _auc(yte, s_heur),
            "auc_gain_combined_vs_size_only_95ci": [lo, hi],
            "note": "Proxy labels, single repository, temporal holdout. Not evidence of general superiority."}


if __name__ == "__main__":
    print(json.dumps(evaluate_repo(sys.argv[1]), indent=2))
