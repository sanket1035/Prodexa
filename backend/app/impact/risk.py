"""Change risk with evidence.

Risk = 0.15*size + 0.20*churn + 0.25*fan_in + 0.25*missing_cochange + 0.15*fix_history, each 0-100.
Weights and saturation points are PROVISIONAL design choices. Nothing here has been shown to predict
regressions better than a simple size-based model; see docs/impact.md and `python -m app.impact.evaluate`.
"""
from dataclasses import dataclass

from app.impact.cochange import CoChangeIndex
from app.impact.depgraph import DepGraph, is_test_file

WEIGHTS = {"size": 0.15, "churn": 0.20, "fan_in": 0.25, "missing_cochange": 0.25, "fix_history": 0.15}
MIN_CONFIDENCE, MIN_SUPPORT = 0.5, 2
MIN_COMMITS_FOR_FIX_RATIO = 3


@dataclass
class ChangedFile:
    path: str
    additions: int = 0
    deletions: int = 0


def analyze(changed: list[ChangedFile], cochange: CoChangeIndex, graph: DepGraph) -> dict:
    paths = [c.path for c in changed]
    pset = set(paths)
    lines = sum(c.additions + c.deletions for c in changed)

    size = max(min(100.0, lines / 5), min(100.0, len(paths) * 10.0))
    size_ev = [f"{len(paths)} file(s), {lines} line(s) changed"]

    counts = {p: cochange.file_commits.get(p, 0) for p in paths}
    churn = min(100.0, max(counts.values(), default=0) * 5.0)
    top = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:3]
    churn_ev = [f"{p} changed in {n} earlier commit(s)" for p, n in top if n] or ["no earlier history for these files (new?)"]

    deps = graph.dependents_of([p for p in paths if p.endswith(".py")])
    fan = min(100.0, len(deps) * 10.0)
    fan_ev = [f"{f} imports {via} ({'directly' if h == 1 else 'indirectly'})" for f, (h, via) in sorted(deps.items())[:5]]
    if not fan_ev:
        fan_ev = ["no other Python file imports these files (or they are not Python)"]

    missing = []
    for p in paths:
        for part in cochange.partners(p, MIN_SUPPORT, MIN_CONFIDENCE):
            if part.path not in pset:
                missing.append((p, part))
    missing.sort(key=lambda t: (-t[1].confidence, t[0], t[1].path))
    miss_val = min(100.0, len({m[1].path for m in missing}) * 25.0)
    miss_ev = [f"{p} changed together with {part.path} in {part.support} commit(s) ({part.confidence:.0%} of {p}'s history), "
               f"e.g. {part.example_sha} '{part.example_subject}'; not in this change" for p, part in missing[:5]]
    miss_ev = miss_ev or ["no frequently co-changed files are missing from this change"]

    total = sum(counts.values())
    fixes = sum(cochange.fix_commits.get(p, 0) for p in paths)
    if total >= MIN_COMMITS_FOR_FIX_RATIO:
        fix_val = 100.0 * fixes / total
        fix_ev = [f"{fixes} of {total} earlier commits touching these files look like bug fixes (subject keyword heuristic)"]
    else:
        fix_val, fix_ev = 0.0, [f"only {total} earlier commit(s); too little history to estimate"]

    raw = {"size": (size, size_ev), "churn": (churn, churn_ev), "fan_in": (fan, fan_ev),
           "missing_cochange": (miss_val, miss_ev), "fix_history": (fix_val, fix_ev)}
    factors = [{"name": n, "weight": WEIGHTS[n], "value": round(v, 1), "contribution": round(WEIGHTS[n] * v, 1), "evidence": ev}
               for n, (v, ev) in raw.items()]
    score = round(sum(WEIGHTS[n] * v for n, (v, _) in raw.items()), 1)

    co_tests = {part.path for _, part in missing if is_test_file(part.path)}
    affected_tests = sorted({f for f in deps if is_test_file(f)} | co_tests)
    return {
        "risk_score": score,
        "factors": factors,
        "affected_modules": [{"path": f, "hops": h, "via": via} for f, (h, via) in sorted(deps.items()) if not is_test_file(f)],
        "affected_tests": affected_tests,
        "missing_cochanges": [{"changed": p, "path": part.path, "support": part.support, "confidence": part.confidence,
                               "example_commit": part.example_sha} for p, part in missing],
        "note": "Provisional heuristic score, not a validated prediction. Python imports only.",
    }
