# YWC Financial Forms API - Endpoints Summary

## Overview
This document provides a comprehensive overview of all API endpoints in the YWC Financial Forms API after the user-centric architecture migration.

## Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.yourwealthcoach.com/api`

## Authentication
All endpoints (except login and register) require JWT Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

## User Roles & Access Control

| Role | Description | Access Level |
|------|-------------|--------------|
| **ADMIN** | System administrator | Full access to all endpoints and data |
| **COACH** | Financial coach | Can manage assigned clients and their data |
| **CLIENT** | End user/client | Can view/edit own financial information |
| **GUEST** | Limited access | Read-only access to public endpoints |

## 📊 Endpoint Categories

### 1. Authentication (6 endpoints)
- User login/logout
- Registration with role assignment
- Profile management
- Coach-client relationship queries

### 2. Personal Details (6 endpoints)
- CRUD operations for personal information
- Coach assignment and filtering
- Personal ID-based data access

### 3. Employment (5 endpoints)
- Primary and secondary employment tracking
- Employment history management
- Personal ID-based employment data

### 4. Income (6 endpoints)
- Income tracking with German tax system integration
- Personal ID-based income data
- CRUD operations for income records

### 5. Expenses (6 endpoints)
- Comprehensive expense tracking
- Personal ID-based expense data
- Expense categorization and management

### 6. Assets (6 endpoints)
- Portfolio management (real estate, securities, deposits)
- Personal ID-based asset tracking
- Asset valuation and management

### 7. Liabilities (6 endpoints)
- Debt management (Personal, Home, Car, Business, Education loans)
- Personal ID-based liability tracking
- Loan tracking with interest rates

### 8. Person Aggregation (4 endpoints)
- Complete profile compilation
- Financial summaries across all categories
- Comprehensive person data views

## Complete Endpoints List

### 🔐 Authentication Endpoints

| Method | Endpoint | Description | Access | Request Body |
|--------|----------|-------------|--------|--------------|
| POST | `/auth/login` | User login | Public | `{email, password}` |
| POST | `/auth/register` | Register new user | Authenticated | `{email, password, first_name, last_name, role?, coach_id?}` |
| POST | `/auth/refresh` | Refresh JWT token | Public | `{token}` |
| GET | `/auth/profile` | Get current user profile | Authenticated | - |
| GET | `/auth/me/clients` | Get coach's clients | Coach/Admin | - |
| POST | `/auth/logout` | User logout | Authenticated | - |

### 👤 Personal Details Endpoints

| Method | Endpoint | Description | Access | Parameters |
|--------|----------|-------------|--------|------------|
| POST | `/personal-details` | Create personal details | Authenticated | Body: Personal details object |
| GET | `/personal-details` | Get all personal details | Admin/Coach | Query: `applicant_type`, `marital_status` |
| GET | `/personal-details/coach/{coachId}` | Get personal details by coach | Coach/Admin | Path: `coachId` |
| GET | `/personal-details/{personalId}` | Get personal details by personal ID | Authorized | Path: `personalId` |
| PUT | `/personal-details/{personalId}` | Update personal details | Authorized | Path: `personalId`, Body: Updates |
| DELETE | `/personal-details/{personalId}` | Delete personal details | Authorized | Path: `personalId` |

### 💼 Employment Details Endpoints

| Method | Endpoint | Description | Access | Parameters |
|--------|----------|-------------|--------|------------|
| POST | `/employment` | Create employment record | Authenticated | Body: Employment details |
| GET | `/employment/{id}` | Get employment by ID | Authorized | Path: `id` (employment ID) |
| PUT | `/employment/{id}` | Update employment record | Authorized | Path: `id`, Body: Updates |
| DELETE | `/employment/{id}` | Delete employment record | Authorized | Path: `id` |
| GET | `/employment/personal/{personalId}` | Get employment by personal ID | Authorized | Path: `personalId` |

### 💰 Income Details Endpoints

| Method | Endpoint | Description | Access | Parameters |
|--------|----------|-------------|--------|------------|
| POST | `/income` | Create income record | Authenticated | Body: Income details |
| GET | `/income` | Get all income records | Admin/Coach | - |
| GET | `/income/{id}` | Get income by ID | Authorized | Path: `id` (income ID) |
| PUT | `/income/{id}` | Update income record | Authorized | Path: `id`, Body: Updates |
| DELETE | `/income/{id}` | Delete income record | Authorized | Path: `id` |
| GET | `/income/personal/{personalId}` | Get income by personal ID | Authorized | Path: `personalId` |

### 💸 Expenses Details Endpoints

