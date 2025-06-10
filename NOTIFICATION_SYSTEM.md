# Email Notification System with CC Functionality

## Overview
The notification system provides email notifications for project updates with automatic CC functionality. When projects are created or updated, notifications are sent to the client with the person in charge (manager) automatically CC'd.

## Features

### 1. Automatic CC for Person in Charge
- **Client (To)**: The primary recipient of all project notifications
- **Manager (CC)**: The person in charge is automatically CC'd on all project emails
- **Database Storage**: All notifications are stored in the database for future email processing

### 2. Notification Types
- **Project Creation**: Sent when a new project is created
- **Project Updates**: Sent when project details are modified
- **Status Changes**: Sent when project status is updated
- **Assignment Changes**: Sent when client or manager is changed

### 3. Email Content
Notifications include:
- Clear subject lines indicating the type of update
- Details of what changed (for updates)
- Who made the change
- Timestamp of the change

## Database Schema

### email_notifications table
```sql
- id: UUID (Primary Key)
- project_id: UUID (Foreign Key to projects)
- to_emails: TEXT[] (Array of recipient emails)
- cc_emails: TEXT[] (Array of CC emails)
- subject: TEXT
- body: TEXT
- type: TEXT (project_update, project_creation, status_change, assignment)
- status: TEXT (pending, sent, failed)
- sent_at: TIMESTAMPTZ
- error_message: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### user_preferences table
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to users)
- email_notifications: BOOLEAN (Enable/disable emails)
- cc_on_all_projects: BOOLEAN (Always CC on projects where user is manager)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## Implementation

### 1. Project Creation
When a project is created:
1. System identifies the client and manager from the project
2. Creates a notification with client as recipient and manager as CC
3. Stores notification in database with 'pending' status

### 2. Project Updates
When a project is updated:
1. System tracks which fields changed
2. Formats an email with change details
3. Sends to client with manager CC'd
4. Records in database

### 3. Notification Processing
The notifications are stored in the database and can be processed by:
- A scheduled job (cron/scheduled function)
- An edge function triggered by database changes
- Integration with email service (SendGrid, Mailgun, etc.)

## User Settings

Users can configure their notification preferences:
- **Email Notifications**: Toggle to enable/disable all email notifications
- **CC on All Projects**: For managers, always receive CC on their projects

Access settings at: Settings → Notifications

## Usage in Code

### Send Project Creation Notification
```typescript
await notificationService.notifyProjectCreation(
  projectId,
  projectTitle,
  createdByName
);
```

### Send Project Update Notification
```typescript
const { subject, body } = notificationService.formatProjectUpdateEmail(
  projectTitle,
  changedFields,
  updatedByName
);

await notificationService.notifyProjectStakeholders(
  projectId,
  subject,
  body,
  'project_update'
);
```

## Future Enhancements

1. **Multiple CC Recipients**: Support for additional CC recipients per project
2. **Email Templates**: Customizable email templates for different notification types
3. **Real-time Delivery**: Integration with email service for immediate delivery
4. **Notification History**: View sent notifications in the UI
5. **Webhook Integration**: Support for external notification systems
6. **SMS Notifications**: Optional SMS alerts for critical updates

## Security Considerations

- Only project stakeholders can view notifications for their projects
- Admins have access to all notifications
- Email addresses are not exposed in the UI
- Notifications are stored encrypted in the database