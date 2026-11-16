import math

import pytest

from app.ml.embeddings import DIM, HashingEmbedder, get_embedder, tokens
from app.ml.metrics import precision_at_k, recall_at_k


def cos(a, b):
    return sum(x * y for x, y in zip(a, b))


def test_hashing_embedder_shape_norm_and_determinism():
    e = HashingEmbedder()
    v1, v2 = e.embed(["App crashes on save", "App crashes on save"])
    assert len(v1) == DIM and v1 == v2
    assert math.isclose(math.sqrt(sum(x * x for x in v1)), 1.0, rel_tol=1e-9)
    assert e.embed([""])[0] == [0.0] * DIM  # empty text must not divide by zero


def test_similar_text_scores_higher_than_unrelated():
    e = HashingEmbedder()
    a, b, c = e.embed(["crash when saving file to disk", "crash while saving the file", "add dark mode theme"])
    assert cos(a, b) > cos(a, c)


def test_tokens_drop_stopwords():
    assert tokens("The app is crashing on SAVE") == ["app", "crashing", "save"]


def test_unknown_embedder_rejected():
    with pytest.raises(ValueError):
        get_embedder("nope")


def test_retrieval_metrics():
    ranked = ["a", "b", "c", "d", "e"]
    assert precision_at_k(ranked, {"a", "c"}, 5) == 0.4
    assert recall_at_k(ranked, {"a", "c", "z"}, 5) == pytest.approx(2 / 3)
    assert recall_at_k(ranked, set(), 5) == 0.0
