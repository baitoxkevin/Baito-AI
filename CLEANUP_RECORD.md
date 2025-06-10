# Project Cleanup Record

Date: January 10, 2025

## Files Removed

### SQL Files (10 files)
- add-brand-logo-migration.sql
- create-password-reset-tokens.sql
- apply-password-reset-tokens.sql
- apply-password-reset-tokens-simple.sql
- apply-cc-stakeholders-migration.sql
- add-missing-user-columns.sql
- fix-winnie-user.sql
- create-super-admin.sql
- create_activity_logs_table.sql
- create_expense_claims_comprehensive.sql

### Import Files (5 files)
- import-projects.js
- import-projects-direct.sql
- import-projects-supabase.sql
- import-all-projects.sql
- projects-import.csv

### Deployment ZIP Files (6 files)
- netlify-deploy-20250605-160456.zip
- netlify-deploy-final-20250605-161818.zip
- netlify-deploy-fixed-20250605-202041.zip
- netlify-deploy-with-auth-20250605-161145.zip
- project-ui-enhancements.zip
- project_dmhfwg.zip

### Redundant Deployment Scripts (10 files)
- create-deploy-zip.sh
- create-deployment-zip.js
- create-deployment-zip.sh
- create-deployment.py
- create-netlify-package.js
- create-netlify-zip.js
- create-netlify-zip.py
- create-netlify-zip.sh
- prepare-netlify-deploy.js
- CREATE_ZIP_MANUALLY.md

### Migration Runner Scripts (2 files)
- run-address-migration.sh
- run-budget-migration.sh

### Other Files (3 files)
- ai-assistant-example.ts (already removed)
- n8n-whatsapp-workflow.json
- check-storage-rls.sql

Total: 36+ files removed

## Files Kept/Organized

### Moved to scripts/ folder:
- fix-any-types.cjs
- fix-lint-issues.cjs
- generate-types.js
- create-super-admin.js

### Kept in root (useful):
- build-and-zip.sh (main build script)
- run-migrations.sh (main migration runner)
- run-migration-interactive.sh (interactive version)