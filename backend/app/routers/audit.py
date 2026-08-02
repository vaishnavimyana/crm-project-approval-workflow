# app/routers/audit.py
# ============================================================================
# Read-only; trail is written automatically by other routers.
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit import AuditTrail
from app.models.project import Project
from app.models.user import User
from app.middleware.auth import get_current_user

# ---- IMPORTANT: keep this router definition at the top of the file.
router = APIRouter(prefix="/audit", tags=["Audit Trail"])


@router.get("/projects/{project_id}")
def get_project_audit_trail(project_id: str, db: Session = Depends(get_db),
                            current_user=Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    audit_logs = db.query(AuditTrail).filter(
        AuditTrail.project_id == project_id
    ).order_by(AuditTrail.timestamp.desc()).all()
    result = []
    for log in audit_logs:
        performer = db.query(User).filter(User.id == log.performed_by).first()
        result.append({
            "id": str(log.id),
            "action": log.action,
            "description": log.description,
            "performed_by": str(log.performed_by),
            "performer_name": performer.name if performer else "Unknown",
            "performer_role": performer.role if performer else "unknown",
            "old_value": log.old_value,
            "new_value": log.new_value,
            "timestamp": log.timestamp.isoformat(),
            "project_version_id": str(log.project_version_id) if log.project_version_id else None,
        })
    return result
