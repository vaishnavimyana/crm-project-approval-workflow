# app/routers/contracts.py
# ============================================================================
# Contract document upload, listing, download, deletion. Files go to S3,
# falls back to local storage if S3 not configured.
# ============================================================================
import os
import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.contract import Contract
from app.models.project import Project, ProjectVersion
from app.middleware.auth import get_current_user, require_crm
from app.services.audit_service import log_action
from app.config import get_settings

settings = get_settings()

# ---- IMPORTANT: keep this router definition at the top of the file.
router = APIRouter(tags=["Contracts"])

LOCAL_UPLOAD_DIR = "uploads"  # local fallback when S3 not configured


def save_file_locally(file_bytes: bytes, filename: str) -> str:
    os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)
    unique_filename = f"{uuid.uuid4()}_{filename}"
    filepath = os.path.join(LOCAL_UPLOAD_DIR, unique_filename)
    with open(filepath, "wb") as f:
        f.write(file_bytes)
    return f"local/{unique_filename}"


def upload_to_s3(file_bytes: bytes, s3_key: str) -> bool:
    try:
        import boto3
        s3_client = boto3.client(
            "s3", aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region)
        s3_client.put_object(Bucket=settings.s3_bucket_name, Key=s3_key,
                             Body=file_bytes, ContentType="application/pdf")
        return True
    except Exception as e:
        print(f"S3 upload failed: {e}")
        return False


@router.post("/projects/{project_id}/versions/{version_id}/contracts")
async def upload_contract(project_id: str, version_id: str,
                          document_type: str = Form(...),
                          valid_from: date = Form(...),
                          valid_till: date = Form(...),
                          file: UploadFile = File(...),
                          db: Session = Depends(get_db),
                          current_user=Depends(require_crm)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    version = db.query(ProjectVersion).filter(
        ProjectVersion.id == version_id, ProjectVersion.project_id == project_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Project version not found.")
    if version.status not in ["draft", "rejected"]:
        raise HTTPException(status_code=400,
            detail="Cannot upload contracts to a submitted or approved project.")
    if valid_from >= valid_till:
        raise HTTPException(status_code=400,
                            detail="Valid From date must be before Valid Till date.")
    file_bytes = await file.read()
    file_size_kb = str(round(len(file_bytes) / 1024, 2))
    if settings.aws_access_key_id and settings.s3_bucket_name:
        s3_key = f"contracts/{project_id}/{version_id}/{uuid.uuid4()}_{file.filename}"
        upload_to_s3(file_bytes, s3_key)
    else:
        s3_key = save_file_locally(file_bytes, file.filename)
    contract = Contract(project_version_id=version_id, document_type=document_type,
                        valid_from=valid_from, valid_till=valid_till, s3_key=s3_key,
                        original_filename=file.filename, file_size_kb=file_size_kb,
                        uploaded_by=current_user.id)
    db.add(contract)
    db.flush()
    log_action(db=db, project_id=project.id, project_version_id=version.id,
               action="CONTRACT_UPLOADED", performed_by=current_user.id,
               description=f"Contract '{file.filename}' ({document_type}) uploaded by {current_user.name}")
    db.commit()
    return {"message": "Contract uploaded successfully", "contract_id": str(contract.id),
            "filename": file.filename, "document_type": document_type,
            "valid_from": str(valid_from), "valid_till": str(valid_till),
            "file_size_kb": file_size_kb}


@router.get("/projects/{project_id}/versions/{version_id}/contracts")
def list_contracts(project_id: str, version_id: str, db: Session = Depends(get_db),
                   current_user=Depends(get_current_user)):
    contracts = db.query(Contract).filter(Contract.project_version_id == version_id).all()
    return [{"id": str(c.id), "document_type": c.document_type,
             "valid_from": str(c.valid_from), "valid_till": str(c.valid_till),
             "original_filename": c.original_filename,
             "file_size_kb": c.file_size_kb, "uploaded_at": c.uploaded_at.isoformat()}
            for c in contracts]


@router.get("/contracts/{contract_id}/download")
def get_download_url(contract_id: str, db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    """S3 presigned URL if using S3, direct path if local."""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")
    if contract.s3_key.startswith("local/"):
        return {"download_url": f"/uploads/{contract.s3_key.replace('local/', '')}",
                "filename": contract.original_filename, "storage": "local"}
    try:
        import boto3
        s3_client = boto3.client(
            "s3", aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region)
        url = s3_client.generate_presigned_url(
            "get_object", Params={"Bucket": settings.s3_bucket_name, "Key": contract.s3_key},
            ExpiresIn=3600)
        return {"download_url": url, "filename": contract.original_filename, "storage": "s3"}
    except Exception as e:
        raise HTTPException(status_code=500,
                            detail=f"Could not generate download URL: {str(e)}")


@router.delete("/contracts/{contract_id}")
def delete_contract(contract_id: str, db: Session = Depends(get_db),
                    current_user=Depends(require_crm)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")
    version = db.query(ProjectVersion).filter(
        ProjectVersion.id == contract.project_version_id).first()
    if version.status not in ["draft", "rejected"]:
        raise HTTPException(status_code=400,
                            detail="Cannot delete contracts from a submitted project.")
    filename = contract.original_filename
    project_id = version.project_id
    db.delete(contract)
    db.flush()
    log_action(db=db, project_id=project_id, project_version_id=version.id,
               action="CONTRACT_DELETED", performed_by=current_user.id,
               description=f"Contract '{filename}' deleted by {current_user.name}")
    db.commit()
    return {"message": "Contract deleted successfully"}
