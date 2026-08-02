# app/routers/rate_cards.py
# ============================================================================
# Read-only mock price catalog.
# ============================================================================
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.rate_card import RateCard
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/rate-cards", tags=["Rate Cards"])


@router.get("")
def get_rate_cards(db: Session = Depends(get_db),
                   current_user=Depends(get_current_user)):
    cards = db.query(RateCard).order_by(RateCard.title).all()
    return [{"id": str(c.id), "title": c.title, "rate": float(c.rate),
             "currency": c.currency, "unit": c.unit} for c in cards]
