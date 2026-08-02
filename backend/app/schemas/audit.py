# schemas/audit.py
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class AuditTrailResponse(BaseModel):
    id: UUID
    project_id: UUID
    action: str
    performed_by: UUID
    performer_name: str | None = None
    performer_role: str | None = None
    description: str
    old_value: str | None
    new_value: str | None
    timestamp: datetime

    class Config:
        from_attributes = True