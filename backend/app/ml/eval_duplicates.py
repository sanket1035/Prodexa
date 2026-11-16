"""Evaluate duplicate suggestions against human feedback.

Usage (from backend/):  python -m app.ml.eval_duplicates [k]
Ground truth: pairs a person marked "duplicate". Unlabeled candidates count as non-duplicates, so
precision@k is a lower bound. Prints sample sizes; with few labeled pairs the numbers mean little.
"""
import sys
import uuid
from collections import defaultdict

from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.ml.embeddings import get_embedder
from app.ml.metrics import precision_at_k, recall_at_k
from app.models import DuplicateFeedback, Issue
from app.services.duplicates import find_similar


def main(k: int = 5) -> None:
    embedder = get_embedder(settings.embedder)
    with SessionLocal() as db:
        positives: dict[uuid.UUID, set[str]] = defaultdict(set)
        for f in db.scalars(select(DuplicateFeedback).where(DuplicateFeedback.is_duplicate.is_(True))):
            positives[f.issue_id].add(str(f.candidate_issue_id))
        precisions, recalls, skipped = [], [], 0
        for issue_id, relevant in positives.items():
            issue = db.get(Issue, issue_id)
            cands = find_similar(db, embedder, issue, uuid.UUID(int=0), k=k, min_similarity=0.0)
            if cands is None:
                skipped += 1
                continue
            ranked = [c["id"] for c in cands]
            precisions.append(precision_at_k(ranked, relevant, k))
            recalls.append(recall_at_k(ranked, relevant, k))
    n = len(precisions)
    print(f"embedder={embedder.name}/{embedder.version} k={k} issues_with_labeled_duplicates={n} skipped_no_embedding={skipped}")
    if n:
        print(f"precision@{k} (lower bound) = {sum(precisions) / n:.3f}   recall@{k} = {sum(recalls) / n:.3f}")
    else:
        print("No labeled duplicate pairs yet; nothing to evaluate.")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 5)
