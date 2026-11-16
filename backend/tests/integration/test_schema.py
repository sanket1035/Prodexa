import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models import Issue, Organization, Repository, SyncEvent, User


@pytest.fixture()
def db(engine):
    with engine.begin() as c:
        c.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with Session(engine) as s:
        yield s
    Base.metadata.drop_all(engine)


def _repo(db):
    u = User(email=f"{uuid.uuid4()}@example.com")
    db.add(u)
    db.flush()
    o = Organization(name="org", owner_id=u.id)
    db.add(o)
    db.flush()
    r = Repository(organization_id=o.id, github_repo_id=1, full_name="a/b")
    db.add(r)
    db.flush()
    return r


def test_duplicate_github_issue_rejected(db):
    r = _repo(db)
    now = datetime.now(timezone.utc)
    db.add(Issue(repository_id=r.id, github_issue_id=7, title="t", state="open", created_at=now))
    db.flush()
    db.add(Issue(repository_id=r.id, github_issue_id=7, title="t2", state="open", created_at=now))
    with pytest.raises(IntegrityError):
        db.flush()


def test_duplicate_webhook_delivery_rejected(db):
    db.add(SyncEvent(provider_event_id="delivery-1", event_type="issues"))
    db.flush()
    db.add(SyncEvent(provider_event_id="delivery-1", event_type="issues"))
    with pytest.raises(IntegrityError):
        db.flush()
