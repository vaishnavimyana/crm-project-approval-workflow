# CRM Project Approval Workflow - Test Cases

## Overview

This document contains the functional, integration, validation, role-based access control (RBAC), approval workflow, versioning, contract management, and non-functional test cases for the **CRM Project Approval Workflow** application.

The application has been deployed using AWS Serverless services and Netlify, and all test cases are intended to be executed against the deployed application.

---

# Test Environment

| Component | Value |
|-----------|-------|
| Frontend | Netlify |
| Backend | AWS Lambda + API Gateway |
| Database | Amazon RDS (PostgreSQL) |
| File Storage | Amazon S3 |
| Authentication | JWT |
| Browser | Google Chrome |
| Frontend URL | https://fastidious-longma-1256fd.netlify.app |
| Backend API | https://jtou9vlc0g.execute-api.ap-south-2.amazonaws.com |
| Swagger API | https://jtou9vlc0g.execute-api.ap-south-2.amazonaws.com/docs |

---

# Test Users

| Role | Email | Password |
|------|--------|----------|
| CRM (Project Creator) | crm@test.com | password123 |
| Approver (Reviewer) | approver@test.com | password123 |

---

# Sample Seed Data

## Clients

- ABC Corporation Ltd
- DEF Industries Ltd
- XYZ Solutions Pvt Ltd

## Rate Cards

| Job Category | Rate (USD/Hour) |
|--------------|-----------------|
| Junior Developer | 50 |
| Senior Developer | 150 |
| Project Manager | 120 |
| UI/UX Designer | 80 |
| QA Engineer | 60 |
| DevOps Engineer | 130 |
| Business Analyst | 90 |
| Technical Architect | 200 |

---

# A. Authentication & Role-Based Access Control

| ID | Steps | Expected Result | Status |
|----|-------|-----------------|--------|
| A1 | Login CRM with correct credentials | 200, JWT generated, CRM user logged in | PASS |
| A2 | Login Approver with correct credentials | 200, JWT generated, Approver logged in | PASS |
| A3 | Login using incorrect password | 401 Unauthorized | PASS |
| A4 | Login using unregistered email | 401 Unauthorized | PASS |
| A5 | CRM accesses Approver endpoint | 403 Forbidden | PASS |
| A6 | Approver accesses CRM endpoint | 403 Forbidden | PASS |
| A7 | Access protected endpoint without JWT | 401 Unauthorized | PASS |
| A8 | Approver manually opens CRM page | Redirected to Approver Dashboard | PASS |
| A9 | Logged out user opens protected page | Redirected to Login | PASS |

---

# B. Project List & Filters

| ID | Steps | Expected Result | Status |
|----|-------|-----------------|--------|
| B1 | Open Project List | All projects displayed | PASS |
| B2 | Filter by Pending Approval | Only pending projects displayed | PASS |
| B3 | Filter by Approved | Only approved projects displayed | PASS |
| B4 | Filter by Client | Matching client projects displayed | PASS |
| B5 | Filter by Creator | Matching creator projects displayed | PASS |
| B6 | Clear filters | Complete project list restored | PASS |
| B7 | Empty project list | Appropriate empty state displayed | PASS |
| B8 | Verify available actions | Correct actions shown based on project status | PASS |

---

# C. Project Creation Wizard

| ID | Steps | Expected Result | Status |
|----|-------|-----------------|--------|
| C1 | Start New Project | Wizard opens successfully | PASS |
| C2 | Select Client | Client details auto-populated | PASS |
| C3 | Continue without selecting client | Validation message displayed | PASS |
| C4 | Proceed to next step | Draft project created | PASS |
| C5 | Upload contract | Contract uploaded successfully | PASS |
| C6 | Download contract | PDF downloaded successfully | PASS |
| C7 | Delete contract | Contract removed successfully | PASS |
| C8 | Upload contract with invalid dates | Validation error displayed | PASS |
| C9 | Enter project details | Data saved successfully | PASS |
| C10 | Add job category | Category added successfully | PASS |
| C11 | Add additional category | New row created | PASS |
| C12 | Remove category | Category removed | PASS |
| C13 | Select Approver | Reviewer selected | PASS |
| C14 | Submit without approver | Validation message displayed | PASS |
| C15 | Submit complete project | Status changed to Pending Approval | PASS |

---

