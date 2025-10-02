# Baito-AI API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL and Endpoints](#base-url-and-endpoints)
4. [Data Models](#data-models)
5. [User Management](#user-management)
6. [Project Management](#project-management)
7. [Candidate Management](#candidate-management)
8. [Expense Claims](#expense-claims)
9. [Calendar and Scheduling](#calendar-and-scheduling)
10. [Document Management](#document-management)
11. [Error Handling](#error-handling)
12. [Rate Limiting](#rate-limiting)
13. [Webhooks](#webhooks)
14. [Code Examples](#code-examples)

---

## Overview

The Baito-AI API is a RESTful API built on Supabase that provides programmatic access to all platform features. The API uses JSON for data exchange and supports real-time subscriptions for live updates.

### Key Features
- **RESTful Design**: Standard HTTP methods and status codes
- **Real-time Updates**: WebSocket connections for live data
- **Row Level Security**: Database-level security policies
- **Automatic API Generation**: Generated from PostgreSQL schema
- **Type Safety**: Full TypeScript support

### API Characteristics
- **Protocol**: HTTPS only
- **Format**: JSON
- **Authentication**: JWT tokens
- **Rate Limiting**: Per-user and per-endpoint limits
- **Versioning**: Schema-based versioning

---

## Authentication

### JWT Authentication
All API requests require a valid JWT token in the Authorization header.

```http
Authorization: Bearer <jwt_token>
```

### Getting an Access Token

#### Sign In
```http
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "user_password"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "v1_refresh_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "manager"
  }
}
```

#### Refresh Token
```http
POST /auth/v1/token?grant_type=refresh_token
Content-Type: application/json

{
  "refresh_token": "v1_refresh_token_here"
}
```

### User Roles and Permissions
- **super_admin**: Full system access
- **admin**: Company-level administrative access
- **manager**: Project and team management
- **client**: Limited project visibility
- **staff**: Basic user operations

---

## Base URL and Endpoints

### Base URL
```
https://your-project.supabase.co
```

### Core Endpoints
- **Authentication**: `/auth/v1/*`
- **Database API**: `/rest/v1/*`
- **Realtime**: `/realtime/v1/*`
- **Storage**: `/storage/v1/*`
- **Functions**: `/functions/v1/*`

### Database Tables
- **Users**: `/rest/v1/users`
- **Companies**: `/rest/v1/companies`
- **Projects**: `/rest/v1/projects`
- **Candidates**: `/rest/v1/candidates`
- **Expense Claims**: `/rest/v1/expense_claims`
- **Documents**: `/rest/v1/project_documents`
- **Tasks**: `/rest/v1/tasks`

---

## Data Models

### User Model
```typescript
interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'client' | 'staff';
  is_super_admin: boolean;
  company_name?: string;
  contact_phone?: string;
  avatar_url?: string;
  avatar_seed?: string;
  username?: string;
  created_at: string;
  updated_at: string;
}
```

### Project Model
```typescript
interface Project {
  id: string;
  title: string;
  client_id?: string;
  manager_id?: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string | null;
  crew_count: number;
  filled_positions: number;
  working_hours_start: string;
  working_hours_end: string;
  event_type: string;
  venue_address: string;
  venue_details?: string;
  color: string;
  budget?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}
```

### Candidate Model
```typescript
interface Candidate {
  id: string;
  full_name: string;
  ic_number?: string;
  phone_number: string;
  email?: string;
  gender?: string;
  nationality?: string;
  bank_name?: string;
  bank_account_number?: string;
  has_vehicle?: boolean;
  is_banned?: boolean;
  status?: string;
  created_at: string;
  updated_at: string;
}
```

### Expense Claim Model
```typescript
interface ExpenseClaim {
  id: string;
  title: string;
  description?: string;
  total_amount: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  user_id: string;
  project_id?: string;
  approver_id?: string;
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}
```

---

## User Management

### Get Current User
```http
GET /auth/v1/user
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "manager",
  "user_metadata": {},
  "app_metadata": {}
}
```

### Get User Profile
```http
GET /rest/v1/users?id=eq.{user_id}
Authorization: Bearer <token>
```

### Update User Profile
```http
PATCH /rest/v1/users?id=eq.{user_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "Updated Name",
  "contact_phone": "+60123456789"
}
```

### List Users (Admin only)
```http
GET /rest/v1/users?select=*
Authorization: Bearer <token>
```

**Query Parameters:**
- `role=eq.manager`: Filter by role
- `limit=10`: Limit results
- `offset=0`: Pagination offset
- `order=created_at.desc`: Sort order

---

## Project Management

### Create Project
```http
POST /rest/v1/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Event Project",
  "client_id": "uuid",
  "start_date": "2024-01-15",
  "end_date": "2024-01-17",
  "crew_count": 10,
  "working_hours_start": "09:00",
  "working_hours_end": "17:00",
  "venue_address": "Event Venue Address",
  "event_type": "Corporate Event",
  "status": "planning",
  "priority": "high",
  "color": "#3B82F6"
}
```

### Get Projects
```http
GET /rest/v1/projects?select=*,client:client_id(full_name)
Authorization: Bearer <token>
```

**Advanced Query:**
```http
GET /rest/v1/projects?status=eq.active&start_date=gte.2024-01-01&select=*
```

### Update Project
```http
PATCH /rest/v1/projects?id=eq.{project_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "active",
  "filled_positions": 8
}
```

### Delete Project
```http
DELETE /rest/v1/projects?id=eq.{project_id}
Authorization: Bearer <token>
```

### Project Staff Management
```http
GET /rest/v1/project_staff?project_id=eq.{project_id}&select=*,candidate:candidate_id(*)
Authorization: Bearer <token>
```

### Add Staff to Project
```http
POST /rest/v1/project_staff
Authorization: Bearer <token>
Content-Type: application/json

{
  "project_id": "uuid",
  "candidate_id": "uuid",
  "status": "confirmed",
  "working_dates": ["2024-01-15", "2024-01-16"]
}
```

---

## Candidate Management

### Create Candidate
```http
POST /rest/v1/candidates
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "John Doe",
  "ic_number": "123456789012",
  "phone_number": "+60123456789",
  "email": "john@example.com",
  "gender": "male",
  "nationality": "Malaysian",
  "has_vehicle": true,
  "bank_name": "Public Bank",
  "bank_account_number": "1234567890"
}
```

### Search Candidates
```http
GET /rest/v1/candidates?full_name=ilike.*john*&has_vehicle=eq.true
Authorization: Bearer <token>
```

**Advanced Search:**
```http
GET /rest/v1/candidates?or=(full_name.ilike.*john*,email.ilike.*john*)&is_banned=eq.false
```

### Update Candidate
```http
PATCH /rest/v1/candidates?id=eq.{candidate_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "active",
  "has_vehicle": false
}
```

### Get Candidate History
```http
GET /rest/v1/candidate_project_history?candidate_id=eq.{candidate_id}&select=*,project:project_id(title,start_date)
Authorization: Bearer <token>
```

### Ban/Unban Candidate
```http
PATCH /rest/v1/candidates?id=eq.{candidate_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_banned": true,
  "ban_reason": "No show multiple times"
}
```

---

## Expense Claims

### Create Expense Claim
```http
POST /rest/v1/expense_claims
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Project Expenses",
  "description": "Transportation and meals",
  "project_id": "uuid",
  "status": "draft"
}
```

### Get Expense Claims
```http
GET /rest/v1/expense_claims?select=*,user:user_id(full_name),project:project_id(title)
Authorization: Bearer <token>
```

**Filter by Status:**
```http
GET /rest/v1/expense_claims?status=eq.pending&user_id=eq.{user_id}
```

### Submit Expense Claim
```http
POST /rest/v1/rpc/submit_expense_claim
Authorization: Bearer <token>
Content-Type: application/json

{
  "claim_id": "uuid",
  "approver_id": "uuid"
}
```

### Approve Expense Claim
```http
POST /rest/v1/rpc/approve_expense_claim
Authorization: Bearer <token>
Content-Type: application/json

{
  "claim_id": "uuid"
}
```

### Reject Expense Claim
```http
POST /rest/v1/rpc/reject_expense_claim
Authorization: Bearer <token>
Content-Type: application/json

{
  "claim_id": "uuid",
  "reason": "Insufficient documentation"
}
```

### Add Receipt to Claim
```http
POST /rest/v1/expense_claim_receipts
Authorization: Bearer <token>
Content-Type: application/json

{
  "expense_claim_id": "uuid",
  "receipt_id": "uuid",
  "amount": 25.50,
  "notes": "Lunch expense"
}
```

---

## Calendar and Scheduling

### Get Calendar Events
```http
GET /rest/v1/projects?start_date=gte.2024-01-01&start_date=lte.2024-01-31&select=id,title,start_date,end_date,status,color
Authorization: Bearer <token>
```

### Get Staff Schedule
```http
GET /rest/v1/project_staff?working_dates=cs.["2024-01-15"]&select=*,project:project_id(*),candidate:candidate_id(*)
Authorization: Bearer <token>
```

### Check Schedule Conflicts
```http
POST /rest/v1/rpc/check_schedule_conflicts
Authorization: Bearer <token>
Content-Type: application/json

{
  "candidate_id": "uuid",
  "project_dates": ["2024-01-15", "2024-01-16"]
}
```

### Create Recurring Project
```http
POST /rest/v1/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Weekly Meeting",
  "schedule_type": "recurring",
  "recurrence_pattern": "weekly",
  "recurrence_days": [1, 3, 5],
  "start_date": "2024-01-15",
  "end_date": "2024-03-15"
}
```

---

## Document Management

### Upload Document
```http
POST /storage/v1/object/project-documents/{project_id}/{filename}
Authorization: Bearer <token>
Content-Type: image/jpeg

[Binary file data]
```

### Get Documents
```http
GET /rest/v1/project_documents?project_id=eq.{project_id}
Authorization: Bearer <token>
```

### Create Document Record
```http
POST /rest/v1/project_documents
Authorization: Bearer <token>
Content-Type: application/json

{
  "project_id": "uuid",
  "file_name": "contract.pdf",
  "file_path": "project-documents/uuid/contract.pdf",
  "file_type": "application/pdf",
  "file_size": 1024576,
  "uploaded_by": "uuid"
}
```

### Get Document URL
```http
GET /storage/v1/object/sign/project-documents/{path}?expiresIn=3600
Authorization: Bearer <token>
```

### Delete Document
```http
DELETE /rest/v1/project_documents?id=eq.{document_id}
Authorization: Bearer <token>
```

---

## Error Handling

### Standard HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **422**: Unprocessable Entity
- **429**: Too Many Requests
- **500**: Internal Server Error

### Error Response Format
```json
{
  "error": {
    "message": "Invalid input",
    "details": "Field 'email' is required",
    "hint": null,
    "code": "23502"
  }
}
```

### Common Error Codes
- **23502**: Not null violation
- **23505**: Unique violation
- **23503**: Foreign key violation
- **42501**: Insufficient privilege
- **42P01**: Undefined table

### Error Handling Best Practices
1. **Check Status Code**: Always check HTTP status code
2. **Parse Error Message**: Extract meaningful error information
3. **Handle Specific Errors**: Implement specific handling for common errors
4. **Retry Logic**: Implement retry for transient errors
5. **User Feedback**: Provide meaningful feedback to users

---

## Rate Limiting

### Rate Limits
- **Authentication**: 30 requests per minute
- **Database Operations**: 100 requests per minute
- **File Uploads**: 10 requests per minute
- **Real-time Connections**: 5 concurrent connections

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Handling Rate Limits
```javascript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  // Wait and retry after the specified time
  setTimeout(() => retryRequest(), retryAfter * 1000);
}
```

---

## Webhooks

### Webhook Events
- **project.created**: New project created
- **project.updated**: Project updated
- **expense_claim.submitted**: Expense claim submitted
- **expense_claim.approved**: Expense claim approved
- **candidate.created**: New candidate registered

### Webhook Payload Example
```json
{
  "event": "project.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "uuid",
    "title": "New Event Project",
    "status": "planning",
    "created_by": "uuid"
  }
}
```

### Setting Up Webhooks
```http
POST /rest/v1/webhook_subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/baito",
  "events": ["project.created", "expense_claim.submitted"],
  "secret": "webhook_secret"
}
```

---

## Code Examples

### JavaScript/TypeScript Client

#### Initialize Client
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);
```

#### Authentication
```typescript
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

#### Database Operations
```typescript
// Create project
const { data, error } = await supabase
  .from('projects')
  .insert({
    title: 'New Project',
    client_id: 'uuid',
    start_date: '2024-01-15'
  });

// Get projects
const { data, error } = await supabase
  .from('projects')
  .select('*, client:client_id(full_name)')
  .eq('status', 'active');

// Update project
const { data, error } = await supabase
  .from('projects')
  .update({ status: 'completed' })
  .eq('id', projectId);
```

#### Real-time Subscriptions
```typescript
// Subscribe to project changes
const subscription = supabase
  .channel('projects')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'projects' },
    (payload) => {
      console.log('Project changed:', payload);
    }
  )
  .subscribe();

// Unsubscribe
subscription.unsubscribe();
```

### Python Client
```python
from supabase import create_client, Client

url = "https://your-project.supabase.co"
key = "your-anon-key"
supabase: Client = create_client(url, key)

# Sign in
auth_response = supabase.auth.sign_in_with_password({
    "email": "user@example.com",
    "password": "password"
})

# Get projects
response = supabase.table('projects').select('*').execute()
projects = response.data
```

### cURL Examples
```bash
# Get projects
curl -X GET 'https://your-project.supabase.co/rest/v1/projects' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $ANON_KEY"

# Create project
curl -X POST 'https://your-project.supabase.co/rest/v1/projects' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Project",
    "start_date": "2024-01-15"
  }'
```

### Advanced Query Examples
```typescript
// Complex filtering
const { data } = await supabase
  .from('projects')
  .select('*, candidates:project_staff(candidate:candidate_id(*))')
  .eq('status', 'active')
  .gte('start_date', '2024-01-01')
  .order('created_at', { ascending: false })
  .limit(10);

// Text search
const { data } = await supabase
  .from('candidates')
  .select('*')
  .textSearch('full_name', 'john')
  .eq('is_banned', false);

// Range queries
const { data } = await supabase
  .from('expense_claims')
  .select('*')
  .gte('total_amount', 100)
  .lte('total_amount', 1000)
  .eq('status', 'approved');
```

---

## SDK and Integration

### Official SDKs
- **JavaScript/TypeScript**: `@supabase/supabase-js`
- **Python**: `supabase-py`
- **Go**: `supabase-go`
- **Swift**: `supabase-swift`
- **Flutter**: `supabase_flutter`

### Third-party Integrations
- **Zapier**: Connect with 3000+ apps
- **Integromat/Make**: Advanced automation workflows
- **Power Automate**: Microsoft ecosystem integration
- **Custom Webhooks**: Build custom integrations

### Development Tools
- **Postman Collection**: Pre-built API collection
- **OpenAPI Spec**: Complete API specification
- **TypeScript Definitions**: Full type definitions
- **CLI Tools**: Command-line interface tools

---

*This API documentation is automatically updated with schema changes. For the latest information, refer to your Supabase project dashboard.*