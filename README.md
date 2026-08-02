CRM Project Approval Workflow
A full-stack mini-SaaS module that lets a CRM user (Project Creator) set up projects,
upload contracts, map job categories to rate cards, and submit them for approval — then lets an
Approver review, approve, or reject them. Every change is versioned and recorded in a full
audit trail.

Built with React (frontend), FastAPI (backend), PostgreSQL, and deployed serverlessly
on AWS (Lambda + API Gateway + RDS + S3) with the frontend hosted on Netlify.

📦 Tech Stack
Layer	Technology
Frontend	React (Vite) + Tailwind CSS + React Query + Axios
Backend	Python + FastAPI + SQLAlchemy + Alembic + JWT
Database	PostgreSQL (Amazon RDS)
File Storage	Amazon S3 (presigned download URLs)
Serverless	AWS Lambda (via Mangum) + API Gateway
Hosting	Netlify (frontend static build)

🌐 Live URLs
-- Frontend: https://fastidious-longma-1256fd.netlify.app
-- Backend API: https://jtou9vlc0g.execute-api.ap-south-2.amazonaws.com
-- API Docs (Swagger): https://jtou9vlc0g.execute-api.ap-south-2.amazonaws.com/docs

🔑 Test Credentials
Role	Email	Password
CRM (Project Creator)	crm@test.com	password123
Approver (Reviewer)	approver@test.com	password123

🏗️ Architecture
text

Netlify Frontend (React)
        │  HTTPS
        ▼
AWS API Gateway
        │
        ▼
AWS Lambda (FastAPI + Mangum)
        │
        ▼
PostgreSQL (Amazon RDS) ─── Amazon S3 (Contract PDFs)

How it flows: The React app (on Netlify) calls the API Gateway. API Gateway invokes the
FastAPI app running on Lambda. The backend reads/writes project data in PostgreSQL and stores
contract PDFs in S3, issuing short-lived presigned URLs for downloads. JWT tokens secure every
call, with role-based access controlling what each user can do.

🔄 Project Workflow

1. CRM user logs into the application.
2. Creates a new project by selecting a client.
3. Client information is automatically populated.
4. Uploads one or more contract documents.
5. Maps job categories to available rate cards.
6. Assigns an approver.
7. Submits the project for approval.
8. Approver reviews the project and either approves or rejects it.
9. If rejected, the CRM user edits the project and resubmits it.
10. Every action is recorded in the audit trail, and approved project modifications create a new version.

🚀 Features
Two roles — CRM (Project Creator) and Approver (Reviewer), enforced at UI + API level.
Project creation wizard — 4 steps: Client Info → Contracts → Basic Info → Rate Cards.
Client auto-fill — selecting a client populates legal entity, GST, address, billing, contact.
Contract management — upload (to S3), view, download, delete; validity dates.
Job categories & rate cards — map free-text roles to a seeded pricing catalog.
Approval workflow — submit → pending → approve/reject (rejection requires a reason).
Rejection & resubmit — CRM sees the reason, edits, and resubmits.
Versioning — editing an approved project creates a new draft version that must be
re-approved before it becomes active; old version stays active until then.
Audit trail — a timeline of every action (who, what, when, old/new values).
Validation — backend blocks incomplete submissions (missing contract / job category / approver).

🛠️ Local Setup
Prerequisites
Python 3.12+, Node 18+, PostgreSQL (or Docker), AWS CLI (optional)
1. Backend
Bash

cd backend
python -m venv venv
venv\Scripts\activate          # Windows   (mac/Linux: source venv/bin/activate)
pip install -r requirements.txt

# create .env from .env.example, then:
alembic upgrade head          # create tables
python seed.py                # seed users, clients, rate cards

uvicorn app.main:app --reload
# API at http://127.0.0.1:8000  |  Swagger at http://127.0.0.1:8000/docs
2. Frontend
Bash

cd frontend
npm install
# create .env:  VITE_API_BASE_URL=http://127.0.0.1:8000
npm run dev
# open http://localhost:5173/login

