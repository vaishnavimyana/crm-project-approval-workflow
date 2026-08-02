# Contract documents uploaded by CRM.
# File itself lives in S3, this table just tracks the metadata.
# s3_key is what we use to fetch/generate download URLs.

import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_version_id = Column(UUID(as_uuid=True),
                                ForeignKey("project_versions.id"),
                                nullable=False)

    document_type = Column(String(100), nullable=False)
    valid_from = Column(Date, nullable=False)
    valid_till = Column(Date, nullable=False)

    # S3 storage details
    s3_key = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size_kb = Column(String(20), nullable=True)

    uploaded_by = Column(UUID(as_uuid=True),
                         ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project_version = relationship("ProjectVersion",
                                   back_populates="contracts")
    uploader = relationship("User", foreign_keys=[uploaded_by])

    def __repr__(self):
        return f"<Contract {self.document_type} - {self.original_filename}>"