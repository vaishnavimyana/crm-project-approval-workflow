# schemas/client.py
from uuid import UUID
from pydantic import BaseModel, EmailStr


class ClientResponse(BaseModel):
    id: UUID
    legal_entity_name: str
    registered_address: str
    billing_address: str | None
    mode_of_payment: str
    gst_number: str
    billing_currency: str
    contact_name: str
    contact_designation: str | None
    contact_phone: str | None
    contact_email: str

    class Config:
        from_attributes = True