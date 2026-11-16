import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import current_user, get_repo_for_user
from app.db.session import get_db
from app.models import User
from app.services import analytics

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/overview")
def overview(repo_id: uuid.UUID, user: User = Depends(current_user), db: Session = Depends(get_db)):
    get_repo_for_user(repo_id, user, db)
    return analytics.overview(db, repo_id)


@router.get("/issues")
def issues(repo_id: uuid.UUID, weeks: int = Query(default=12, ge=1, le=104), user: User = Depends(current_user),
           db: Session = Depends(get_db)):
    get_repo_for_user(repo_id, user, db)
    return analytics.issue_trends(db, repo_id, weeks)
