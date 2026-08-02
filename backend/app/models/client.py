# Client represents the company we're doing the project for.
# Fields come directly from the assignment spec.
# Billing address is optional — can be same as registered address.

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Core company info
    legal_entity_name = Column(String(255), nullable=False)
    registered_address = Column(Text, nullable=False)
    billing_address = Column(Text, nullable=True)  # null = same as registered

    # Financial details
    mode_of_payment = Column(String(100), nullable=False)
    gst_number = Column(String(20), nullable=False)
    billing_currency = Column(String(10), nullable=False, default="INR")

    # Primary point of contact at the client company
    contact_name = Column(String(100), nullable=False)
    contact_designation = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    # Relationships
    projects = relationship("Project", back_populates="client")

    def __repr__(self):
        return f"<Client {self.legal_entity_name}>"