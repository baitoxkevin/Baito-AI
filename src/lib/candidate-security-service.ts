import { supabase } from './supabase';

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime?: Date;
}

interface SecurityCheckResult {
  passed: boolean;
  reason?: string;
  details?: any;
}

// Rate limiting configuration
const RATE_LIMITS = {
  token_generation: {
    maxAttempts: 5,
    windowMinutes: 60,
    cooldownMinutes: 120
  },
  ic_verification: {
    maxAttempts: 3,
    windowMinutes: 15,
    lockoutMinutes: 60
  },
  token_validation: {
    maxAttempts: 10,
    windowMinutes: 5,
    cooldownMinutes: 30
  }
};

/**
 * Check rate limiting for various actions
 */
export async function checkRateLimit(
  identifier: string,
  action: 'token_generation' | 'ic_verification' | 'token_validation'
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action];
  if (!config) {
    console.error(`Invalid rate limit action: ${action}`);
    return { allowed: true, remainingAttempts: 0 };
  }
  
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);
  
  try {
    // Get recent attempts
    const { data: attempts, error } = await supabase
      .from('security_rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Check if in cooldown/lockout period
    if (attempts && attempts.length > 0) {
      const lastAttempt = attempts[0];
      if (lastAttempt.locked_until && new Date(lastAttempt.locked_until) > now) {
        return {
          allowed: false,
          remainingAttempts: 0,
          resetTime: new Date(lastAttempt.locked_until)
        };
      }
    }
    
    const attemptCount = attempts?.length || 0;
    
    if (attemptCount >= config.maxAttempts) {
      // Set lockout
      const lockoutUntil = new Date(now.getTime() + (config.cooldownMinutes || config.lockoutMinutes || 60) * 60 * 1000);
      
      await supabase
        .from('security_rate_limits')
        .insert({
          identifier,
          action,
          locked_until: lockoutUntil.toISOString()
        });
      
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: lockoutUntil
      };
    }
    
    // Record this attempt
    await supabase
      .from('security_rate_limits')
      .insert({
        identifier,
        action
      });
    
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - attemptCount - 1
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // Fail open but log the error
    return {
      allowed: true,
      remainingAttempts: 1
    };
  }
}

/**
 * Validate request origin and headers
 */
export function validateRequestSecurity(request: Request): SecurityCheckResult {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const userAgent = request.headers.get('user-agent');
  
  // Check for missing security headers
  if (!userAgent) {
    return {
      passed: false,
      reason: 'Missing required headers'
    };
  }
  
  // Check for suspicious user agents
  const suspiciousAgents = [
    'curl', 'wget', 'python', 'scrapy', 'bot', 'crawler', 'spider',
    'scraper', 'httpclient', 'mechanize', 'phantomjs'
  ];
  
  const lowerUserAgent = userAgent.toLowerCase();
  if (suspiciousAgents.some(agent => lowerUserAgent.includes(agent))) {
    return {
      passed: false,
      reason: 'Suspicious user agent detected',
      details: { userAgent }
    };
  }
  
  // In production, validate origin/referer
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = [
      process.env.VITE_APP_URL,
      'https://yourdomain.com'
    ].filter(Boolean);
    
    if (origin && !allowedOrigins.includes(origin)) {
      return {
        passed: false,
        reason: 'Invalid origin',
        details: { origin }
      };
    }
  }
  
  return { passed: true };
}

/**
 * Sanitize and validate IC number format
 */
export function validateICNumber(icNumber: string): SecurityCheckResult {
  // Remove all non-numeric characters
  const cleaned = icNumber.replace(/\D/g, '');
  
  // Malaysian IC format: YYMMDD-PB-####
  // 12 digits total
  if (cleaned.length !== 12) {
    return {
      passed: false,
      reason: 'Invalid IC number format'
    };
  }
  
  // Validate date portion (first 6 digits)
  const year = parseInt(cleaned.substring(0, 2));
  const month = parseInt(cleaned.substring(2, 4));
  const day = parseInt(cleaned.substring(4, 6));
  
  if (month < 1 || month > 12) {
    return {
      passed: false,
      reason: 'Invalid month in IC number'
    };
  }
  
  if (day < 1 || day > 31) {
    return {
      passed: false,
      reason: 'Invalid day in IC number'
    };
  }
  
  // Validate state code (digits 7-8)
  const stateCode = parseInt(cleaned.substring(6, 8));
  const validStateCodes = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
    35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
    49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 71, 72, 74,
    75, 76, 77, 78, 79, 82, 83, 84, 85, 86, 87, 88, 89, 90,
    91, 92, 93, 98, 99
  ];
  
  if (!validStateCodes.includes(stateCode)) {
    return {
      passed: false,
      reason: 'Invalid state code in IC number'
    };
  }
  
  return {
    passed: true,
    details: { cleaned }
  };
}

