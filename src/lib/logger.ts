/**
 * Secure Logger Service
 * Replaces console.log with environment-aware logging
 * Implements OWASP logging best practices
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

class SecureLogger {
  private isDevelopment = import.meta.env.DEV;
  private logLevel = import.meta.env.VITE_LOG_LEVEL || 'error';
  private enabledLevels: Set<LogLevel>;

  constructor() {
    // Configure which log levels are active based on environment
    this.enabledLevels = this.getEnabledLevels();
  }

  private getEnabledLevels(): Set<LogLevel> {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical'];
    const configuredLevel = this.logLevel.toLowerCase() as LogLevel;
    const levelIndex = levels.indexOf(configuredLevel);
    
    if (levelIndex === -1) {
      // Default to error if invalid level
      return new Set(['error', 'critical']);
    }
    
    // Include configured level and all higher priority levels
    return new Set(levels.slice(levelIndex));
  }

  private sanitize(data: unknown): unknown {
    if (typeof data === 'string') {
      // Remove potential sensitive patterns
      return data
        .replace(/password["\s]*[:=]["\s]*["']?[^"',\s}]+["']?/gi, 'password=***')
        .replace(/token["\s]*[:=]["\s]*["']?[^"',\s}]+["']?/gi, 'token=***')
        .replace(/api[_-]?key["\s]*[:=]["\s]*["']?[^"',\s}]+["']?/gi, 'api_key=***')
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***')
        .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '****-****-****-****'); // Credit cards
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, unknown> | unknown[] = Array.isArray(data) ? [] : {};
      
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          // Skip sensitive keys entirely
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('password') || 
              lowerKey.includes('token') || 
              lowerKey.includes('secret') ||
              lowerKey.includes('api_key') ||
              lowerKey.includes('private')) {
            sanitized[key] = '***REDACTED***';
          } else {
            sanitized[key] = this.sanitize(data[key]);
          }
        }
      }
      
      return sanitized;
    }
    
    return data;
  }

  private formatMessage(level: LogLevel, message: string, context?: unknown): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.sanitize(message),
    };

    if (context) {
      entry.context = this.sanitize(context);
    }

    // Add session/request context if available
    if (typeof window !== 'undefined') {
      const sessionId = sessionStorage.getItem('sessionId');
      if (sessionId) entry.sessionId = sessionId;
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    // In production, send to logging service
    if (!this.isDevelopment && import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true') {
      // Send to external logging service (e.g., Sentry, LogRocket)
      this.sendToLoggingService(entry);
    }

    // In development, use console
    if (this.isDevelopment) {
      const consoleMethods = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
        critical: console.error,
      };

      const method = consoleMethods[entry.level] || console.log;
      method(`[${entry.level.toUpperCase()}]`, entry.message, entry.context || '');
    }
  }

  private sendToLoggingService(entry: LogEntry): void {
    // Implement integration with your logging service
    // Example: Sentry, LogRocket, CloudWatch, etc.

    // For now, we'll store in a buffer and batch send
    if (typeof window !== 'undefined') {
      try {
        const bufferStr = localStorage.getItem('log_buffer') || '[]';
        let buffer: any[] = [];

        try {
          buffer = JSON.parse(bufferStr);
          if (!Array.isArray(buffer)) {
            buffer = [];
          }
        } catch (parseError) {
          console.warn('Failed to parse log buffer, resetting:', parseError);
          buffer = [];
        }

        buffer.push(entry);

        // Limit buffer size
        if (buffer.length > 100) {
          buffer.shift();
        }

        localStorage.setItem('log_buffer', JSON.stringify(buffer));

        // Batch send every 10 logs or on critical errors
        if (buffer.length >= 10 || entry.level === 'critical') {
          this.flushLogs();
        }
      } catch (error) {
        // Silent fail to avoid recursive logging issues
        console.warn('Error in log buffering:', error);
      }
    }
  }

  private async flushLogs(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const bufferStr = localStorage.getItem('log_buffer') || '[]';
      let buffer: any[] = [];

      try {
        buffer = JSON.parse(bufferStr);
        if (!Array.isArray(buffer)) {
          buffer = [];
        }
      } catch (parseError) {
        console.warn('Failed to parse log buffer during flush, clearing:', parseError);
        localStorage.setItem('log_buffer', '[]');
        return;
      }

      if (buffer.length === 0) return;

      try {
        // Send to your logging endpoint
        // await fetch('/api/logs', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ logs: buffer })
        // });

        // Clear buffer on success
        localStorage.setItem('log_buffer', '[]');
      } catch (error) {
        // Silent fail to avoid recursive logging
      }
    } catch (error) {
      console.warn('Error in flushLogs:', error);
    }
  }

  // Public logging methods
  debug(message: string, context?: unknown): void {
    if (this.enabledLevels.has('debug')) {
      this.output(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: unknown): void {
    if (this.enabledLevels.has('info')) {
      this.output(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: unknown): void {
    if (this.enabledLevels.has('warn')) {
      this.output(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: unknown): void {
    if (this.enabledLevels.has('error')) {
      this.output(this.formatMessage('error', message, context));
    }
  }

  critical(message: string, context?: unknown): void {
    if (this.enabledLevels.has('critical')) {
      this.output(this.formatMessage('critical', message, context));
      // Critical errors should trigger immediate notification
      this.flushLogs();
    }
  }

  // Utility method to track user actions for audit trail
  audit(action: string, details?: unknown): void {
    this.info(`AUDIT: ${action}`, {
      ...details,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    });
  }

  // Performance logging
  performance(operation: string, duration: number, metadata?: unknown): void {
    if (duration > 1000) {
      // Log slow operations
      this.warn(`Slow operation: ${operation}`, {
        duration: `${duration}ms`,
        ...metadata
      });
    } else if (this.enabledLevels.has('debug')) {
      this.debug(`Performance: ${operation}`, {
        duration: `${duration}ms`,
        ...metadata
      });
    }
  }

  // Security event logging
  security(event: string, details?: unknown): void {
    this.warn(`SECURITY: ${event}`, {
      ...details,
      timestamp: new Date().toISOString(),
      ip: 'client', // In production, get from request headers
    });
  }
}

// Export singleton instance
export const logger = new SecureLogger();

// Export types for use in other files
export type { LogLevel, LogEntry };

// Disable console in production to prevent accidental logging
if (import.meta.env.PROD && typeof window !== 'undefined') {
  // Store original console methods for critical errors
  const originalConsole = {
    error: console.error,
    warn: console.warn,
  };

  // Override console methods
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.trace = () => {};
  console.table = () => {};
  console.dir = () => {};
  
  // Keep error and warn but redirect through logger
  console.error = (...args) => {
    logger.error('Console error:', { args });
    if (import.meta.env.DEV) {
      originalConsole.error(...args);
    }
  };
  
  console.warn = (...args) => {
    logger.warn('Console warning:', { args });
    if (import.meta.env.DEV) {
      originalConsole.warn(...args);
    }
  };
}