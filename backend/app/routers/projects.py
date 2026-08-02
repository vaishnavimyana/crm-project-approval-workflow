# app/routers/projects.py
# ============================================================================
# Core project management: creation, updates, versioning, submission for
# approval. Includes the Creator filter on the listing page.
# ============================================================================
import json
from uuid import UUID
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.project import Project, ProjectVersion
from app.models.client import Client
from app.models.user import User
from app.models.job_category import JobCategory
from app.models.rate_card import RateCard
from app.schemas.project import (ProjectCreateRequest, ProjectUpdateRequest,
                                 SubmitForApprovalRequest)
from app.middleware.auth import get_current_user, require_crm
from app.services.audit_service import log_action

# ---- IMPORTANT: this line was missing, causing "NameError: name 'router' is
# ---- not defined". Keep it here at the very top of the file.
router = APIRouter(prefix="/projects", tags=["Projects"])


def generate_display_id(db: Session) -> str:
    """Sequential ID like PRJ-2024-001. Fine at this scale; would need a DB
    sequence for high concurrency production use."""
    year = datetime.now().year
    count = db.query(Project).count()
    return f"PRJ-{year}-{str(count + 1).zfill(3)}"


def build_version_response(version: ProjectVersion, db: Session) -> dict:
    reviewer_name = None
    if version.reviewer_id:
        reviewer = db.query(User).filter(User.id == version.reviewer_id).first()
        if reviewer:
            reviewer_name = reviewer.name
    job_categories = []
    for jc in version.job_categories:
        rate_card = db.query(RateCard).filter(RateCard.id == jc.rate_card_id).first()
        job_categories.append({
            "id": str(jc.id),
            "category_name": jc.category_name,
            "rate_card_id": str(jc.rate_card_id),
            "rate_card_title": rate_card.title if rate_card else None,
            "rate_card_rate": float(rate_card.rate) if rate_card else None,
            "rate_card_currency": rate_card.currency if rate_card else None,
        })
    return {
        "id": str(version.id),
        "version_number": version.version_number,
        "is_active": version.is_active,
        "name": version.name,
        "start_date": str(version.start_date),
        "end_date": str(version.end_date),
        "business_unit": version.business_unit,
        "status": version.status,
        "reviewer_id": str(version.reviewer_id) if version.reviewer_id else None,
        "reviewer_name": reviewer_name,
        "created_at": version.created_at.isoformat(),
        "updated_at": version.updated_at.isoformat(),
        "job_categories": job_categories,
    }


