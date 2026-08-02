# services/audit_service.py
# Central place for logging audit events.
# Every router calls log_action() after important operations.
# Keeps audit logic out of the route handlers.

from uuid import UUID
from sqlalchemy.orm import Session
from app.models.audit import AuditTrail


def log_action(
    db: Session,
    project_id: UUID,
    action: str,
    performed_by: UUID,
    description: str,
    project_version_id: UUID = None,
    old_value: str = None,
    new_value: str = None
):
    """
    Creates an audit trail entry.
    Called after every meaningful action in the system.

    Intentionally kept simple — just insert and flush.
    The calling function handles the final db.commit().
    """
    entry = AuditTrail(
        project_id=project_id,
        project_version_id=project_version_id,
        action=action,
        performed_by=performed_by,
        description=description,
        old_value=old_value,
        new_value=new_value
    )
    db.add(entry)
    db.flush()
    return entry