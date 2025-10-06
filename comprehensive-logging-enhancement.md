# Comprehensive Logging Enhancement - Implementation Guide

## ✅ COMPLETED:
1. Authentication logging (login/logout) - DONE

## 📋 TODO: Add to these files

### 2. Project CRUD Logging

**File: `src/components/NewProjectDialog.tsx` or project creation logic**
Add after successful project creation:
```typescript
import { logActivity } from '@/lib/activity-logger'

logActivity({
  action: 'create_project',
  activity_type: 'data_change',
  project_id: newProject.id,
  details: {
    project_title: newProject.title,
    project_status: newProject.status,
    crew_count: newProject.crew_count,
    start_date: newProject.start_date
  }
})
```

**File: `src/components/EditProjectDialogStepped.tsx`**
Add after successful project update:
```typescript
logActivity({
  action: 'update_project',
  activity_type: 'data_change',
  project_id: project.id,
  details: {
    updated_fields: Object.keys(changes),
    ...changes
  }
})
```

**File: Project deletion logic**
```typescript
logActivity({
  action: 'delete_project',
  activity_type: 'data_change',
  project_id: projectId,
  details: {
    project_title: projectTitle,
    reason: 'user_initiated'
  }
})
```

### 3. Candidate CRUD Logging

**File: `src/components/NewCandidateDialog.tsx`**
```typescript
logActivity({
  action: 'create_candidate',
  activity_type: 'data_change',
  details: {
    candidate_name: candidate.name,
    candidate_email: candidate.email,
    phone: candidate.phone
  }
})
```

**File: `src/components/EditCandidateDialog.tsx`**
```typescript
logActivity({
  action: 'update_candidate',
  activity_type: 'data_change',
  details: {
    candidate_id: candidateId,
    candidate_name: candidate.name,
    updated_fields: Object.keys(changes)
  }
})
```

###  4. User/Company CRUD Logging

**File: `src/components/NewUserDialog.tsx`**
```typescript
logActivity({
  action: 'create_user',
  activity_type: 'data_change',
  details: {
    user_email: user.email,
    user_role: user.role,
    full_name: user.full_name
  }
})
```

**File: `src/components/NewCompanyDialog.tsx`**
```typescript
logActivity({
  action: 'create_company',
  activity_type: 'data_change',
  details: {
    company_name: company.company_name,
    company_email: company.company_email
  }
})
```

## 📊 Files Created/Updated:
- ✅ src/lib/auth.ts (login/logout logging added)
- ⏳ Next: Create Activity Dashboard Page
- ⏳ Next: Create Export Feature

