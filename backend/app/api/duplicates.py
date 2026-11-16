import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.api.deps import current_user, get_repo_for_user
from app.api.issues import _get_issue_for_user
from app.core.config import settings
from app.db.session import get_db
from app.ml.embeddings import Embedder, get_embedder
from app.models import DuplicateFeedback, Issue, User
from app.services.duplicates import embed_repository, find_similar

router = APIRouter(prefix="/api/v1", tags=["duplicates"])


def get_embedder_dep() -> Embedder:
    # Tests override this dependency; production reads EMBEDDER from settings.
    return get_embedder(settings.embedder)


class FeedbackIn(BaseModel):
    candidate_id: uuid.UUID
    is_duplicate: bool


@router.post("/repositories/{repo_id}/embed")
def embed(repo_id: uuid.UUID, user: User = Depends(current_user), db: Session = Depends(get_db),
          embedder: Embedder = Depends(get_embedder_dep)):
    get_repo_for_user(repo_id, user, db)
    return {"embedded": embed_repository(db, embedder, repo_id), "model": embedder.name, "version": embedder.version}


@router.get("/issues/{issue_id}/duplicates")
def duplicates(issue_id: uuid.UUID, k: int = Query(default=5, ge=1, le=20),
               min_similarity: float = Query(default=0.3, ge=0.0, le=1.0),
               user: User = Depends(current_user), db: Session = Depends(get_db),
               embedder: Embedder = Depends(get_embedder_dep)):
    """Ranked similar-issue candidates. These are suggestions for a human to confirm, not verdicts.
    min_similarity is a provisional value, not tuned on validation data."""
    issue = _get_issue_for_user(issue_id, user, db)
    result = find_similar(db, embedder, issue, user.id, k=k, min_similarity=min_similarity)
    if result is None:
        raise HTTPException(status_code=409, detail="Issue has no embedding yet; POST /repositories/{id}/embed first")
    return {"model": embedder.name, "version": embedder.version, "min_similarity": min_similarity, "candidates": result}


@router.post("/issues/{issue_id}/duplicates/feedback", status_code=201)
def feedback(issue_id: uuid.UUID, body: FeedbackIn, user: User = Depends(current_user),
             db: Session = Depends(get_db)):
    issue = _get_issue_for_user(issue_id, user, db)
    cand = db.get(Issue, body.candidate_id)
    if cand is None or cand.repository_id != issue.repository_id or cand.id == issue.id:
        raise HTTPException(status_code=404, detail="Candidate not found in this repository")
    stmt = insert(DuplicateFeedback).values(issue_id=issue.id, candidate_issue_id=cand.id,
                                            user_id=user.id, is_duplicate=body.is_duplicate)
    db.execute(stmt.on_conflict_do_update(constraint="uq_duplicate_feedback",
                                          set_={"is_duplicate": body.is_duplicate}))
    db.commit()
    return {"status": "saved"}
