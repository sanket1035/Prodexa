from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.db.session import get_db
from app.models import AuditLog, Membership, User

router = APIRouter(prefix="/api/v1", tags=["audit"])


@router.get("/audit-logs")
def audit_logs(limit: int = Query(default=50, ge=1, le=200), user: User = Depends(current_user),
               db: Session = Depends(get_db)):
    """Recent audit entries for organizations where the caller is owner or admin."""
    orgs = list(db.scalars(select(Membership.organization_id).where(
        Membership.user_id == user.id, Membership.role.in_(["owner", "admin"]))))
    rows = db.scalars(select(AuditLog).where(AuditLog.organization_id.in_(orgs))
                      .order_by(AuditLog.created_at.desc()).limit(limit)).all()
    return [{"action": r.action, "resource_type": r.resource_type, "resource_id": r.resource_id,
             "actor_id": str(r.actor_id) if r.actor_id else None, "created_at": r.created_at.isoformat()} for r in rows]