/**
 * Check for suspicious patterns in input
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(--|#|\/\*|\*\/)/,
    /(\bor\b\s*\d+\s*=\s*\d+)/i,
    /(\band\b\s*\d+\s*=\s*\d+)/i,
    /(';|";|`)/,
    /(\bhaving\b|\bgroup\s+by\b)/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Check for XSS patterns
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Log security events
 */
export async function logSecurityEvent(
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: any,
  candidateId?: string
) {
  try {
    await supabase
      .from('security_audit_logs')
      .insert({
        event_type: eventType,
        severity,
        details,
        candidate_id: candidateId,
        ip_address: details.ip_address,
        user_agent: details.user_agent,
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

/**
 * Comprehensive security validation for candidate update requests
 */
export async function validateCandidateUpdateSecurity(
  candidateId: string,
  token: string,
  icNumber: string,
  request?: Request
): Promise<SecurityCheckResult> {
  // 1. Check request headers if available
  if (request) {
    const headerCheck = validateRequestSecurity(request);
    if (!headerCheck.passed) {
      await logSecurityEvent('suspicious_headers', 'medium', {
        reason: headerCheck.reason,
        ...headerCheck.details
      }, candidateId);
      return headerCheck;
    }
  }
  
  // 2. Validate token format (basic check)
  if (!token || token.length < 32) {
    await logSecurityEvent('invalid_token_format', 'low', {
      token_length: token?.length || 0
    }, candidateId);
    return {
      passed: false,
      reason: 'Invalid token format'
    };
  }
  
  // 3. Check for SQL injection in inputs
  if (detectSQLInjection(token) || detectSQLInjection(icNumber)) {
    await logSecurityEvent('sql_injection_attempt', 'critical', {
      token_suspicious: detectSQLInjection(token),
      ic_suspicious: detectSQLInjection(icNumber)
    }, candidateId);
    return {
      passed: false,
      reason: 'Invalid input detected'
    };
  }
  
  // 4. Check for XSS in inputs
  if (detectXSS(token) || detectXSS(icNumber)) {
    await logSecurityEvent('xss_attempt', 'high', {
      token_suspicious: detectXSS(token),
      ic_suspicious: detectXSS(icNumber)
    }, candidateId);
    return {
      passed: false,
      reason: 'Invalid input detected'
    };
  }
  
  // 5. Validate IC number format (only if IC is provided)
  if (icNumber && icNumber.trim() !== '') {
    const icValidation = validateICNumber(icNumber);
    if (!icValidation.passed) {
      await logSecurityEvent('invalid_ic_format', 'low', {
        reason: icValidation.reason
      }, candidateId);
      return icValidation;
    }
  }
  
  // 6. Check rate limits
  const tokenRateLimit = await checkRateLimit(`token:${token}`, 'token_validation');
  if (!tokenRateLimit.allowed) {
    await logSecurityEvent('rate_limit_exceeded', 'high', {
      action: 'token_validation',
      reset_time: tokenRateLimit.resetTime
    }, candidateId);
    return {
      passed: false,
      reason: 'Too many attempts. Please try again later.',
      details: { resetTime: tokenRateLimit.resetTime }
    };
  }
  
  const icRateLimit = await checkRateLimit(`ic:${candidateId}`, 'ic_verification');
  if (!icRateLimit.allowed) {
    await logSecurityEvent('rate_limit_exceeded', 'high', {
      action: 'ic_verification',
      reset_time: icRateLimit.resetTime
    }, candidateId);
    return {
      passed: false,
      reason: 'Too many verification attempts. Account temporarily locked.',
      details: { resetTime: icRateLimit.resetTime }
    };
  }
  
  return { passed: true };
}

/**
 * Generate CSRF token for forms
 */
export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate CSRF token
 */
export async function validateCSRFToken(token: string, sessionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('csrf_tokens')
      .select('*')
      .eq('token', token)
      .eq('session_id', sessionId)
      .single();
    
    if (error || !data) return false;
    
    // Check if token is expired (1 hour)
    const created = new Date(data.created_at);
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    if (created < hourAgo) {
      // Delete expired token
      await supabase
        .from('csrf_tokens')
        .delete()
        .eq('token', token);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating CSRF token:', error);
    return false;
  }
}