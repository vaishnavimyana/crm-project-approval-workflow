# Models the two types of users in the system.
# Kept role as a simple string enum rather than a separate table —
# we only have 2 roles and that's not changing anytime soon.

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    # role is either "crm" or "approver" — that's it for this system
    role = Column(String(20), nullable=False)
    business_unit = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    created_projects = relationship(
        "Project",
        foreign_keys="Project.crm_user_id",
        back_populates="crm_user"
    )

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"