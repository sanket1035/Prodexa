import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.api.deps import current_user, get_repo_for_user
from app.api.duplicates import get_embedder_dep
from app.api.issues import _get_issue_for_user
from app.db.session import get_db
from app.ml.embeddings import Embedder
from app.models import Issue, IssuePriorityOverride, User
from app.services import priority as prio

router = APIRouter(prefix="/api/v1", tags=["priority"])


class OverrideIn(BaseModel):
    score: float = Field(ge=0, le=100)
    note: str | None = Field(default=None, max_length=500)


def _priority(db: Session, embedder: Embedder, issue: Issue) -> dict:
    if issue.state != "open":
        return {"applicable": False, "reason": "Only open issues are prioritised"}
    factors = prio.compute_factors(issue, prio.similar_open_count(db, embedder, issue), prio.now_utc())
    computed = prio.score_of(factors)
    ov = db.get(IssuePriorityOverride, issue.id)
    return {
        "applicable": True, "computed_score": computed,
        "score": ov.score if ov else computed,
        "override": {"score": ov.score, "note": ov.note} if ov else None,
        "factors": [f.as_dict() for f in factors],
        "note": "Weights are provisional design choices, not validated.",
    }


@router.get("/issues/{issue_id}/priority")
def get_priority(issue_id: uuid.UUID, user: User = Depends(current_user), db: Session = Depends(get_db),
                 embedder: Embedder = Depends(get_embedder_dep)):
    return _priority(db, embedder, _get_issue_for_user(issue_id, user, db))


@router.put("/issues/{issue_id}/priority/override")
def set_override(issue_id: uuid.UUID, body: OverrideIn, user: User = Depends(current_user),
                 db: Session = Depends(get_db), embedder: Embedder = Depends(get_embedder_dep)):
    issue = _get_issue_for_user(issue_id, user, db)
    stmt = insert(IssuePriorityOverride).values(issue_id=issue.id, user_id=user.id, score=body.score, note=body.note)
    db.execute(stmt.on_conflict_do_update(index_elements=["issue_id"], set_={
        "user_id": user.id, "score": body.score, "note": body.note}))
    db.commit()
    return _priority(db, embedder, issue)


@router.delete("/issues/{issue_id}/priority/override")
def clear_override(issue_id: uuid.UUID, user: User = Depends(current_user), db: Session = Depends(get_db),
                   embedder: Embedder = Depends(get_embedder_dep)):
    issue = _get_issue_for_user(issue_id, user, db)
    ov = db.get(IssuePriorityOverride, issue.id)
    if ov:
        db.delete(ov)
        db.commit()
    return _priority(db, embedder, issue)


@router.get("/repositories/{repo_id}/priorities")
def ranked(repo_id: uuid.UUID, limit: int = Query(default=20, ge=1, le=100), user: User = Depends(current_user),
           db: Session = Depends(get_db), embedder: Embedder = Depends(get_embedder_dep)):
    """Open issues ranked by effective priority. Cost grows with open issue count (one similarity query each)."""
    get_repo_for_user(repo_id, user, db)
    issues = db.scalars(select(Issue).where(Issue.repository_id == repo_id, Issue.state == "open")).all()
    overrides = {o.issue_id: o.score for o in db.scalars(
        select(IssuePriorityOverride).where(IssuePriorityOverride.issue_id.in_([i.id for i in issues])))}
    rows, factor_rows = [], []
    for i in issues:
        factors = prio.compute_factors(i, prio.similar_open_count(db, embedder, i), prio.now_utc())
        factor_rows.append((i.id, factors))
        computed = prio.score_of(factors)
        rows.append({"id": str(i.id), "number": i.number, "title": i.title, "labels": i.labels,
                     "computed_score": computed, "score": overrides.get(i.id, computed),
                     "overridden": i.id in overrides,
                     "top_factor": max(factors, key=lambda f: f.weight * f.value).name})
    rows.sort(key=lambda r: (-r["score"], r["number"] or 0))
    return {"items": rows[:limit], "total_open": len(rows), "weight_sensitivity": prio.weight_sensitivity(factor_rows)}
