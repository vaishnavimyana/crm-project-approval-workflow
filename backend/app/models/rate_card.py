# Rate cards are the pricing catalog — seeded once, read-only in the app.
# In a real product, an admin panel would manage these.
# For this assignment, we seed them and expose a read-only endpoint.

import uuid
from sqlalchemy import Column, String, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class RateCard(Base):
    __tablename__ = "rate_cards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(100), nullable=False)
    rate = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="USD")
    unit = Column(String(50), nullable=False, default="per hour")

    # Relationships
    job_categories = relationship("JobCategory", back_populates="rate_card")

    def __repr__(self):
        return f"<RateCard {self.title} - {self.rate} {self.currency}>"