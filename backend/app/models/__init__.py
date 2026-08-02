# Import all models here so alembic can detect them for migrations
from app.models.user import User
from app.models.client import Client
from app.models.rate_card import RateCard
from app.models.project import Project, ProjectVersion
from app.models.contract import Contract
from app.models.job_category import JobCategory
from app.models.approval import Approval
from app.models.audit import AuditTrail