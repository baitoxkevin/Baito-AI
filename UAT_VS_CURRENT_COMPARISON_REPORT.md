# UAT Project 10 vs Current Project 10 Comparison Report

## Directory Structure

### UAT Project 10 Structure
```
/Users/baito.kevin/Downloads/UAT Project 10/
├── .git/
├── uat/
│   ├── .claude/
│   ├── __MACOSX/
│   ├── logs/
│   └── project 10/  (main codebase)
```

### Current Project 10 Structure
```
/Users/baito.kevin/Downloads/project 10/ (main codebase at root level)
```

## Key Differences

### 1. Components Only in UAT Project

The UAT project contains these additional components not present in the current project:

- `BrandLogoSelector.tsx` - Brand logo selection functionality
- `CalendarLocationEditor.tsx` - Calendar location editing features
- `CandidateProjectApplications.tsx` - Candidate application management
- `EditProjectDialog.tsx` - Project editing dialog
- `EditProjectDialogStepped.tsx` - Stepped version of project edit dialog
- `GlobalErrorBoundary.tsx` - Global error handling component
- `JobDiscoveryCard.tsx` - Job discovery UI card
- `JobPostGeneratorDialog.tsx` - Job post generation dialog
- `NewProjectDialog.original.tsx` - Original new project dialog
- `NewProjectDialog.stepped-original.tsx` - Original stepped version
- `NewProjectDialog.stepped.tsx` - Stepped new project dialog
- `NotificationSettings.tsx` - Notification settings component
- `ProjectApplicationsManager.tsx` - Project applications management
- `ProjectLocationManager.tsx` - Project location management
- `QuickAuthCheck.tsx` - Quick authentication check component
- `listview-animations.css` - ListView animation styles
- `magicui/` - Magic UI component library directory

### 2. Files Only in Current Project

The current project has these additional files/directories:

- `.bmad-core/` - BMAD core configuration
- `.husky/` - Git hooks configuration
- `.mcp.json` - MCP configuration
- `8/` - Additional directory
- `AI_ASSISTANT_IMPLEMENTATION.md` - AI assistant documentation
- `CREATE_SUPER_ADMIN_GUIDE.md` - Super admin creation guide
- `DEPLOYMENT_CHECKLIST.md` - Deployment checklist
- `FUTURE_ENHANCEMENTS.md` - Future enhancement plans
- `mcp-servers/` - MCP servers directory
- Additional git branches: `integration`, `uat`

### 3. Package.json Script Differences

UAT Project has additional scripts:
```json
"build:prod": "npm run security:remove-console && tsc && vite build",
"lint:fix": "eslint . --fix",
"type-check": "tsc --noEmit",
"security:remove-console": "node scripts/remove-console-logs.js",
"security:restore-console": "bash scripts/restore-console-logs.sh",
"security:audit": "npm audit --production",
"security:check": "npm run lint && npm run type-check && npm run security:audit",
"prebuild": "npm run security:check",
"clean": "rm -rf dist node_modules/.vite",
"analyze": "npm run build && npx vite-bundle-analyzer dist"
```

Current Project uses simplified scripts:
```json
"build": "tsc -b && vite build"  // UAT uses "tsc && vite build"
```

### 4. Configuration Files

UAT Project unique configs:
- `.deployignore` - Deployment ignore configuration
- `.env.production.example` - Production environment example
- `.eslintrc.temp.json` - Temporary ESLint configuration
- `.bolt/config.json` - Bolt configuration

### 5. Modified Components

These components exist in both but have been modified:
- `App.tsx`
- `AIChat.tsx`
- `AuthCheck.tsx`
- `CalendarView.tsx`
- `CandidateActionButton.tsx`
- `CandidateDetailsDialog.tsx`
- `CandidateProjectHistory.tsx`
- `CandidateTextImportTool.tsx`
- `CompleteProjectDialog.tsx`
- `DataExtractionTool/`
- `DocumentTextPreview.tsx`
- `EditCandidateDialog.tsx`
- `ExpenseClaimDetailsDialog.tsx`
- `ExpenseClaimForm.tsx`
- `ExpenseClaimFormWithDragDrop.tsx`
- `ExpenseClaimsList.tsx`
- `ExpenseClaimsView.tsx`
- `GenerateCandidateUpdateLink.tsx`
- `ListView.tsx`
- `MainAppLayout.tsx`
- And many others...

## Summary

The UAT Project appears to be a more feature-complete version with:

1. **Additional UI Components**: More dialogs and management interfaces
2. **Enhanced Security**: Security-focused build scripts and console log removal
3. **Better Error Handling**: Global error boundary component
4. **More Features**: Job discovery, brand logos, notification settings
5. **Stepped Workflows**: Multiple stepped dialog implementations

The current project appears to be a simplified or development version with:

1. **Cleaner Structure**: Code at root level instead of nested
2. **Development Tools**: MCP servers and configuration
3. **Documentation**: More extensive documentation files
4. **Simplified Scripts**: Fewer but more focused npm scripts
5. **Active Development**: Additional git branches for integration and UAT

## Recommendation

Consider merging the following from UAT to current project:
1. Missing UI components (especially dialogs and managers)
2. Security-related build scripts
3. Global error boundary for better error handling
4. Stepped dialog implementations for better UX
5. Magic UI component library if needed