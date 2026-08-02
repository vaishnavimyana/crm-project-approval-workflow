# This is the most important model in the system.
# 
# Design decision: split into Project + ProjectVersion
# Project = the parent container (stable, never changes)
# ProjectVersion = actual data (can have multiple versions)
#
# This makes the versioning requirement clean to implement.
# When an approved project is edited, we create a new ProjectVersion
# row pointing to the same Project parent.

import uuid
from datetime import datetime, date
from sqlalchemy import (Column, String, DateTime,
                        Date, Integer, Boolean,
                        ForeignKey, Enum as SAEnum)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

# Valid status transitions:
# draft -> pending_approval
# pending_approval -> approved | rejected
# rejected -> pending_approval (resubmit)
# approved -> (editing creates new version in draft)
PROJECT_STATUSES = ["draft", "pending_approval", "approved", "rejected"]


class Project(Base):
    """
    Parent record. Think of this as the project identity.
    display_id like PRJ-2024-001 lives here.
    """
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Human readable ID shown in the UI — PRJ-2024-001 format
    display_id = Column(String(20), unique=True, nullable=False, index=True)

    client_id = Column(UUID(as_uuid=True),
                       ForeignKey("clients.id"), nullable=False)
    crm_user_id = Column(UUID(as_uuid=True),
                         ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    client = relationship("Client", back_populates="projects")
    crm_user = relationship(
        "User",
        foreign_keys=[crm_user_id],
        back_populates="created_projects"
    )
    versions = relationship(
        "ProjectVersion",
        back_populates="project",
        order_by="ProjectVersion.version_number"
    )

    @property
    def active_version(self):
        """Returns the currently active version of this project."""
        for v in self.versions:
            if v.is_active:
                return v
        # If nothing active yet, return latest
        return self.versions[-1] if self.versions else None

    def __repr__(self):
        return f"<Project {self.display_id}>"


class ProjectVersion(Base):
    """
    Actual project data. Every edit to an approved project
    creates a new row here with version_number incremented.
    Only one version can be is_active=True at a time.
    """
    __tablename__ = "project_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True),
                        ForeignKey("projects.id"), nullable=False)

    version_number = Column(Integer, nullable=False, default=1)
    is_active = Column(Boolean, default=False)

    # Project details
    name = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    business_unit = Column(String(100), nullable=False)

    # Status of THIS version
    status = Column(
        SAEnum(*PROJECT_STATUSES, name="project_status"),
        default="draft",
        nullable=False
    )

    # Who is reviewing this version
    reviewer_id = Column(UUID(as_uuid=True),
                         ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="versions")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    contracts = relationship(
        "Contract",
        back_populates="project_version",
        cascade="all, delete-orphan"
    )
    job_categories = relationship(
        "JobCategory",
        back_populates="project_version",
        cascade="all, delete-orphan"
    )
    approvals = relationship(
        "Approval",
        back_populates="project_version",
        order_by="Approval.created_at.desc()"
    )

    def __repr__(self):
        return f"<ProjectVersion {self.project_id} v{self.version_number}>"