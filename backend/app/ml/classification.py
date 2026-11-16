"""Issue classification baseline: TF-IDF + logistic regression.

Training labels come from the repository's own GitHub labels (weak supervision), so they are
noisy: reported scores measure agreement with those labels, not with a human-reviewed truth.
"""
import hashlib
from datetime import datetime, timezone
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

TAXONOMY = ["bug", "feature request", "documentation", "performance", "security", "question"]

# Normalised GitHub label name -> taxonomy. Extend per repository as needed.
LABEL_MAP = {
    "bug": "bug", "type: bug": "bug", "kind/bug": "bug", "type:bug": "bug",
    "enhancement": "feature request", "feature": "feature request", "feature request": "feature request",
    "kind/feature": "feature request", "type: feature": "feature request", "type: enhancement": "feature request",
    "documentation": "documentation", "docs": "documentation", "type: docs": "documentation",
    "performance": "performance", "perf": "performance", "type: performance": "performance",
    "security": "security", "vulnerability": "security",
    "question": "question", "type: question": "question", "support": "question",
}

# Below this top-class probability the API reports the prediction as uncertain.
# Provisional value; tune on validation data before relying on it.
UNCERTAIN_BELOW = 0.5
MIN_PER_CLASS = 5
MODEL_FILE = "classifier.joblib"


def weak_label(labels: list[str]) -> str | None:
    """Category implied by GitHub labels, or None if there is none or they conflict."""
    found = {LABEL_MAP[x.strip().lower()] for x in labels if x.strip().lower() in LABEL_MAP}
    return found.pop() if len(found) == 1 else None


def issue_text(title: str, body: str | None) -> str:
    return f"{title}\n{(body or '')[:4000]}"


def build_pipeline(seed: int = 0) -> Pipeline:
    return Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=1, lowercase=True)),
        ("clf", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=seed)),
    ])


def evaluate(texts: list[str], y: list[str], seed: int = 0, test_size: float = 0.2) -> dict:
    """Held-out evaluation with a stratified split. Classes with too few samples are dropped and reported."""
    counts = {c: y.count(c) for c in set(y)}
    keep = {c for c, n in counts.items() if n >= MIN_PER_CLASS}
    dropped = {c: n for c, n in counts.items() if c not in keep}
    pairs = [(t, c) for t, c in zip(texts, y) if c in keep]
    if len(keep) < 2:
        raise ValueError("Need at least two classes with enough labeled issues to evaluate")
    xs, ys = [p[0] for p in pairs], [p[1] for p in pairs]
    x_tr, x_te, y_tr, y_te = train_test_split(xs, ys, test_size=test_size, random_state=seed, stratify=ys)
    model = build_pipeline(seed).fit(x_tr, y_tr)
    pred = model.predict(x_te)
    labels = sorted(keep)
    return {
        "n_train": len(x_tr), "n_test": len(x_te), "seed": seed, "classes": labels,
        "dropped_classes": dropped,
        "macro_f1": float(f1_score(y_te, pred, average="macro", labels=labels, zero_division=0)),
        "per_class": classification_report(y_te, pred, labels=labels, output_dict=True, zero_division=0),
        "confusion_matrix": confusion_matrix(y_te, pred, labels=labels).tolist(),
    }


def train_and_save(texts: list[str], y: list[str], model_dir: str, seed: int = 0) -> str:
    model = build_pipeline(seed).fit(texts, y)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    version = f"tfidf-lr-{stamp}-{hashlib.sha1(''.join(sorted(texts)).encode()).hexdigest()[:6]}"
    Path(model_dir).mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "version": version}, Path(model_dir) / MODEL_FILE)
    return version


def load_model(model_dir: str) -> dict | None:
    # joblib uses pickle: only load model files this application wrote itself.
    path = Path(model_dir) / MODEL_FILE
    return joblib.load(path) if path.exists() else None


def predict(bundle: dict, text: str) -> tuple[str, float, bool]:
    model = bundle["model"]
    probs = model.predict_proba([text])[0]
    i = int(probs.argmax())
    score = float(probs[i])
    return str(model.classes_[i]), score, score < UNCERTAIN_BELOW