# D. Backend Validation Rules

| ID | Steps | Expected Result | Status |
|----|-------|-----------------|--------|
| D1 | Submit without contract | Validation error | PASS |
| D2 | Submit without job category | Validation error | PASS |
| D3 | Upload contract after submission | Operation blocked | PASS |
| D4 | Invalid project dates | Validation error | PASS |

---

# E. Approval Workflow

| ID | Steps | Expected Result | Status |
|----|-------|-----------------|--------|
| E1 | Open Approver Dashboard | Pending projects displayed | PASS |
| E2 | Review project | Read-only details displayed | PASS |
| E3 | View project details | Complete information displayed | PASS |
| E4 | Reject without reason | Validation error | PASS |
| E5 | Reject with short reason | Validation error | PASS |
| E6 | Reject with valid reason | Project rejected successfully | PASS |
| E7 | CRM views rejected project | Rejection reason displayed | PASS |

---

# F. Edit & Resubmit Workflow

| ID | Steps | Expected Result | Status |
|----|-------|-----------------|--------|
| F1 | Edit rejected project | Wizard opens with existing data | PASS |
| F2 | Modify project details | Changes saved | PASS |
| F3 | Resubmit project | Status updated to Pending Approval | PASS |
| F4 | Approver refreshes dashboard | Project appears again for review | PASS |

---

# G. Project Approval

| ID | Steps | Expected Result | Status |
|----|-------|-----------------|--------|
| G1 | Approve project | Project approved successfully | PASS |
| G2 | Open approved project | Approval actions no longer available | PASS |

---

# H. Audit Trail

| ID | Steps | Expected Result | Status |
|----|-------|-----------------|--------|
| H1 | View Audit Trail | Timeline displayed | PASS |
| H2 | Verify activity history | All actions recorded correctly | PASS |
| H3 | Verify rejection reason | Reason displayed in audit entry | PASS |

---

# I. Versioning

| ID | Steps | Expected Result | Status |
|----|-------|-----------------|--------|
| I1 | Edit approved project | New version created | PASS |
| I2 | Verify active version | Previous approved version remains active | PASS |
| I3 | Open Versions tab | Version history displayed | PASS |
| I4 | Verify draft version | New version marked as Draft | PASS |

---

# J. Contract Management

| ID | Steps | Expected Result | Status |
|----|-------|-----------------|--------|
| J1 | Upload PDF contract | File stored successfully | PASS |
| J2 | Download contract | Presigned URL downloads PDF | PASS |
| J3 | Delete draft contract | Contract removed successfully | PASS |

---

# K. Non-Functional Testing

| ID | Check | Expected Result | Status |
|----|-------|-----------------|--------|
| K1 | Browser Console | No JavaScript errors | PASS |
| K2 | Swagger Documentation | Accessible | PASS |
| K3 | Cold Start | Backend responds successfully | PASS |

---

# Test Execution Guide

## Frontend Testing

Execute all UI test cases using:

**https://fastidious-longma-1256fd.netlify.app**

## Backend Testing

Execute all API test cases using Swagger:

**https://jtou9vlc0g.execute-api.ap-south-2.amazonaws.com/docs**

Authenticate using one of the test users to obtain a JWT token before invoking protected endpoints.

---

# Test Summary

| Module | Status |
|----------|--------|
| Authentication |  Passed |
| Role-Based Access Control |  Passed |
| Project Creation |  Passed |
| Project Management |  Passed |
| Contract Upload & Download |  Passed |
| Validation Rules |  Passed |
| Approval Workflow |  Passed |
| Rejection & Resubmission |  Passed |
| Versioning |  Passed |
| Audit Trail |  Passed |
| Frontend Integration |  Passed |
| Backend Integration |  Passed |
| AWS Deployment |  Passed |

---

# Overall Result

The CRM Project Approval Workflow application was successfully deployed and validated on the target environment.

The following major features were verified:

- JWT Authentication
- Role-Based Access Control
- Client Management
- Project Creation
- Contract Upload and Download
- Job Category Mapping
- Approval Workflow
- Project Rejection and Resubmission
- Project Versioning
- Audit Trail
- Amazon RDS Integration
- Amazon S3 Integration
- Frontend and Backend Integration
- AWS Serverless Deployment

The implemented solution satisfies the functional requirements of the technical assessment and is ready for demonstration.