# XLSX to ExcelJS Migration Guide

## Overview
We've migrated from the vulnerable `xlsx` package to the more secure `exceljs` package to address critical security vulnerabilities including:
- Regular Expression Denial of Service (ReDoS)
- Prototype Pollution vulnerability

## Security Improvements Implemented

### 1. Input Validation
- **File Size Limits**: Maximum 10MB file size to prevent memory exhaustion
- **File Type Validation**: Only .xlsx, .xls, and .csv files are allowed
- **MIME Type Checking**: Validates file MIME types before processing

### 2. Data Sanitization
- **HTML Entity Escaping**: Prevents XSS attacks by escaping special characters
- **Control Character Removal**: Removes potentially dangerous control characters
- **String Length Limits**: Prevents excessive memory usage

### 3. Formula Injection Prevention
- **Formula Evaluation Disabled**: Formulas are not executed, only their results are used
- **Cell Value Sanitization**: All cell values are sanitized before processing

### 4. Resource Limits
- **Maximum Rows**: Limited to 10,000 rows per spreadsheet
- **Maximum Columns**: Limited to 100 columns per spreadsheet
- **Timeout Protection**: 30-second timeout for external API calls

## API Changes

### File Import
The API remains largely the same, but with enhanced security:

```typescript
// Old (vulnerable)
import * as XLSX from 'xlsx';

// New (secure)
// No direct import needed - utils.ts re-exports secure implementation
import { extractDataFromSpreadsheet } from './utils';
```

### Processing Files
```typescript
// Usage remains the same
const data = await extractDataFromSpreadsheet(file);
const processed = processScheduleData(data);
```

## Breaking Changes
None - the migration maintains full backward compatibility through the re-export pattern.

## Testing Checklist
After the migration, verify:
- [ ] Excel file upload and parsing works correctly
- [ ] CSV file upload and parsing works correctly
- [ ] Date parsing handles various formats
- [ ] Location data extraction works as expected
- [ ] Error messages are displayed for invalid files
- [ ] Large files are rejected appropriately
- [ ] Malformed files are handled gracefully

## Performance Considerations
- ExcelJS may use slightly more memory for large files
- Processing is generally faster due to optimized parsing
- Streaming support available for very large files if needed

## Additional Security Recommendations

### 1. Content Security Policy
Add CSP headers to prevent XSS:
```typescript
// In your server configuration
"Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline';"
```

### 2. File Upload Best Practices
- Store uploaded files in a separate domain/subdomain
- Scan files with antivirus before processing
- Implement rate limiting on file uploads
- Log all file upload attempts for audit trails

### 3. Regular Security Updates
- Monitor npm audit weekly
- Set up automated dependency updates with Dependabot
- Review and test updates before deploying to production

## Rollback Plan
If issues are encountered:
1. The original utils.ts content is preserved in git history
2. Revert the package.json changes
3. Run `npm install` to restore xlsx
4. Revert utils.ts to the previous version

## References
- [ExcelJS Documentation](https://github.com/exceljs/exceljs)
- [OWASP File Upload Security](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)