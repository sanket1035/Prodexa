import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session

from app.api.deps import current_user, get_github_client, get_repo_for_user
from app.core.ratelimit import rate_limit
from app.db.session import get_db
from app.impact.cochange import CoChangeIndex
from app.impact.depgraph import DepGraph
from app.impact.gitlog import read_history, run_git
from app.impact.risk import ChangedFile, analyze
from app.integrations.github import GitHubClient, GitHubError
from app.models import User
from app.services import audit
from app.services.history import history_path

router = APIRouter(prefix="/api/v1", tags=["impact"])
_cache: dict[tuple[str, str], tuple[CoChangeIndex, DepGraph]] = {}  # (path, HEAD sha) -> analysis inputs


class FileIn(BaseModel):
    path: str = Field(min_length=1, max_length=500)
    additions: int = Field(default=0, ge=0)
    deletions: int = Field(default=0, ge=0)


class ImpactIn(BaseModel):
    pr_number: int | None = Field(default=None, ge=1)
    files: list[FileIn] | None = Field(default=None, max_length=300)

    @model_validator(mode="after")
    def one_source(self):
        if (self.pr_number is None) == (self.files is None):
            raise ValueError("Give exactly one of pr_number or files")
        return self


def _inputs(path: str) -> tuple[CoChangeIndex, DepGraph]:
    head = run_git(path, "rev-parse", "HEAD").strip()
    if (path, head) not in _cache:
        files = [f for f in run_git(path, "ls-files").splitlines() if f.endswith(".py")]
        _cache.clear()  # keep one entry per process; cheap and bounded
        _cache[(path, head)] = (CoChangeIndex(read_history(path)), DepGraph(path, files))
    return _cache[(path, head)]


@router.post("/repositories/{repo_id}/impact", dependencies=[Depends(rate_limit("impact"))])
def impact(repo_id: uuid.UUID, body: ImpactIn, user: User = Depends(current_user), db: Session = Depends(get_db),
           gh: GitHubClient = Depends(get_github_client)):
    """Predicted impact and regression-risk evidence for a change. Needs a 'history' job to have run first."""
    repo = get_repo_for_user(repo_id, user, db)
    path = history_path(repo.full_name)
    if not (path / ".git").exists():
        raise HTTPException(status_code=409, detail="History not prepared; enqueue a 'history' job first")
    if body.files is not None:
        changed = [ChangedFile(f.path, f.additions, f.deletions) for f in body.files]
    else:
        try:
            changed = [ChangedFile(f["filename"], f.get("additions", 0), f.get("deletions", 0))
                       for f in gh.list_pull_files(repo.full_name, body.pr_number)]
        except GitHubError as e:
            raise HTTPException(status_code=502, detail=str(e)) from e
    if not changed:
        raise HTTPException(status_code=422, detail="No changed files to analyse")
    index, graph = _inputs(str(path))
    audit.record(db, user.id, repo.organization_id, "impact.analyze", "repository", repo.id)
    db.commit()
    return {"files": [c.path for c in changed], **analyze(changed, index, graph)}
