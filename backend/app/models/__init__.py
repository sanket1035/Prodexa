import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Integer,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

# all-MiniLM-L6-v2 produces 384-dimensional vectors (the planned baseline model).
EMBEDDING_DIM = 384


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def _created() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = _uuid_pk()
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    github_user_id: Mapped[int | None] = mapped_column(BigInteger, unique=True)
    github_login: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = _created()


class GithubAccount(Base):
    """OAuth token for a user. Stored encrypted, never sent to the browser."""

    __tablename__ = "github_accounts"
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    access_token_enc: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = _created()


class Organization(Base):
    __tablename__ = "organizations"
    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = _created()


class Membership(Base):
    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint("user_id", "organization_id"),)
    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="member")


class Repository(Base):
    __tablename__ = "repositories"
    id: Mapped[uuid.UUID] = _uuid_pk()
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    github_repo_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(300), nullable=False)
    created_at: Mapped[datetime] = _created()


class Issue(Base):
    __tablename__ = "issues"
    __table_args__ = (
        UniqueConstraint("repository_id", "github_issue_id"),
        Index("ix_issues_repo_state", "repository_id", "state"),
    )
    id: Mapped[uuid.UUID] = _uuid_pk()
    repository_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False
    )
    github_issue_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    number: Mapped[int | None] = mapped_column(Integer)
    html_url: Mapped[str | None] = mapped_column(Text)
    labels: Mapped[list] = mapped_column(JSONB, nullable=False, default=list, server_default="[]")
    comments_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    title: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str | None] = mapped_column(Text)
    state: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class PullRequest(Base):
    __tablename__ = "pull_requests"
    __table_args__ = (
        UniqueConstraint("repository_id", "github_pr_id"),
        Index("ix_prs_repo_state", "repository_id", "state"),
    )
    id: Mapped[uuid.UUID] = _uuid_pk()
    repository_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False
    )
    github_pr_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    state: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    merged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class IssueEmbedding(Base):
    __tablename__ = "issue_embeddings"
    __table_args__ = (
        Index(
            "ix_issue_embeddings_hnsw", "embedding",
            postgresql_using="hnsw", postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )
    issue_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("issues.id", ondelete="CASCADE"), primary_key=True
    )
    model_name: Mapped[str] = mapped_column(String(100), primary_key=True)
    model_version: Mapped[str] = mapped_column(String(50), primary_key=True)
    embedding = mapped_column(Vector(EMBEDDING_DIM), nullable=False)
    created_at: Mapped[datetime] = _created()


class IssuePrediction(Base):
    __tablename__ = "issue_predictions"
    __table_args__ = (UniqueConstraint("issue_id", "model_version", name="uq_issue_predictions_issue_model"),)
    id: Mapped[uuid.UUID] = _uuid_pk()
    issue_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("issues.id", ondelete="CASCADE"), nullable=False
    )
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = _created()


class SyncEvent(Base):
    __tablename__ = "sync_events"
    # provider_event_id is unique so a redelivered webhook cannot be processed twice.
    provider_event_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    repository_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("repositories.id", ondelete="SET NULL")
    )
    event_type: Mapped[str] = mapped_column(String(60), nullable=False)
    processing_status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    created_at: Mapped[datetime] = _created()


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[uuid.UUID] = _uuid_pk()
    actor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("organizations.id", ondelete="SET NULL")
    )
    action: Mapped[str] = mapped_column(String(80), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(60), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = _created()


class DuplicateFeedback(Base):
    """A human verdict on a suggested duplicate pair; kept for evaluation."""

    __tablename__ = "duplicate_feedback"
    __table_args__ = (UniqueConstraint("issue_id", "candidate_issue_id", "user_id", name="uq_duplicate_feedback"),)
    id: Mapped[uuid.UUID] = _uuid_pk()
    issue_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    candidate_issue_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("issues.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_duplicate: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = _created()
