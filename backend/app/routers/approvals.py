# app/routers/approvals.py
# ============================================================================
# Approvers review and decide on projects.
# ============================================================================
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.project import Project, ProjectVersion
from app.models.approval import Approval
from app.models.user import User
from app.schemas.approval import ApproveRequest, RejectRequest
from app.middleware.auth import get_current_user, require_approver
from app.services.audit_service import log_action

# ---- IMPORTANT: keep this router definition at the top of the file.
router = APIRouter(prefix="/approvals", tags=["Approvals"])


@router.get("/pending")
def get_pending_approvals(db: Session = Depends(get_db),
                          current_user: User = Depends(require_approver)):
    pending_versions = db.query(ProjectVersion).filter(
        ProjectVersion.reviewer_id == current_user.id,
        ProjectVersion.status == "pending_approval").all()
    result = []
    for version in pending_versions:
        project = db.query(Project).options(
            joinedload(Project.client), joinedload(Project.crm_user)
        ).filter(Project.id == version.project_id).first()
        if not project:
            continue
        result.append({
            "project_id": str(project.id),
            "display_id": project.display_id,
            "version_id": str(version.id),
            "version_number": version.version_number,
            "project_name": version.name,
            "client_name": project.client.legal_entity_name,
            "submitted_by": project.crm_user.name,
            "start_date": str(version.start_date),
            "end_date": str(version.end_date),
            "business_unit": version.business_unit,
            "submitted_at": version.updated_at.isoformat(),
        })
    return result


@router.post("/{project_id}/versions/{version_id}/approve")
def approve_project(project_id: str, version_id: str, payload: ApproveRequest,
                    db: Session = Depends(get_db),
                    current_user: User = Depends(require_approver)):
    """Approved version becomes active; previous active version is deactivated."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    version = db.query(ProjectVersion).filter(
        ProjectVersion.id == version_id, ProjectVersion.project_id == project_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Project version not found.")
    if version.reviewer_id != current_user.id:
        raise HTTPException(status_code=403,
                            detail="You are not the assigned reviewer for this project.")
    if version.status != "pending_approval":
        raise HTTPException(status_code=400,
                            detail=f"Cannot approve a version with status '{version.status}'.")
    db.query(ProjectVersion).filter(
        ProjectVersion.project_id == project_id,
        ProjectVersion.is_active == True).update({"is_active": False})
    version.status = "approved"
    version.is_active = True
    db.flush()
    approval = Approval(project_version_id=version.id, approver_id=current_user.id,
                        status="approved", comments=payload.comments,
                        decided_at=datetime.utcnow())
    db.add(approval)
    db.flush()
    log_action(db=db, project_id=project.id, project_version_id=version.id,
               action="APPROVED", performed_by=current_user.id,
               description=(f"Project v{version.version_number} approved by {current_user.name}"
                            + (f". Note: {payload.comments}" if payload.comments else "")))
    log_action(db=db, project_id=project.id, project_version_id=version.id,
               action="VERSION_ACTIVATED", performed_by=current_user.id,
               description=(f"Version v{version.version_number} is now the active "
                             f"version of {project.display_id}"))
    db.commit()
    return {"message": "Project approved successfully", "project_id": project_id,
            "version_number": version.version_number, "status": "approved"}


@router.post("/{project_id}/versions/{version_id}/reject")
def reject_project(project_id: str, version_id: str, payload: RejectRequest,
                   db: Session = Depends(get_db),
                   current_user: User = Depends(require_approver)):
    """Rejects with mandatory comments; CRM can then edit and resubmit the same version."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    version = db.query(ProjectVersion).filter(
        ProjectVersion.id == version_id, ProjectVersion.project_id == project_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Project version not found.")
    if version.reviewer_id != current_user.id:
        raise HTTPException(status_code=403,
                            detail="You are not the assigned reviewer for this project.")
    if version.status != "pending_approval":
        raise HTTPException(status_code=400,
                            detail=f"Cannot reject a version with status '{version.status}'.")
    if not payload.comments or not payload.comments.strip():
        raise HTTPException(status_code=400, detail="Rejection reason is required.")
    version.status = "rejected"
    db.flush()
    approval = Approval(project_version_id=version.id, approver_id=current_user.id,
                        status="rejected", comments=payload.comments,
                        decided_at=datetime.utcnow())
    db.add(approval)
    db.flush()
    log_action(db=db, project_id=project.id, project_version_id=version.id,
               action="REJECTED", performed_by=current_user.id,
               description=(f"Project v{version.version_number} rejected by "
                             f"{current_user.name}. Reason: {payload.comments}"),
               new_value=payload.comments)
    db.commit()
    return {"message": "Project rejected", "project_id": project_id,
            "version_number": version.version_number, "status": "rejected",
            "rejection_reason": payload.comments}


@router.get("/{project_id}/versions/{version_id}/decision")
def get_latest_decision(project_id: str, version_id: str, db: Session = Depends(get_db),
                        current_user=Depends(get_current_user)):
    """Used by CRM to see rejection reason on their project."""
    approval = db.query(Approval).filter(
        Approval.project_version_id == version_id
    ).order_by(Approval.created_at.desc()).first()
    if not approval:
        return {"decision": None}
    approver = db.query(User).filter(User.id == approval.approver_id).first()
    return {"decision": {
        "status": approval.status,
        "comments": approval.comments,
        "decided_by": approver.name if approver else "Unknown",
        "decided_at": approval.decided_at.isoformat() if approval.decided_at else None,
    }}
