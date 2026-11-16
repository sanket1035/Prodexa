"""Train the classifier from imported issues that carry a recognised GitHub label.

Usage (from backend/):  python -m app.ml.train
Prints an evaluation report (held-out split) and saves the model trained on all labeled issues.
"""
import json

from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.ml.classification import evaluate, issue_text, train_and_save, weak_label
from app.models import Issue


def main() -> None:
    with SessionLocal() as db:
        rows = db.execute(select(Issue.title, Issue.body, Issue.labels)).all()
    texts, y = [], []
    for title, body, labels in rows:
        cat = weak_label(labels or [])
        if cat:
            texts.append(issue_text(title, body))
            y.append(cat)
    print(f"{len(rows)} issues imported, {len(texts)} with a usable label")
    report = evaluate(texts, y)
    print(json.dumps(report, indent=2))
    version = train_and_save(texts, y, settings.model_dir)
    print("saved model", version)


if __name__ == "__main__":
    main()
