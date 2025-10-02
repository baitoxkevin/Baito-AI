// Security: Migrated to secure implementation using ExcelJS
// This file now re-exports the secure implementation to maintain backward compatibility
// All functionality has been moved to utils-secure.ts with enhanced security measures:
// - Input validation and sanitization
// - Protection against formula injection attacks
// - File size and type restrictions
// - Memory usage limits to prevent DoS
// - XSS prevention through HTML entity escaping

export * from './utils-secure';