import uuid

from sqlalchemy.orm import Session

from app.models import AuditLog


def record(db: Session, actor_id: uuid.UUID | None, organization_id: uuid.UUID | None,
           action: str, resource_type: str, resource_id: object) -> None:
    """Stage an audit row in the caller's transaction; it commits (or rolls back) with the change."""
    db.add(AuditLog(actor_id=actor_id, organization_id=organization_id, action=action,
                    resource_type=resource_type, resource_id=str(resource_id)))
