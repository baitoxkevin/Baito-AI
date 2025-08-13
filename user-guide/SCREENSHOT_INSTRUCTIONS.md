# Screenshot Generation Instructions

## Overview
This document provides instructions for generating screenshots for the BaitoAI System User Guide.

## Screenshot Requirements

### General Guidelines
- **Resolution**: 1920x1080 or 1440x900 minimum
- **Format**: PNG
- **Quality**: High quality, clear and readable
- **Data**: Use sample/demo data, never real user data
- **Consistency**: Use the same browser and theme throughout

### Preparation Checklist
1. Create demo/test account
2. Populate system with sample data
3. Set browser to consistent zoom level (100%)
4. Use either all light or all dark theme
5. Hide personal bookmarks and browser extensions
6. Clear notifications before screenshots

## Required Screenshots by Section

### 1. Authentication (7 screenshots)
Location: `screenshots/auth/`
- [ ] 01-landing-page.png
- [ ] 02-login-page.png
- [ ] 03-login-credentials.png
- [ ] 04-2fa-verification.png
- [ ] 05-forgot-password-link.png
- [ ] 06-password-reset-email.png
- [ ] 07-set-new-password.png

### 2. Dashboard (7 screenshots)
Location: `screenshots/dashboard/`
- [ ] 01-main-overview.png
- [ ] 02-metrics-cards.png
- [ ] 03-recent-activities.png
- [ ] 04-quick-actions.png
- [ ] 05-command-palette.png
- [ ] 06-quick-search.png
- [ ] 07-waves-effect.png

### 3. Projects (9 screenshots)
Location: `screenshots/projects/`
- [ ] 01-projects-list.png
- [ ] 02-filters-search.png
- [ ] 03-new-project-button.png
- [ ] 04-project-form.png
- [ ] 05-staff-assignment.png
- [ ] 06-project-schedule.png
- [ ] 07-project-detail.png
- [ ] 08-edit-project-dialog.png
- [ ] 09-status-update.png

### 4. Candidates (8 screenshots)
Location: `screenshots/candidates/`
- [ ] 01-candidates-list.png
- [ ] 02-search-filters.png
- [ ] 03-add-candidate-button.png
- [ ] 04-candidate-form.png
- [ ] 05-document-upload.png
- [ ] 06-ic-verification.png
- [ ] 07-candidate-profile.png
- [ ] 08-bulk-import.png

### 5. Calendar (6 screenshots)
Location: `screenshots/calendar/`
- [ ] 01-monthly-view.png
- [ ] 02-weekly-view.png
- [ ] 03-daily-view.png
- [ ] 04-create-event-click.png
- [ ] 05-event-form.png
- [ ] 06-assign-participants.png

### 6. Tools (6 screenshots)
Location: `screenshots/tools/`
- [ ] 01-tools-overview.png
- [ ] 02-receipt-scanner.png
- [ ] 03-receipt-upload.png
- [ ] 04-extracted-data.png
- [ ] 05-typhoid-certificates.png
- [ ] 06-user-configuration.png

### 7. Team (6 screenshots)
Location: `screenshots/team/`
- [ ] 01-team-overview.png
- [ ] 02-add-member-button.png
- [ ] 03-member-form.png
- [ ] 04-roles-permissions.png
- [ ] 05-send-invites.png
- [ ] 06-invite-status.png

### 8. Payments (5 screenshots)
Location: `screenshots/payments/`
- [ ] 01-payment-dashboard.png
- [ ] 02-payment-methods.png
- [ ] 03-payment-details.png
- [ ] 04-payment-confirmation.png
- [ ] 05-payment-history.png

### 9. Goals (5 screenshots)
Location: `screenshots/goals/`
- [ ] 01-goals-dashboard.png
- [ ] 02-new-goal-button.png
- [ ] 03-goal-parameters.png
- [ ] 04-milestones.png
- [ ] 05-progress-tracking.png

### 10. Expenses (6 screenshots)
Location: `screenshots/expenses/`
- [ ] 01-expense-claims-page.png
- [ ] 02-new-claim-button.png
- [ ] 03-claim-form.png
- [ ] 04-attach-receipts.png
- [ ] 05-pending-claims.png
- [ ] 06-approval-interface.png

### 11. Settings (7 screenshots)
Location: `screenshots/settings/`
- [ ] 01-settings-overview.png
- [ ] 02-profile-settings.png
- [ ] 03-change-password.png
- [ ] 04-theme-toggle.png
- [ ] 05-notifications.png
- [ ] 06-2fa-settings.png
- [ ] 07-api-keys.png

### 12. Mobile (4 screenshots)
Location: `screenshots/mobile/`
- [ ] 01-mobile-update-form.png
- [ ] 02-candidate-dashboard.png
- [ ] 03-job-discovery.png
- [ ] 04-job-application.png

**Total Screenshots Required: 76**

## Screenshot Tools

### Recommended Tools
1. **Built-in OS Tools**:
   - macOS: Cmd + Shift + 4 (selection) or Cmd + Shift + 3 (full screen)
   - Windows: Windows + Shift + S or Snipping Tool
   - Linux: Screenshot tool or Flameshot

2. **Browser Extensions**:
   - Full Page Screen Capture
   - Awesome Screenshot
   - Nimbus Screenshot

3. **Professional Tools**:
   - Snagit
   - CloudApp
   - Lightshot

## Data Sanitization

### Before Taking Screenshots:
1. Replace real names with generic ones (John Doe, Jane Smith)
2. Use sample email addresses (user@example.com)
3. Replace phone numbers with 555-0100 format
4. Use Lorem Ipsum for long text content
5. Blur or redact any sensitive information
6. Use demo project names and descriptions

## Quality Checklist

### Before Saving Each Screenshot:
- [ ] Is the interface fully loaded?
- [ ] Are there any loading spinners visible?
- [ ] Is the relevant feature clearly visible?
- [ ] Are UI elements properly aligned?
- [ ] Is the contrast sufficient for readability?
- [ ] Have all sensitive data been removed/replaced?
- [ ] Is the file named correctly?
- [ ] Is the screenshot cropped appropriately?

## Batch Processing Tips

1. **Create a test scenario flow**:
   - Login → Dashboard → Projects → Candidates → etc.
   - Take screenshots in sequence as you navigate

2. **Use consistent test data**:
   - Same user account
   - Same sample projects
   - Same theme settings

3. **Browser setup**:
   - Use incognito/private mode
   - Disable browser extensions
   - Set standard window size

## Post-Processing

### Optional Enhancements:
1. Add subtle drop shadows for depth
2. Highlight important UI elements with arrows/boxes
3. Add callout annotations for complex features
4. Ensure consistent canvas size across related screenshots

### Compression:
- Use PNG optimization tools (TinyPNG, ImageOptim)
- Target file size: 100-500KB per screenshot
- Maintain visual quality while reducing file size

## Delivery

### Final Package Structure:
```
user-guide/
├── USER_GUIDE.md
├── SCREENSHOT_INSTRUCTIONS.md
└── screenshots/
    ├── auth/
    ├── dashboard/
    ├── projects/
    ├── candidates/
    ├── calendar/
    ├── tools/
    ├── team/
    ├── payments/
    ├── goals/
    ├── expenses/
    ├── settings/
    └── mobile/
```

### Validation:
1. Verify all 76 screenshots are present
2. Check file names match the guide requirements
3. Ensure consistent quality across all images
4. Test that all images load properly in the markdown guide