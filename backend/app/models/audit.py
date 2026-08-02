# Audit trail — every meaningful action gets logged here.
# This is what makes the system trustworthy from a compliance perspective.
#
# Logging strategy: log EVERYTHING that matters.
# Better to have too much audit data than too little.
# old_value and new_value are JSON strings for field changes.

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

# All possible audit actions — keeps things consistent
AUDIT_ACTIONS = [
    "PROJECT_CREATED",
    "PROJECT_UPDATED",
    "CLIENT_SELECTED",
    "CONTRACT_UPLOADED",
    "CONTRACT_DELETED",
    "JOB_CATEGORY_ADDED",
    "JOB_CATEGORY_REMOVED",
    "SUBMITTED_FOR_APPROVAL",
    "APPROVED",
    "REJECTED",
    "RESUBMITTED",
    "VERSION_CREATED",
    "VERSION_ACTIVATED",
]


class AuditTrail(Base):
    __tablename__ = "audit_trail"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Both project and version tracked for full context
    project_id = Column(UUID(as_uuid=True),
                        ForeignKey("projects.id"), nullable=False)
    project_version_id = Column(UUID(as_uuid=True),
                                ForeignKey("project_versions.id"),
                                nullable=True)

    action = Column(String(50), nullable=False)
    performed_by = Column(UUID(as_uuid=True),
                          ForeignKey("users.id"), nullable=False)

    # Human readable description shown in UI timeline
    description = Column(Text, nullable=False)

    # For field changes — stored as JSON string
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)

    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    performer = relationship("User", foreign_keys=[performed_by])

    def __repr__(self):
        return f"<AuditTrail {self.action} at {self.timestamp}>"