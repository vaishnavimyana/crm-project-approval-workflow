# schemas/project.py
# Request and response shapes for project endpoints.

from uuid import UUID
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel


# --- Job Category Schemas ---

class JobCategoryCreate(BaseModel):
    category_name: str
    rate_card_id: UUID


class JobCategoryResponse(BaseModel):
    id: UUID
    category_name: str
    rate_card_id: UUID
    rate_card_title: str | None = None
    rate_card_rate: float | None = None

    class Config:
        from_attributes = True


# --- Project Creation ---

class ProjectCreateRequest(BaseModel):
    client_id: UUID
    name: str
    start_date: date
    end_date: date
    business_unit: str
    reviewer_id: UUID | None = None
    job_categories: List[JobCategoryCreate] = []


class ProjectUpdateRequest(BaseModel):
    name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    business_unit: str | None = None
    reviewer_id: UUID | None = None
    job_categories: List[JobCategoryCreate] | None = None


class SubmitForApprovalRequest(BaseModel):
    reviewer_id: UUID


# --- Responses ---

class ProjectVersionResponse(BaseModel):
    id: UUID
    version_number: int
    is_active: bool
    name: str
    start_date: date
    end_date: date
    business_unit: str
    status: str
    reviewer_id: UUID | None
    reviewer_name: str | None = None
    created_at: datetime
    updated_at: datetime
    job_categories: List[JobCategoryResponse] = []

    class Config:
        from_attributes = True


class ProjectListItem(BaseModel):
    """Used in the project listing table."""
    id: UUID
    display_id: str
    client_name: str
    crm_user_name: str
    current_version_number: int
    current_status: str
    current_version_id: UUID
    name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectDetailResponse(BaseModel):
    """Full project detail for the detail/edit page."""
    id: UUID
    display_id: str
    client_id: UUID
    client: dict
    crm_user_id: UUID
    crm_user_name: str
    created_at: datetime
    versions: List[ProjectVersionResponse] = []
    active_version: ProjectVersionResponse | None = None

    class Config:
        from_attributes = True