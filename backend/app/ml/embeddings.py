"""Text embeddings for similar-issue search.

Two interchangeable embedders, both 384-dimensional and L2-normalised:
- HashingEmbedder: lexical (word and bigram) feature hashing. Works offline with no download, but it
  only matches shared words, NOT meaning. It is the default baseline.
- MiniLMEmbedder: sentence-transformers all-MiniLM-L6-v2 (semantic). Optional install, see requirements-ml.txt.
"""
import hashlib
import math
import re
from typing import Protocol

DIM = 384
_TOKEN = re.compile(r"[a-z0-9_]+")
STOPWORDS = frozenset(
    "a an the and or but if of to in on at for with from by is are was were be been it this that these those "
    "i we you they he she as not no do does did can could should would will have has had when then than so".split()
)


def tokens(text: str) -> list[str]:
    return [t for t in _TOKEN.findall(text.lower()) if t not in STOPWORDS and len(t) > 1]


class Embedder(Protocol):
    name: str
    version: str

    def embed(self, texts: list[str]) -> list[list[float]]: ...


class HashingEmbedder:
    name = "hashing-bow-bigram"
    version = "1"

    def _vector(self, text: str) -> list[float]:
        toks = tokens(text)
        feats = toks + [f"{a}_{b}" for a, b in zip(toks, toks[1:])]
        vec = [0.0] * DIM
        for f in feats:
            h = int.from_bytes(hashlib.blake2b(f.encode(), digest_size=8).digest(), "big")
            vec[h % DIM] += 1.0 if (h >> 63) & 1 else -1.0  # signed hashing reduces collision bias
        vec = [math.copysign(math.log1p(abs(x)), x) for x in vec]
        norm = math.sqrt(sum(x * x for x in vec))
        return [x / norm for x in vec] if norm else vec

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._vector(t) for t in texts]


class MiniLMEmbedder:
    name = "all-MiniLM-L6-v2"
    version = "sbert-3"

    def __init__(self) -> None:
        from sentence_transformers import SentenceTransformer  # optional dependency, imported lazily

        self._model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    def embed(self, texts: list[str]) -> list[list[float]]:
        return self._model.encode(texts, normalize_embeddings=True).tolist()


_cache: dict[str, Embedder] = {}


def get_embedder(kind: str) -> Embedder:
    if kind not in _cache:
        if kind == "hashing":
            _cache[kind] = HashingEmbedder()
        elif kind == "minilm":
            _cache[kind] = MiniLMEmbedder()
        else:
            raise ValueError(f"Unknown embedder {kind!r}")
    return _cache[kind]
