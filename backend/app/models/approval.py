# Tracks each approval decision made on a project version.
# One record per approve/reject action.
# Comments are required on rejection — enforced at API level.

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

APPROVAL_STATUSES = ["pending", "approved", "rejected"]


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_version_id = Column(UUID(as_uuid=True),
                                ForeignKey("project_versions.id"),
                                nullable=False)

    approver_id = Column(UUID(as_uuid=True),
                         ForeignKey("users.id"), nullable=False)

    status = Column(String(20), nullable=False, default="pending")

    # Required when rejecting — API enforces this
    comments = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    decided_at = Column(DateTime, nullable=True)  # when approved/rejected

    # Relationships
    project_version = relationship("ProjectVersion",
                                   back_populates="approvals")
    approver = relationship("User", foreign_keys=[approver_id])

    def __repr__(self):
        return f"<Approval {self.status} by {self.approver_id}>"