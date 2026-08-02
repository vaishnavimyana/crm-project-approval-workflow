# database.py
# Sets up the SQLAlchemy engine and session factory.
# Keeping this separate from models so we don't get circular imports
# down the line — learned that lesson the hard way.

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    # Connection pool settings — defaults work fine for this scale
    # but keeping pool_pre_ping=True to handle dropped connections
    pool_pre_ping=True,
    echo=settings.environment == "development"  # logs SQL in dev only
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# All models inherit from this Base
# Imported in every model file
Base = declarative_base()


def get_db():
    """
    Dependency injected into every route that needs DB access.
    Yields a session and always closes it after request is done,
    even if an exception was raised.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()