@router.get("")
def list_projects(status: Optional[str] = Query(None),
                  client_id: Optional[str] = Query(None),
                  creator_id: Optional[str] = Query(None),   # ADDED: Creator filter
                  db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    """Shared listing across all creators; filters: status, client, creator.
    Approvers only see projects assigned to them for review."""
    projects = db.query(Project).options(
        joinedload(Project.client), joinedload(Project.crm_user),
        joinedload(Project.versions))
    # NOTE: removed the CRM self-restriction so the Creator filter is meaningful.
    if client_id:
        projects = projects.filter(Project.client_id == client_id)
    if creator_id:                                     # ADDED
        projects = projects.filter(Project.crm_user_id == creator_id)
    projects = projects.order_by(Project.created_at.desc()).all()
    result = []
    for project in projects:
        if not project.versions:
            continue
        latest_version = max(project.versions, key=lambda v: v.version_number)
        if status and latest_version.status != status:
            continue
        if current_user.role == "approver" and latest_version.reviewer_id != current_user.id:
            continue
        result.append({
            "id": str(project.id),
            "display_id": project.display_id,
            "name": latest_version.name,
            "client_id": str(project.client_id),
            "client_name": project.client.legal_entity_name,
            "crm_user_id": str(project.crm_user_id),
            "crm_user_name": project.crm_user.name,
            "current_status": latest_version.status,
            "current_version_number": latest_version.version_number,
            "current_version_id": str(latest_version.id),
            "created_at": project.created_at.isoformat(),
            "updated_at": latest_version.updated_at.isoformat(),
        })
    return result


@router.post("")
def create_project(payload: ProjectCreateRequest, db: Session = Depends(get_db),
                   current_user: User = Depends(require_crm)):
    """Creates project + version 1 (draft). CRM only."""
    client = db.query(Client).filter(Client.id == payload.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    if payload.start_date >= payload.end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date.")
    project = Project(display_id=generate_display_id(db), client_id=payload.client_id,
                      crm_user_id=current_user.id)
    db.add(project)
    db.flush()
    version = ProjectVersion(
        project_id=project.id, version_number=1, is_active=False,
        name=payload.name, start_date=payload.start_date, end_date=payload.end_date,
        business_unit=payload.business_unit, reviewer_id=payload.reviewer_id, status="draft")
    db.add(version)
    db.flush()
    for jc in payload.job_categories:
        db.add(JobCategory(project_version_id=version.id, category_name=jc.category_name,
                           rate_card_id=jc.rate_card_id))
    db.flush()
    log_action(db=db, project_id=project.id, project_version_id=version.id,
               action="PROJECT_CREATED", performed_by=current_user.id,
               description=f"Project '{payload.name}' created by {current_user.name}")
    db.commit()
    return {"message": "Project created successfully", "project_id": str(project.id),
            "display_id": project.display_id, "version_id": str(version.id), "status": "draft"}


@router.get("/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    project = db.query(Project).options(
        joinedload(Project.client), joinedload(Project.crm_user),
        joinedload(Project.versions)).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    versions = []
    for v in sorted(project.versions, key=lambda x: x.version_number):
        v.job_categories = db.query(JobCategory).filter(
            JobCategory.project_version_id == v.id).all()
        versions.append(build_version_response(v, db))
    active_version = None
    approved_versions = [v for v in project.versions if v.is_active]
    if approved_versions:
        av = approved_versions[0]
        av.job_categories = db.query(JobCategory).filter(
            JobCategory.project_version_id == av.id).all()
        active_version = build_version_response(av, db)
    elif versions:
        active_version = versions[-1]
    client = project.client
    return {
        "id": str(project.id),
        "display_id": project.display_id,
        "client_id": str(project.client_id),
        "client": {
            "id": str(client.id),
            "legal_entity_name": client.legal_entity_name,
            "registered_address": client.registered_address,
            "billing_address": client.billing_address,
            "mode_of_payment": client.mode_of_payment,
            "gst_number": client.gst_number,
            "billing_currency": client.billing_currency,
            "contact_name": client.contact_name,
            "contact_designation": client.contact_designation,
            "contact_phone": client.contact_phone,
            "contact_email": client.contact_email,
        },
        "crm_user_id": str(project.crm_user_id),
        "crm_user_name": project.crm_user.name,
        "created_at": project.created_at.isoformat(),
        "versions": versions,
        "active_version": active_version,
    }


@router.put("/{project_id}/versions/{version_id}")
def update_project_version(project_id: str, version_id: str,
                           payload: ProjectUpdateRequest,
                           db: Session = Depends(get_db),
                           current_user: User = Depends(require_crm)):
    """Only draft/rejected versions can be edited; approved edits create a new version."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    if project.crm_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit projects you created.")
    version = db.query(ProjectVersion).filter(
        ProjectVersion.id == version_id, ProjectVersion.project_id == project_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Project version not found.")
    if version.status not in ["draft", "rejected"]:
        raise HTTPException(status_code=400,
            detail=f"Cannot edit a version with status '{version.status}'. "
                   f"Only draft or rejected versions can be edited.")
    changes = {}
    if payload.name and payload.name != version.name:
        changes["name"] = {"old": version.name, "new": payload.name}
        version.name = payload.name
    if payload.start_date and payload.start_date != version.start_date:
        changes["start_date"] = {"old": str(version.start_date), "new": str(payload.start_date)}
        version.start_date = payload.start_date
    if payload.end_date and payload.end_date != version.end_date:
        changes["end_date"] = {"old": str(version.end_date), "new": str(payload.end_date)}
        version.end_date = payload.end_date
    if payload.business_unit and payload.business_unit != version.business_unit:
        changes["business_unit"] = {"old": version.business_unit, "new": payload.business_unit}
        version.business_unit = payload.business_unit
    if payload.reviewer_id and payload.reviewer_id != version.reviewer_id:
        changes["reviewer_id"] = {"old": str(version.reviewer_id), "new": str(payload.reviewer_id)}
        version.reviewer_id = payload.reviewer_id
    if payload.job_categories is not None:
        db.query(JobCategory).filter(JobCategory.project_version_id == version.id).delete()
        for jc in payload.job_categories:
            db.add(JobCategory(project_version_id=version.id, category_name=jc.category_name,
                               rate_card_id=jc.rate_card_id))
        changes["job_categories"] = "updated"
    db.flush()
    if changes:
        log_action(db=db, project_id=project.id, project_version_id=version.id,
                   action="PROJECT_UPDATED", performed_by=current_user.id,
                   description=f"Project updated by {current_user.name}",
                   old_value=json.dumps({k: v["old"] for k, v in changes.items() if isinstance(v, dict)}),
                   new_value=json.dumps({k: v["new"] for k, v in changes.items() if isinstance(v, dict)}))
    db.commit()
    return {"message": "Project updated successfully", "version_id": version_id}


@router.post("/{project_id}/versions/{version_id}/submit")
def submit_for_approval(project_id: str, version_id: str,
                        payload: SubmitForApprovalRequest,
                        db: Session = Depends(get_db),
                        current_user: User = Depends(require_crm)):
    """Status draft/rejected -> pending_approval. Validates completeness on backend too."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    if project.crm_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only submit projects you created.")
    version = db.query(ProjectVersion).filter(
        ProjectVersion.id == version_id, ProjectVersion.project_id == project_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Project version not found.")
    if version.status not in ["draft", "rejected"]:
        raise HTTPException(status_code=400,
            detail=f"Cannot submit a version with status '{version.status}'.")
    from app.models.contract import Contract
    contracts_count = db.query(Contract).filter(
        Contract.project_version_id == version.id).count()
    if contracts_count == 0:
        raise HTTPException(status_code=400,
            detail="At least one contract document must be uploaded before submitting for approval.")
    job_cats_count = db.query(JobCategory).filter(
        JobCategory.project_version_id == version.id).count()
    if job_cats_count == 0:
        raise HTTPException(status_code=400,
            detail="At least one job category must be mapped before submitting for approval.")
    approver = db.query(User).filter(User.id == payload.reviewer_id,
                                     User.role == "approver").first()
    if not approver:
        raise HTTPException(status_code=404,
                            detail="Selected reviewer not found or is not an approver.")
    version.status = "pending_approval"
    version.reviewer_id = payload.reviewer_id
    db.flush()
    log_action(db=db, project_id=project.id, project_version_id=version.id,
               action="SUBMITTED_FOR_APPROVAL", performed_by=current_user.id,
               description=(f"Project v{version.version_number} submitted for approval "
                             f"by {current_user.name} -> assigned to {approver.name}"))
    db.commit()
    return {"message": "Project submitted for approval successfully",
            "status": "pending_approval", "reviewer": approver.name}


@router.post("/{project_id}/new-version")
def create_new_version(project_id: str, db: Session = Depends(get_db),
                       current_user: User = Depends(require_crm)):
    """Creates a new draft version from an approved project; old approved version
    stays active until the new one is approved."""
    project = db.query(Project).options(joinedload(Project.versions)).filter(
        Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    if project.crm_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    active_version = None
    for v in project.versions:
        if v.is_active and v.status == "approved":
            active_version = v
            break
    if not active_version:
        raise HTTPException(status_code=400,
            detail="No approved version found. Only approved projects can create new versions.")
    max_version = max(v.version_number for v in project.versions)
    new_version = ProjectVersion(
        project_id=project.id, version_number=max_version + 1, is_active=False,
        name=active_version.name, start_date=active_version.start_date,
        end_date=active_version.end_date, business_unit=active_version.business_unit,
        reviewer_id=None, status="draft")
    db.add(new_version)
    db.flush()
    old_job_cats = db.query(JobCategory).filter(
        JobCategory.project_version_id == active_version.id).all()
    for jc in old_job_cats:
        db.add(JobCategory(project_version_id=new_version.id, category_name=jc.category_name,
                           rate_card_id=jc.rate_card_id))
    db.flush()
    log_action(db=db, project_id=project.id, project_version_id=new_version.id,
               action="VERSION_CREATED", performed_by=current_user.id,
               description=(f"New version v{new_version.version_number} created by "
                             f"{current_user.name} from approved v{active_version.version_number}"))
    db.commit()
    return {"message": f"New version v{new_version.version_number} created",
            "new_version_id": str(new_version.id),
            "version_number": new_version.version_number, "status": "draft"}