📡 API Reference
Method	Endpoint	Description	Access
POST	/auth/login	Login → JWT token	Public
GET	/auth/me	Current user	JWT
GET	/clients	List clients	JWT
GET	/clients/{id}	Client detail	JWT
GET	/users/approvers	List approvers	JWT
GET	/users/creators	List CRM creators (filter)	JWT
GET	/rate-cards	Mock price catalog	JWT
GET	/projects	List (filters: status, client, creator)	JWT
POST	/projects	Create project (v1 draft)	CRM
GET	/projects/{id}	Project detail	JWT
PUT	/projects/{id}/versions/{vid}	Update version	CRM
POST	/projects/{id}/versions/{vid}/submit	Submit for approval	CRM
POST	/projects/{id}/new-version	Create new version	CRM
POST	/projects/{id}/versions/{vid}/contracts	Upload contract	CRM
GET	/projects/{id}/versions/{vid}/contracts	List contracts	JWT
GET	/contracts/{id}/download	Get download URL	JWT
DELETE	/contracts/{id}	Delete contract	CRM
GET	/approvals/pending	Pending approvals	Approver
POST	/approvals/{id}/versions/{vid}/approve	Approve	Approver
POST	/approvals/{id}/versions/{vid}/reject	Reject (comment)	Approver
GET	/approvals/{id}/versions/{vid}/decision	Latest decision	JWT
GET	/audit/projects/{id}	Audit trail	JWT
Full interactive docs at /docs.

☁️ AWS Deployment
Backend (Lambda + API Gateway)
Create RDS PostgreSQL instance; note the endpoint.
Point DATABASE_URL at RDS; run alembic upgrade head + python seed.py against it.
Create an S3 bucket for contracts.
Create an IAM user with Lambda/S3/CloudWatch permissions; run aws configure.
Deploy with Serverless Framework:
Bash

npm install -g serverless
cd backend
serverless plugin install --name serverless-python-requirements
serverless deploy
Copy the printed API Gateway URL.
Frontend (Netlify)
Bash

cd frontend
# set VITE_API_BASE_URL to your API Gateway URL
npm run build      # produces dist/
Drag dist/ into Netlify (or netlify deploy --prod).

🧪 Testing
The application has been tested for the following scenarios:

- User Authentication (JWT Login)
- Role-Based Access Control (CRM & Approver)
- Client Retrieval
- Project Creation
- Project Update
- Contract Upload
- Job Category Mapping
- Project Submission
- Approval Workflow
- Project Rejection & Resubmission
- Version Creation
- Audit Trail
- S3 Contract Download
- Frontend–Backend Integration
- End-to-End Workflow Validation

Detailed test cases are documented in `TEST_CASES.md`.

📝 Design Assumptions
Two roles only: crm and approver, enforced via JWT role claims.
Simple role-based JWT auth was chosen (the assignment allows Cognito or simple role auth).
Rate cards are a seeded, read-only mock catalog.
Versioning: editing an approved project creates a new draft that must be re-approved; one
version is active at a time.
Contract files go to S3; presigned URLs handle download; local uploads/ fallback in dev.
Audit trail records every meaningful action (action, performer, timestamp, old/new values).
Project listing is a shared view across creators, with a Creator filter (per the assignment).

📁 Repository Layout
text

backend/
  app/
    models/          # SQLAlchemy models (users, clients, projects, versions, ...)
    routers/         # FastAPI routers (auth, clients, projects, contracts, approvals, ...)
    schemas/         # Pydantic request/response models
    services/        # audit_service, etc.
    middleware/      # JWT auth + role guards
    main.py          # FastAPI app + Mangum handler
    database.py      # SQLAlchemy engine/session
    config.py        # settings from env
  alembic/           # migrations
  seed.py            # seed data
  serverless.yml     # Lambda deploy config
  requirements.txt
frontend/
  src/
    pages/           # Login, ProjectList, ProjectCreate, ProjectDetail, ApproverDashboard
    components/      # common, wizard, approvals, projects
    services/        # API service layer
    context/         # AuthContext
    utils/           # statusConfig, dateHelpers
  .env
README.md
TEST_CASES.md