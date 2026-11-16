import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ml.classification import issue_text
from app.ml.embeddings import Embedder, tokens
from app.models import DuplicateFeedback, Issue, IssueEmbedding


def embed_repository(db: Session, embedder: Embedder, repository_id: uuid.UUID, batch: int = 64) -> int:
    """Embed issues that have no vector for this model version yet. Returns how many were embedded."""
    done = select(IssueEmbedding.issue_id).where(
        IssueEmbedding.model_name == embedder.name, IssueEmbedding.model_version == embedder.version
    )
    todo = db.scalars(select(Issue).where(Issue.repository_id == repository_id, Issue.id.not_in(done))).all()
    for i in range(0, len(todo), batch):
        chunk = todo[i : i + batch]
        vectors = embedder.embed([issue_text(x.title, x.body) for x in chunk])
        for issue, vec in zip(chunk, vectors):
            db.add(IssueEmbedding(issue_id=issue.id, model_name=embedder.name,
                                  model_version=embedder.version, embedding=vec))
    db.commit()
    return len(todo)


def _own_embedding(db: Session, embedder: Embedder, issue_id: uuid.UUID):
    return db.scalar(
        select(IssueEmbedding.embedding).where(
            IssueEmbedding.issue_id == issue_id,
            IssueEmbedding.model_name == embedder.name,
            IssueEmbedding.model_version == embedder.version,
        )
    )


def find_similar(db: Session, embedder: Embedder, issue: Issue, user_id: uuid.UUID,
                 k: int = 5, min_similarity: float = 0.0) -> list[dict] | None:
    """Nearest issues in the same repository by cosine similarity. None if this issue has no embedding yet."""
    own = _own_embedding(db, embedder, issue.id)
    if own is None:
        return None
    dist = IssueEmbedding.embedding.cosine_distance(own)
    rows = db.execute(
        select(Issue, dist.label("dist"))
        .join(IssueEmbedding, IssueEmbedding.issue_id == Issue.id)
        .where(
            Issue.repository_id == issue.repository_id,
            Issue.id != issue.id,
            IssueEmbedding.model_name == embedder.name,
            IssueEmbedding.model_version == embedder.version,
        )
        .order_by(dist, Issue.id)
        .limit(k)
    ).all()
    mine = set(tokens(issue_text(issue.title, issue.body)))
    verdicts = {
        f.candidate_issue_id: f.is_duplicate
        for f in db.scalars(select(DuplicateFeedback).where(
            DuplicateFeedback.issue_id == issue.id, DuplicateFeedback.user_id == user_id))
    }
    out = []
    for cand, d in rows:
        sim = 1.0 - float(d)
        if sim < min_similarity:
            continue
        shared = sorted(mine & set(tokens(issue_text(cand.title, cand.body))))[:8]
        out.append({"id": str(cand.id), "number": cand.number, "title": cand.title, "state": cand.state,
                    "html_url": cand.html_url, "similarity": round(sim, 4), "shared_terms": shared,
                    "your_verdict": verdicts.get(cand.id)})
    return out
