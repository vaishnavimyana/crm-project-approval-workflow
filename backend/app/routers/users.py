# app/routers/users.py
# ============================================================================
# User lookup endpoints: approvers list + creators list (for filters).
# ============================================================================
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/approvers")
def get_approvers(db: Session = Depends(get_db),
                  current_user=Depends(get_current_user)):
    approvers = db.query(User).filter(
        User.role == "approver", User.is_active == True).all()
    return [{"id": str(a.id), "name": a.name, "email": a.email,
             "business_unit": a.business_unit} for a in approvers]


@router.get("/creators")
def get_creators(db: Session = Depends(get_db),
                 current_user=Depends(get_current_user)):
    """List CRM creators for the Creator filter on the project listing page."""
    creators = db.query(User).filter(
        User.role == "crm", User.is_active == True).all()
    return [{"id": str(u.id), "name": u.name, "email": u.email} for u in creators]
