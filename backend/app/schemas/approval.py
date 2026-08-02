# schemas/approval.py
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class ApproveRequest(BaseModel):
    comments: str | None = None


class RejectRequest(BaseModel):
    # Comments are REQUIRED for rejection
    comments: str


class ApprovalResponse(BaseModel):
    id: UUID
    project_version_id: UUID
    approver_id: UUID
    approver_name: str | None = None
    status: str
    comments: str | None
    created_at: datetime
    decided_at: datetime | None

    class Config:
        from_attributes = True