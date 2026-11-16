import pytest

from app.ml import classification as c


def test_weak_label_mapping():
    assert c.weak_label(["Bug", "help wanted"]) == "bug"
    assert c.weak_label(["enhancement"]) == "feature request"
    assert c.weak_label(["bug", "docs"]) is None  # conflicting labels give no training label
    assert c.weak_label(["help wanted"]) is None
    assert c.weak_label([]) is None


def _toy():
    bug = [f"crash exception traceback error {i}" for i in range(10)]
    doc = [f"typo readme docs documentation missing {i}" for i in range(10)]
    return bug + doc, ["bug"] * 10 + ["documentation"] * 10


def test_pipeline_mechanics_on_toy_data(tmp_path):
    # Toy data only proves the code path works; it says nothing about real accuracy.
    texts, y = _toy()
    report = c.evaluate(texts, y)
    assert report["classes"] == ["bug", "documentation"]
    assert report["n_train"] + report["n_test"] == 20
    version = c.train_and_save(texts, y, str(tmp_path))
    bundle = c.load_model(str(tmp_path))
    assert bundle["version"] == version
    cat, score, uncertain = c.predict(bundle, "traceback crash")
    assert cat == "bug" and 0 < score <= 1 and isinstance(uncertain, bool)


def test_rare_classes_dropped_and_reported():
    texts, y = _toy()
    texts.append("security hole")
    y.append("security")
    report = c.evaluate(texts, y)
    assert report["dropped_classes"] == {"security": 1}
    assert "security" not in report["classes"]


def test_evaluate_needs_two_classes():
    with pytest.raises(ValueError):
        c.evaluate(["a"] * 10, ["bug"] * 10)


def test_load_model_missing(tmp_path):
    assert c.load_model(str(tmp_path)) is None
