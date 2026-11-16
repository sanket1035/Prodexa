import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import current_user, get_repo_for_user
from app.core.config import settings
from app.core.ratelimit import rate_limit
from app.db.session import get_db
from app.ml import classification
from app.models import Issue, IssuePrediction, User

router = APIRouter(prefix="/api/v1", tags=["issues"])


def _like_escape(q: str) -> str:
    return q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _latest_prediction(db: Session, issue_id: uuid.UUID) -> IssuePrediction | None:
    return db.scalar(
        select(IssuePrediction).where(IssuePrediction.issue_id == issue_id)
        .order_by(IssuePrediction.created_at.desc()).limit(1)
    )


def _pred_out(p: IssuePrediction | None) -> dict | None:
    if p is None:
        return None
    return {"category": p.category, "score": p.score, "model_version": p.model_version,
            "uncertain": p.score < classification.UNCERTAIN_BELOW}


def _issue_out(i: Issue, pred: IssuePrediction | None = None, detail: bool = False) -> dict:
    out = {"id": str(i.id), "number": i.number, "title": i.title, "state": i.state, "labels": i.labels,
           "comments_count": i.comments_count, "html_url": i.html_url,
           "created_at": i.created_at.isoformat(), "closed_at": i.closed_at.isoformat() if i.closed_at else None,
           "prediction": _pred_out(pred)}
    if detail:
        out["body"] = i.body
    return out


def _get_issue_for_user(issue_id: uuid.UUID, user: User, db: Session) -> Issue:
    issue = db.get(Issue, issue_id)
    if issue is None:
        raise HTTPException(status_code=404, detail="Issue not found")
    get_repo_for_user(issue.repository_id, user, db)  # 404 if the repo belongs to another tenant
    return issue


@router.get("/repositories/{repo_id}/issues")
def list_issues(
    repo_id: uuid.UUID,
    state: str | None = Query(default=None, pattern="^(open|closed)$"),
    q: str | None = Query(default=None, max_length=200),
    label: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    get_repo_for_user(repo_id, user, db)
    conds = [Issue.repository_id == repo_id]
    if state:
        conds.append(Issue.state == state)
    if q:
        pat = f"%{_like_escape(q)}%"
        conds.append(Issue.title.ilike(pat, escape="\\") | Issue.body.ilike(pat, escape="\\"))
    if label:
        conds.append(Issue.labels.contains([label]))
    total = db.scalar(select(func.count()).select_from(Issue).where(*conds))
    rows = db.scalars(
        select(Issue).where(*conds).order_by(Issue.created_at.desc(), Issue.id)
        .offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {"items": [_issue_out(i) for i in rows], "total": total, "page": page, "page_size": page_size}


@router.get("/issues/{issue_id}")
def get_issue(issue_id: uuid.UUID, user: User = Depends(current_user), db: Session = Depends(get_db)):
    issue = _get_issue_for_user(issue_id, user, db)
    return _issue_out(issue, _latest_prediction(db, issue.id), detail=True)


@router.post("/issues/{issue_id}/classify", dependencies=[Depends(rate_limit("classify"))])
def classify_issue(issue_id: uuid.UUID, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Return the stored prediction for the current model, or compute and store it."""
    issue = _get_issue_for_user(issue_id, user, db)
    bundle = classification.load_model(settings.model_dir)
    if bundle is None:
        raise HTTPException(status_code=409, detail="No classifier trained yet. Run `python -m app.ml.train`.")
    existing = db.scalar(
        select(IssuePrediction).where(
            IssuePrediction.issue_id == issue.id, IssuePrediction.model_version == bundle["version"]
        )
    )
    if existing:
        return _pred_out(existing)
    category, score, _ = classification.predict(bundle, classification.issue_text(issue.title, issue.body))
    pred = IssuePrediction(issue_id=issue.id, category=category, score=score, model_version=bundle["version"])
    db.add(pred)
    db.commit()
    return _pred_out(pred)
