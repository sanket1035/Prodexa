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
