# app/routers/clients.py
# ============================================================================
# Client listing / detail for the Step 1 auto-fill.
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.client import Client
from app.schemas.client import ClientResponse
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("", response_model=List[ClientResponse])
def get_all_clients(db: Session = Depends(get_db),
                    current_user=Depends(get_current_user)):
    return db.query(Client).order_by(Client.legal_entity_name).all()


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: str, db: Session = Depends(get_db),
               current_user=Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    return client
