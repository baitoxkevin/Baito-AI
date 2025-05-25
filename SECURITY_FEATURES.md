# Security Features for Candidate Update System

## Overview
The candidate update system implements multiple layers of security to protect against various attack vectors while maintaining usability.

## Security Measures Implemented

### 1. Token Security
- **SHA-256 Hashing**: Tokens are generated using cryptographically secure random values
- **Single Use**: Each token can only be used once
- **Time-Limited**: Tokens expire after 1 hour
- **Secure Storage**: Tokens are stored hashed in the database

### 2. Rate Limiting
Protects against brute force attacks:

| Action | Max Attempts | Time Window | Lockout Period |
|--------|--------------|-------------|----------------|
| Token Generation | 5 | 60 minutes | 2 hours |
| IC Verification | 3 | 15 minutes | 1 hour |
| Token Validation | 10 | 5 minutes | 30 minutes |

### 3. Input Validation
- **SQL Injection Protection**: All inputs are checked for SQL patterns
- **XSS Prevention**: Inputs are validated against XSS patterns
- **IC Number Validation**: Malaysian IC format validation with:
  - Length check (12 digits)
  - Date validation
  - State code validation
  - Format enforcement

### 4. Access Control
- **Two-Factor Verification**: Token + IC number
- **IP Tracking**: All access attempts are logged with IP
- **User Agent Validation**: Blocks suspicious automated tools
- **Session Management**: Each session has unique identifier

### 5. Security Monitoring
- **Real-time Alerts**: Critical events trigger immediate notifications
- **Audit Trail**: Complete logging of all security events
- **Pattern Detection**: Identifies suspicious activity patterns
- **IP Blacklisting**: Automatic blocking of malicious IPs

### 6. Attack Prevention

#### SQL Injection
```typescript
// Patterns detected and blocked:
- UNION, SELECT, INSERT, UPDATE, DELETE
- Comment indicators (--, #, /**/)
- Boolean logic (OR 1=1, AND 1=1)
- Command execution attempts
```

#### XSS Attacks
```typescript
// Patterns detected and blocked:
- <script> tags
- javascript: protocol
- Event handlers (onclick, onload, etc.)
- eval() and expression() calls
```

#### Brute Force
- Progressive delays between attempts
- Account lockout after threshold
- CAPTCHA integration ready

### 7. Security Headers
When deployed, ensure these headers are set:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000
```

## Database Schema

### security_rate_limits
Tracks rate limiting for various actions:
```sql
- identifier: IP/token/candidate_id
- action: Type of action being limited
- created_at: Timestamp of attempt
- locked_until: Lockout expiration
```

### security_audit_logs
Comprehensive security event logging:
```sql
- event_type: Type of security event
- severity: low/medium/high/critical
- details: JSON metadata
- ip_address: Source IP
- user_agent: Browser information
```

### ip_blacklist
Manages blocked IP addresses:
```sql
- ip_address: Blocked IP
- reason: Why it was blocked
- severity: temporary/permanent
- expires_at: When temporary block expires
```

## Security Event Types

### Critical Events
- `malicious_input_detected`: SQL injection or XSS attempt
- `malicious_ic_input`: Attack pattern in IC field
- `sql_injection_attempt`: Direct SQL injection detected
- `xss_attempt`: Cross-site scripting attempt

### High Severity Events
- `ic_verification_lockout`: Too many failed IC attempts
- `rate_limit_exceeded`: Rate limit threshold reached
- `blocked_ip_attempt`: Access from blacklisted IP
- `ic_verification_failed`: Failed IC verification

### Medium Severity Events
- `invalid_token_attempt`: Invalid token used
- `suspicious_headers`: Missing or suspicious headers
- `token_validation_error`: Error during validation

### Low Severity Events
- `candidate_update_access_granted`: Successful access
- `expired_token_access`: Attempt with expired token
- `invalid_ic_format`: Incorrect IC format

## Administrator Features

### Security Monitoring Panel
Access via Settings > Security Monitoring:
- Real-time security event feed
- Statistics dashboard
- IP management
- Pattern analysis

### Manual Actions
- Block/unblock IP addresses
- Review security logs
- Generate security reports
- Adjust rate limits

## Best Practices

### For Users (Staff)
1. Only share links through secure channels
2. Inform candidates about the 1-hour expiration
3. Monitor for unusual activity
4. Report suspicious behavior

### For Candidates
1. Access links only from trusted sources
2. Never share your IC number except on the secure form
3. Complete updates in one session
4. Contact support if blocked

### For Administrators
1. Regularly review security logs
2. Update blacklists as needed
3. Monitor for new attack patterns
4. Keep security rules updated

## Incident Response

### If Attack Detected
1. System automatically blocks the source
2. Logs detailed information
3. Notifies administrators
4. Prevents further access

### Recovery Process
1. Review security logs
2. Identify attack pattern
3. Update security rules
4. Clear false positives
5. Document incident

## Future Enhancements
- [ ] CAPTCHA integration
- [ ] Geo-location blocking
- [ ] Machine learning for pattern detection
- [ ] Two-factor authentication for staff
- [ ] End-to-end encryption for sensitive data

## Testing Security

### Manual Testing
1. Try SQL injection: `' OR '1'='1`
2. Try XSS: `<script>alert('xss')</script>`
3. Exceed rate limits
4. Use invalid IC formats

### Automated Testing
- Security scanner integration
- Penetration testing
- Load testing for DDoS protection

## Compliance
- GDPR compliant with data minimization
- PDPA (Malaysia) compliant
- Audit trail for compliance reporting
- Data retention policies implemented