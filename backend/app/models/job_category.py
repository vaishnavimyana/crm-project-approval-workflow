# Maps a job role on the project to a rate card entry.
# category_name is free text (e.g., "Frontend Developer")
# rate_card_id points to our seeded rate catalog.

import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class JobCategory(Base):
    __tablename__ = "job_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_version_id = Column(UUID(as_uuid=True),
                                ForeignKey("project_versions.id"),
                                nullable=False)

    category_name = Column(String(100), nullable=False)
    rate_card_id = Column(UUID(as_uuid=True),
                          ForeignKey("rate_cards.id"), nullable=False)

    # Relationships
    project_version = relationship("ProjectVersion",
                                   back_populates="job_categories")
    rate_card = relationship("RateCard", back_populates="job_categories")

    def __repr__(self):
        return f"<JobCategory {self.category_name}>"