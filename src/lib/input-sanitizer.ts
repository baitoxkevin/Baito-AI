/**
 * Input Sanitization Service
 * Implements OWASP input validation and sanitization best practices
 * Prevents XSS, SQL Injection, and other injection attacks
 */

import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// Common patterns for validation
const PATTERNS = {
  // Alphanumeric with spaces and basic punctuation
  SAFE_TEXT: /^[a-zA-Z0-9\s\-_.,!?'"()]+$/,
  
  // Email pattern
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Phone number (various formats)
  PHONE: /^[\d\s\-+()]+$/,
  
  // URL pattern
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // Malaysian IC number
  IC_NUMBER: /^\d{6}-\d{2}-\d{4}$/,
  
  // SQL injection patterns to block
  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE)\b)|(-{2})|(\/*)|(*\/)|;/i,
  
  // Script injection patterns
  SCRIPT_INJECTION: /<script|<\/script|javascript:|onerror=|onclick=|onload=/i,
};

export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    // Configure DOMPurify
    const config = {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOW_DATA_ATTR: false,
      SAFE_FOR_TEMPLATES: true,
    };
    
    return DOMPurify.sanitize(input, config);
  }

  /**
   * Sanitize plain text input
   */
  static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove any HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');
    
    // Remove potential script injections
    sanitized = sanitized.replace(PATTERNS.SCRIPT_INJECTION, '');
    
    // Trim and normalize whitespace
    sanitized = sanitized.trim().replace(/\s+/g, ' ');
    
    // Escape special characters
    sanitized = this.escapeSpecialChars(sanitized);
    
    return sanitized;
  }

  /**
   * Escape special characters
   */
  static escapeSpecialChars(input: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    
    return input.replace(/[&<>"'\/]/g, (char) => escapeMap[char] || char);
  }

  /**
   * Validate and sanitize email
   */
  static sanitizeEmail(input: string): string {
    const trimmed = input.trim().toLowerCase();
    
    if (!PATTERNS.EMAIL.test(trimmed)) {
      throw new Error('Invalid email format');
    }
    
    return trimmed;
  }

  /**
   * Validate and sanitize phone number
   */
  static sanitizePhone(input: string): string {
    // Remove all non-numeric except allowed characters
    const cleaned = input.replace(/[^\d\s\-+()]/g, '');
    
    if (!PATTERNS.PHONE.test(cleaned)) {
      throw new Error('Invalid phone number format');
    }
    
    return cleaned;
  }

  /**
   * Validate and sanitize URL
   */
  static sanitizeUrl(input: string): string {
    const trimmed = input.trim();
    
    if (!PATTERNS.URL.test(trimmed)) {
      throw new Error('Invalid URL format');
    }
    
    // Additional check for malicious URLs
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Only HTTP(S) URLs are allowed');
    }
    
    return trimmed;
  }

  /**
   * Validate and sanitize Malaysian IC number
   */
  static sanitizeIcNumber(input: string): string {
    const cleaned = input.replace(/\s/g, '');
    
    if (!PATTERNS.IC_NUMBER.test(cleaned)) {
      throw new Error('Invalid IC number format');
    }
    
    return cleaned;
  }

  /**
   * Check for SQL injection attempts
   */
  static detectSqlInjection(input: string): boolean {
    return PATTERNS.SQL_INJECTION.test(input);
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(input: string): string {
    // Remove path traversal attempts
    let sanitized = input.replace(/\.\./g, '');
    
    // Remove special characters except allowed ones
    sanitized = sanitized.replace(/[^a-zA-Z0-9._\-]/g, '_');
    
    // Limit length
    if (sanitized.length > 255) {
      const ext = sanitized.split('.').pop();
      const name = sanitized.substring(0, 240);
      sanitized = ext ? `${name}.${ext}` : name;
    }
    
    return sanitized;
  }

  /**
   * Sanitize search query
   */
  static sanitizeSearchQuery(input: string): string {
    // Remove special characters that could break search
    let sanitized = input.replace(/[<>'"]/g, '');
    
    // Limit length
    sanitized = sanitized.substring(0, 100);
    
    // Trim and normalize whitespace
    sanitized = sanitized.trim().replace(/\s+/g, ' ');
    
    return sanitized;
  }

  /**
   * Create a sanitized object from user input
   */
  static sanitizeObject<T extends Record<string, unknown>>(
    input: T,
    schema?: z.ZodSchema<T>
  ): T {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        // Check for SQL injection
        if (this.detectSqlInjection(value)) {
          throw new Error(`Potential SQL injection detected in field: ${key}`);
        }
        
        // Sanitize based on key name
        if (key.includes('email')) {
          sanitized[key] = this.sanitizeEmail(value);
        } else if (key.includes('phone')) {
          sanitized[key] = this.sanitizePhone(value);
        } else if (key.includes('url') || key.includes('link')) {
          sanitized[key] = this.sanitizeUrl(value);
        } else if (key === 'ic_number') {
          sanitized[key] = this.sanitizeIcNumber(value);
        } else {
          sanitized[key] = this.sanitizeText(value);
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    // Validate against schema if provided
    if (schema) {
      return schema.parse(sanitized);
    }
    
    return sanitized as T;
  }
}

/**
 * React hook for input sanitization
 */
export function useInputSanitizer() {
  const sanitizeInput = (value: string, type: 'text' | 'email' | 'phone' | 'url' | 'ic' = 'text'): string => {
    try {
      switch (type) {
        case 'email':
          return InputSanitizer.sanitizeEmail(value);
        case 'phone':
          return InputSanitizer.sanitizePhone(value);
        case 'url':
          return InputSanitizer.sanitizeUrl(value);
        case 'ic':
          return InputSanitizer.sanitizeIcNumber(value);
        default:
          return InputSanitizer.sanitizeText(value);
      }
    } catch (error) {
      // Return original value if sanitization fails
      // The form validation should handle the error
      return value;
    }
  };

  return {
    sanitizeInput,
    sanitizeHtml: InputSanitizer.sanitizeHtml,
    sanitizeFilename: InputSanitizer.sanitizeFilename,
    sanitizeSearchQuery: InputSanitizer.sanitizeSearchQuery,
    detectSqlInjection: InputSanitizer.detectSqlInjection,
  };
}

// Export convenience functions
export const sanitize = {
  text: InputSanitizer.sanitizeText,
  html: InputSanitizer.sanitizeHtml,
  email: InputSanitizer.sanitizeEmail,
  phone: InputSanitizer.sanitizePhone,
  url: InputSanitizer.sanitizeUrl,
  ic: InputSanitizer.sanitizeIcNumber,
  filename: InputSanitizer.sanitizeFilename,
  search: InputSanitizer.sanitizeSearchQuery,
  object: InputSanitizer.sanitizeObject,
};