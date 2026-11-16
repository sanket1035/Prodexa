"""Transparent issue priority.

Priority = 0.35*S + 0.25*F + 0.20*R + 0.20*B, each factor normalised to 0-100.
The weights and every mapping below are PROVISIONAL design choices, not validated truths.
Each factor reports its raw input so a person can see why a score came out as it did.
"""
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.ml.classification import weak_label
from app.ml.embeddings import Embedder
from app.models import Issue, IssueEmbedding

WEIGHTS = {"severity": 0.35, "frequency": 0.25, "recency": 0.20, "impact": 0.20}

SEVERITY_LABELS = {  # first match wins, highest first
    100: {"critical", "blocker", "p0", "priority: critical", "severity: critical", "security", "vulnerability"},
    80: {"high", "p1", "priority: high", "severity: high", "regression"},
}
CATEGORY_SEVERITY = {"bug": 70, "performance": 50, "feature request": 30, "question": 20, "documentation": 20}
DEFAULT_SEVERITY = 40

SIMILAR_THRESHOLD = 0.5  # cosine similarity counted as "a similar report"; provisional
PER_SIMILAR = 25  # each similar open report adds this much frequency, capped at 100
RECENT_FULL_DAYS = 7  # created within this many days -> recency 100
RECENT_ZERO_DAYS = 180  # older than this -> recency 0
PER_COMMENT = 10  # each comment adds this much impact, capped at 100


@dataclass
class Factor:
    name: str
    weight: float
    value: float
    raw: str
    explanation: str

    def as_dict(self) -> dict:
        return {"name": self.name, "weight": self.weight, "value": round(self.value, 1),
                "contribution": round(self.weight * self.value, 1), "raw": self.raw,
                "explanation": self.explanation}


def severity(labels: list[str]) -> tuple[float, str]:
    norm = {x.strip().lower() for x in labels}
    for score, names in SEVERITY_LABELS.items():
        hit = norm & names
        if hit:
            return float(score), f"label {sorted(hit)[0]!r}"
    cat = weak_label(labels)
    if cat:
        return float(CATEGORY_SEVERITY[cat]), f"category {cat} (from labels)"
    return float(DEFAULT_SEVERITY), "no recognised label; default"


def recency(created_at: datetime, now: datetime) -> tuple[float, str]:
    days = max(0.0, (now - created_at).total_seconds() / 86400)
    if days <= RECENT_FULL_DAYS:
        v = 100.0
    elif days >= RECENT_ZERO_DAYS:
        v = 0.0
    else:
        v = 100.0 * (RECENT_ZERO_DAYS - days) / (RECENT_ZERO_DAYS - RECENT_FULL_DAYS)
    return v, f"{days:.0f} days old"


def compute_factors(issue: Issue, similar_open: int | None, now: datetime) -> list[Factor]:
    sev, sev_raw = severity(issue.labels or [])
    rec, rec_raw = recency(issue.created_at, now)
    imp = min(100.0, issue.comments_count * PER_COMMENT)
    if similar_open is None:
        freq, freq_raw, freq_note = 0.0, "not embedded yet", "Counts as 0 until embeddings exist (run embed)."
    else:
        freq = min(100.0, similar_open * PER_SIMILAR)
        freq_raw = f"{similar_open} similar open issue(s)"
        freq_note = f"{PER_SIMILAR} points per other open issue with similarity >= {SIMILAR_THRESHOLD}, max 100."
    return [
        Factor("severity", WEIGHTS["severity"], sev, sev_raw, "From severity labels, else category implied by labels."),
        Factor("frequency", WEIGHTS["frequency"], freq, freq_raw, freq_note),
        Factor("recency", WEIGHTS["recency"], rec, rec_raw,
               f"100 within {RECENT_FULL_DAYS} days, falling linearly to 0 at {RECENT_ZERO_DAYS} days."),
        Factor("impact", WEIGHTS["impact"], imp, f"{issue.comments_count} comment(s)",
               f"{PER_COMMENT} points per comment, max 100 (a rough proxy for people affected)."),
    ]


def score_of(factors: list[Factor]) -> float:
    return round(sum(f.weight * f.value for f in factors), 1)


def similar_open_count(db: Session, embedder: Embedder, issue: Issue) -> int | None:
    own = db.scalar(select(IssueEmbedding.embedding).where(
        IssueEmbedding.issue_id == issue.id, IssueEmbedding.model_name == embedder.name,
        IssueEmbedding.model_version == embedder.version))
    if own is None:
        return None
    dist = IssueEmbedding.embedding.cosine_distance(own)
    return db.scalar(
        select(func.count()).select_from(Issue).join(IssueEmbedding, IssueEmbedding.issue_id == Issue.id)
        .where(Issue.repository_id == issue.repository_id, Issue.id != issue.id, Issue.state == "open",
               IssueEmbedding.model_name == embedder.name, IssueEmbedding.model_version == embedder.version,
               dist <= 1 - SIMILAR_THRESHOLD)
    )


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def weight_sensitivity(rows: list[tuple[uuid.UUID, list[Factor]]], delta: float = 0.10, top_n: int = 5) -> list[dict]:
    """Shift 0.10 of weight onto one factor (taking it proportionally from the others) and report whether
    the top-N set changes. A quick robustness check on the provisional weights, not a validation."""
    def ranking(w: dict[str, float]) -> list[uuid.UUID]:
        scored = [(sum(w[f.name] * f.value for f in fs), i) for i, fs in rows]
        return [i for _, i in sorted(scored, key=lambda t: (-t[0], str(t[1])))]

    base = ranking(WEIGHTS)[:top_n]
    out = []
    for name in WEIGHTS:
        w = {k: v * (1 - delta) if k != name else v + (1 - v) * delta for k, v in WEIGHTS.items()}
        top = ranking(w)[:top_n]
        out.append({"boosted_factor": name, "top_n_unchanged": top == base, "top_n_overlap": len(set(top) & set(base))})
    return out
