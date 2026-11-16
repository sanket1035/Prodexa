import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest

from app.services import priority as p

NOW = datetime(2026, 6, 1, tzinfo=timezone.utc)


def issue(labels=(), comments=0, age_days=0):
    return SimpleNamespace(labels=list(labels), comments_count=comments, created_at=NOW - timedelta(days=age_days))


def test_weights_sum_to_one():
    assert sum(p.WEIGHTS.values()) == pytest.approx(1.0)


def test_severity_sources():
    assert p.severity(["Critical"])[0] == 100
    assert p.severity(["high"])[0] == 80
    assert p.severity(["bug"])[0] == 70
    assert p.severity(["help wanted"]) == (40.0, "no recognised label; default")


def test_recency_curve():
    assert p.recency(NOW - timedelta(days=3), NOW)[0] == 100
    assert p.recency(NOW - timedelta(days=400), NOW)[0] == 0
    mid = p.recency(NOW - timedelta(days=(7 + 180) / 2), NOW)[0]
    assert mid == pytest.approx(50.0)


def test_score_is_the_documented_formula():
    f = p.compute_factors(issue(["critical"], comments=3, age_days=2), similar_open=2, now=NOW)
    # S=100, F=50, R=100, B=30  ->  0.35*100 + 0.25*50 + 0.20*100 + 0.20*30
    assert p.score_of(f) == pytest.approx(0.35 * 100 + 0.25 * 50 + 0.20 * 100 + 0.20 * 30)
    assert [x.name for x in f] == ["severity", "frequency", "recency", "impact"]


def test_missing_embedding_is_visible_not_silent():
    f = {x.name: x for x in p.compute_factors(issue(), similar_open=None, now=NOW)}
    assert f["frequency"].value == 0 and "not embedded" in f["frequency"].raw


def test_frequency_and_impact_are_capped():
    f = {x.name: x for x in p.compute_factors(issue(comments=99), similar_open=50, now=NOW)}
    assert f["frequency"].value == 100 and f["impact"].value == 100


def test_weight_sensitivity_reports_each_factor():
    ids = [uuid.uuid4() for _ in range(8)]
    rows = [(i, p.compute_factors(issue(["bug"] if n % 2 else [], comments=n, age_days=n * 20), n % 3, NOW))
            for n, i in enumerate(ids)]
    out = p.weight_sensitivity(rows)
    assert {o["boosted_factor"] for o in out} == set(p.WEIGHTS)
    assert all(0 <= o["top_n_overlap"] <= 5 for o in out)
