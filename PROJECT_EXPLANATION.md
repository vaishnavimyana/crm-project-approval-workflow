# CRM Project Approval Workflow - Project Explanation

## Project Overview

The CRM Project Approval Workflow is a full-stack web application developed to streamline the process of creating, reviewing, approving, and managing client projects.

The application allows CRM users to create projects, upload contract documents, map job categories with rate cards, and submit projects for approval. Approvers can review submitted projects, approve or reject them, while maintaining complete project history through versioning and audit logs.

The application was developed as a serverless solution using AWS cloud services.

---

# Problem Statement

In many organizations, project approvals are handled manually through emails and spreadsheets.

This approach creates several challenges:

- No centralized project management
- No approval tracking
- No audit history
- Difficult version management
- Poor document management
- Lack of accountability

This project solves these problems by providing a centralized approval workflow.

---

# Objectives

The primary objectives of the application are:

- Secure user authentication
- Role-based authorization
- Project lifecycle management
- Contract management
- Approval workflow
- Project versioning
- Audit trail
- Cloud deployment using AWS

---

# User Roles

## CRM User

Responsibilities:

- Login
- Create Projects
- Edit Draft Projects
- Upload Contracts
- Submit Projects
- View Audit Trail

---

## Approver

Responsibilities:

- Login
- View Pending Projects
- Review Projects
- Approve Projects
- Reject Projects
- Provide Rejection Reason

---

# Project Workflow

The application follows the workflow below:

1. User logs in.
2. JWT token is generated.
3. CRM user creates a project.
4. Client information is automatically loaded.
5. Contract documents are uploaded.
6. Job categories are mapped to rate cards.
7. Project is submitted for approval.
8. Approver reviews the project.
9. Project is approved or rejected.
10. Audit trail is updated.
11. Editing an approved project creates a new version.

---

# Major Features

- JWT Authentication
- Role-Based Access Control
- Client Auto-fill
- Multi-step Project Creation Wizard
- Contract Upload
- Amazon S3 Storage
- Rate Card Mapping
- Approval Workflow
- Project Versioning
- Audit Trail
- Serverless Deployment

---

# Frontend

The frontend is developed using:

- React
- Vite
- Tailwind CSS
- Axios
- React Query

The frontend is deployed on Netlify.

---

# Backend

The backend is developed using:

- FastAPI
- SQLAlchemy
- Alembic
- JWT Authentication

The backend is deployed using:

- AWS Lambda
- Amazon API Gateway
- Mangum
- Serverless Framework

---

# Database

Amazon RDS PostgreSQL stores:

- Users
- Clients
- Projects
- Versions
- Contracts
- Audit Logs
- Approvals
- Rate Cards

---

# File Storage

Contract documents are stored in Amazon S3.

Downloads use secure pre-signed URLs.

---

# Security

The application implements:

- JWT Authentication
- Password Hashing
- Protected API Endpoints
- Role-Based Authorization

---

# Deployment

## Frontend

Netlify

## Backend

AWS Lambda

## Database

Amazon RDS PostgreSQL

## Storage

Amazon S3

---

# Challenges Faced

During development, the following challenges were encountered:

- Configuring AWS Lambda deployment
- Connecting Lambda with Amazon RDS
- Setting up Serverless Framework
- Configuring JWT authentication
- Uploading contracts to Amazon S3
- Handling project versioning
- Managing audit trail records
- Frontend and backend integration

Each issue was resolved through proper AWS configuration, debugging, and testing.

---

# Testing

The application was tested for:

- Authentication
- Role-Based Access
- Project Creation
- Contract Upload
- Approval Workflow
- Rejection & Resubmission
- Versioning
- Audit Trail
- Backend APIs
- Frontend Integration

Detailed test cases are available in **TEST_CASES.md**.

---

# Future Enhancements

Possible improvements include:

- Email notifications
- Multi-level approvals
- Dashboard analytics
- Search and pagination
- AWS Cognito authentication
- CI/CD pipeline
- Project reporting

---

# Conclusion

The CRM Project Approval Workflow successfully demonstrates the implementation of a secure, scalable, serverless approval management system using React, FastAPI, PostgreSQL, and AWS.

The application satisfies the functional requirements of the assessment while following modern software engineering practices, including modular architecture, role-based security, audit logging, project versioning, and cloud deployment.