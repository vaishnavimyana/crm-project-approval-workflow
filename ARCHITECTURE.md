# CRM Project Approval Workflow - System Architecture

## Overview

The CRM Project Approval Workflow is a full-stack web application that enables CRM users to create projects, upload contracts, map job categories to rate cards, and submit projects for approval. Approvers can review, approve, or reject projects while maintaining complete version history and audit logs.

The application follows a modern serverless architecture using AWS services.

---

# High-Level Architecture

```text
                    User
                     │
                     ▼
        React Frontend (Netlify)
                     │
               HTTPS REST API
                     │
                     ▼
            AWS API Gateway
                     │
                     ▼
      AWS Lambda (FastAPI + Mangum)
          │                   │
          │                   │
          ▼                   ▼
 Amazon RDS PostgreSQL    Amazon S3
     (Project Data)      (Contract PDFs)
```

---

# Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | React (Vite) |
| Styling | Tailwind CSS |
| Backend | FastAPI |
| ORM | SQLAlchemy |
| Authentication | JWT |
| Database | PostgreSQL (Amazon RDS) |
| File Storage | Amazon S3 |
| API Hosting | AWS Lambda |
| API Gateway | Amazon API Gateway |
| Deployment | Serverless Framework |
| Frontend Hosting | Netlify |

---

# Application Workflow

## Step 1

The CRM user logs into the application using JWT authentication.

↓

## Step 2

The React frontend sends login credentials to the FastAPI backend through API Gateway.

↓

## Step 3

The backend validates the credentials against PostgreSQL.

↓

## Step 4

A JWT token is generated and returned to the frontend.

↓

## Step 5

The CRM user creates a new project.

↓

## Step 6

Client details are automatically populated from the database.

↓

## Step 7

Contracts are uploaded to Amazon S3.

↓

## Step 8

Project information is stored in Amazon RDS.

↓

## Step 9

The project is submitted for approval.

↓

## Step 10

The Approver reviews the project.

↓

## Step 11

The project is approved or rejected.

↓

## Step 12

Every activity is recorded in the Audit Trail.

---

# Authentication Flow

```text
User Login
      │
      ▼
React Frontend
      │
      ▼
FastAPI
      │
      ▼
Validate User
      │
      ▼
Generate JWT
      │
      ▼
Frontend Stores Token
      │
      ▼
JWT Sent in Authorization Header
```

---

# Project Lifecycle

```text
Draft
   │
   ▼
Pending Approval
   │
   ├──────────────┐
   ▼              ▼
Approved      Rejected
   │              │
   │              ▼
   │         CRM Edits
   │              │
   └──────────────┘
          │
          ▼
Pending Approval
```

---

# AWS Components

## Amazon RDS

Stores:

- Users
- Clients
- Projects
- Versions
- Contracts
- Audit Logs
- Approvals

---

## Amazon S3

Stores:

- Contract PDF files

Downloads are provided using pre-signed URLs.

---

## AWS Lambda

Hosts the FastAPI backend.

Receives requests from API Gateway and executes business logic.

---

## Amazon API Gateway

Provides public REST endpoints and routes incoming requests to Lambda.

---

## Netlify

Hosts the React frontend and communicates securely with the backend API.

---

# Database Overview

Major entities include:

- Users
- Clients
- Projects
- Project Versions
- Contracts
- Job Categories
- Rate Cards
- Approvals
- Audit Logs

Relationships are managed using SQLAlchemy ORM.

---

# Security

The application uses:

- JWT Authentication
- Role-Based Access Control
- Protected API Endpoints
- Password Hashing
- Authorization Middleware

---

# Deployment Architecture

```text
Developer
      │
      ▼
GitHub Repository
      │
      ▼
AWS Lambda (Backend)

Netlify (Frontend)

Amazon RDS

Amazon S3
```

---

# Summary

The application implements a scalable serverless architecture using AWS managed services.

Business data is stored in Amazon RDS, contract documents are stored in Amazon S3, authentication is handled using JWT, and the React frontend communicates with the FastAPI backend through Amazon API Gateway.

The architecture satisfies the technical requirements of the CRM Project Approval Workflow assessment while providing a modular and maintainable design.