| Method | Endpoint | Description | Access | Parameters |
|--------|----------|-------------|--------|------------|
| POST | `/expenses` | Create expense record | Authenticated | Body: Expense details |
| GET | `/expenses` | Get all expense records | Admin/Coach | - |
| GET | `/expenses/{id}` | Get expense by ID | Authorized | Path: `id` (expense ID) |
| PUT | `/expenses/{id}` | Update expense record | Authorized | Path: `id`, Body: Updates |
| DELETE | `/expenses/{id}` | Delete expense record | Authorized | Path: `id` |
| GET | `/expenses/personal/{personalId}` | Get expenses by personal ID | Authorized | Path: `personalId` |

### 🏦 Assets Endpoints

| Method | Endpoint | Description | Access | Parameters |
|--------|----------|-------------|--------|------------|
| POST | `/assets` | Create asset record | Authenticated | Body: Asset details |
| GET | `/assets` | Get all asset records | Admin/Coach | - |
| GET | `/assets/{id}` | Get asset by ID | Authorized | Path: `id` (asset ID) |
| PUT | `/assets/{id}` | Update asset record | Authorized | Path: `id`, Body: Updates |
| DELETE | `/assets/{id}` | Delete asset record | Authorized | Path: `id` |
| GET | `/assets/personal/{personalId}` | Get assets by personal ID | Authorized | Path: `personalId` |

### 📊 Liabilities Endpoints

| Method | Endpoint | Description | Access | Parameters |
|--------|----------|-------------|--------|------------|
| POST | `/liabilities` | Create liability record | Authenticated | Body: Liability details |
| GET | `/liabilities` | Get all liability records | Admin/Coach | - |
| GET | `/liabilities/{id}` | Get liability by ID | Authorized | Path: `id` (liability ID) |
| PUT | `/liabilities/{id}` | Update liability record | Authorized | Path: `id`, Body: Updates |
| DELETE | `/liabilities/{id}` | Delete liability record | Authorized | Path: `id` |
| GET | `/liabilities/personal/{personalId}` | Get liabilities by personal ID | Authorized | Path: `personalId` |

### 🧑‍💼 Person Aggregation Endpoints

| Method | Endpoint | Description | Access | Parameters |
|--------|----------|-------------|--------|------------|
| GET | `/person/{personalId}/complete` | Get complete person profile | Authorized | Path: `personalId` |
| GET | `/person/{personalId}/summary` | Get person summary | Authorized | Path: `personalId` |
| GET | `/person/{personalId}/financial-summary` | Get financial summary | Authorized | Path: `personalId` |
| GET | `/person/coach/{coachId}` | Get persons by coach ID | Coach/Admin | Path: `coachId` |

## Data Relationships

```
User (Primary Entity)
├── PersonalDetails (1:1)
├── EmploymentDetails (1:N)
├── IncomeDetails (1:N)
├── ExpensesDetails (1:N)
├── Assets (1:N)
├── Liabilities (1:N)
├── FamilyDetails (1:N)
└── Children (1:N)

Coach-Client Relationship:
Coach User ──(1:N)──> Client Users
```

## Query Parameters Reference

### Personal Details
- `applicant_type`: Filter by PrimaryApplicant or SecondaryApplicant
- `marital_status`: Filter by marital status

### Employment
- `employment_type`: Filter by PrimaryEmployment or SecondaryEmployment

### Income
- `min_gross_income`: Minimum gross income filter
- `max_gross_income`: Maximum gross income filter
- `tax_class`: German tax class (1-6)

### Expenses
- `min_rent`: Minimum rent filter
- `max_rent`: Maximum rent filter

### Liabilities
- `loan_type`: Filter by loan type (PersonalLoan, HomeLoan, CarLoan, BusinessLoan, EducationLoan, OtherLoan)

## Response Format

All endpoints return a standardized response format:

```json
{
  "success": boolean,
  "message": "Human-readable message",
  "data": object | array | null,
  "error": "Error message (if success is false)"
}
```

## HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors, malformed requests |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server-side errors |

## User-Centric Architecture Benefits

1. **Simplified Data Access**: All financial data is directly linked to users via `personal_id`
2. **Proper Coach-Client Relationships**: Clients are assigned to coaches through the `coach_id` field
3. **Consistent Authorization**: Role-based access control across all endpoints
4. **Data Integrity**: Cascading deletes ensure data consistency
5. **Scalable Design**: Easy to add new financial data types

## Testing Examples

### Login and Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ywc.com","password":"admin123"}'
```

### Create Personal Details
```bash
curl -X POST http://localhost:3000/api/personal-details \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"applicant_type":"PrimaryApplicant","first_name":"John","last_name":"Doe",...}'
```

### Get Complete Profile
```bash
curl -X GET http://localhost:3000/api/person/my/complete-profile \
  -H "Authorization: Bearer <token>"
``` 