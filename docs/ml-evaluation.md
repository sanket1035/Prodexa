# Classification: how it is built and what is (not) measured

**Model:** TF-IDF (1-2 grams) + logistic regression with balanced class weights (`backend/app/ml/classification.py`).
**Taxonomy:** bug, feature request, documentation, performance, security, question.

## Training labels are weak
There is no hand-labeled dataset yet. Training labels are taken from the repository's own GitHub labels through the mapping `LABEL_MAP`. An issue is used only if its labels map to exactly one category. These labels are noisy and reflect each project's conventions, so any score below measures agreement with those labels, not correctness.

## How to evaluate
```bash
cd backend
python -m app.ml.train      # prints the held-out report, then saves the model to MODEL_DIR
```
The report contains macro F1, per-class precision/recall/F1 and the confusion matrix on a stratified 20% held-out split. Classes with fewer than 5 labeled issues are dropped and listed. The held-out split uses a fixed seed; the final saved model is trained on all labeled issues.

## Results
**None recorded yet.** No real repository has been imported and evaluated. Fill this section only from a real run, together with: repository, license, number of labeled issues, class counts, seed, model version and the macro F1 / per-class numbers.

## Uncertainty
`POST /issues/{id}/classify` returns the top class, its probability, and `uncertain: true` when the probability is under 0.5. The threshold is provisional and not tuned.

## Safety note
Models are saved with joblib (pickle). Only load model files written by this application; never load one from an untrusted source.

---

# Duplicate detection

**Default embedder: feature hashing (`hashing-bow-bigram`).** It turns words and word pairs into a 384-dimensional vector. It finds issues that share *words*; it does **not** understand meaning, so "app crashes" and "program dies" will not match. It exists so the feature works offline with no model download.

**Optional embedder: `all-MiniLM-L6-v2`** (set `EMBEDDER=minilm`, install `backend/requirements-ml.txt`). This is the semantic option from the blueprint. **It has not been run or tested in this repository's development environment** (the model host was not reachable), so treat that path as unverified until you run it.

**Search:** cosine distance in PostgreSQL with pgvector (HNSW index), restricted to the same repository. Each candidate comes with its similarity and the words it shares with the query issue. `min_similarity=0.3` is a provisional default, not tuned.

**Definition of duplicate (for scoring):** a pair a person marked "duplicate" via `POST /issues/{id}/duplicates/feedback`. Everything unlabeled counts as not a duplicate, so precision@k is a lower bound.

**Evaluate:** `python -m app.ml.eval_duplicates [k]` prints precision@k and recall@k and how many issues it used.

**Results: none recorded yet.** There are no labeled pairs. Record real numbers here only with the repository, number of labeled pairs, embedder and version.
