# app/main.py
# ============================================================================
# Entry point. Registers all routers. Mangum handler enables AWS Lambda deploy.
# ============================================================================
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from mangum import Mangum
from app.routers import (auth, clients, users, rate_cards, projects,
                         contracts, approvals, audit)

app = FastAPI(
    title="CRM Project Approval Workflow",
    description="API for managing project creation and approval workflows",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve locally-uploaded contract files so the /uploads/... download URL works.
# (On AWS the S3 presigned URL is used instead; this only matters locally.)
UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(users.router)
app.include_router(rate_cards.router)
app.include_router(projects.router)
app.include_router(contracts.router)
app.include_router(approvals.router)
app.include_router(audit.router)


@app.get("/")
def health_check():
    return {"status": "running", "message": "CRM Approval Workflow API"}


handler = Mangum(app)  # AWS Lambda; ignored when run locally with uvicorn
