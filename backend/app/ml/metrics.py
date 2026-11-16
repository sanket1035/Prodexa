"""Retrieval metrics for duplicate suggestions.

Ground truth = pairs a human marked as duplicate. Candidates nobody labeled count as NOT duplicate,
so precision@k is a lower bound. Define "duplicate" before scoring (see docs/ml-evaluation.md).
"""


def precision_at_k(ranked: list[str], relevant: set[str], k: int) -> float:
    return sum(1 for x in ranked[:k] if x in relevant) / k


def recall_at_k(ranked: list[str], relevant: set[str], k: int) -> float:
    return sum(1 for x in ranked[:k] if x in relevant) / len(relevant) if relevant else 0.0
