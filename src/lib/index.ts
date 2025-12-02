/**
 * Library/Services Barrel Export
 *
 * This file provides a single import point for commonly used utilities and services.
 *
 * Usage:
 * import { supabase, logger, cn } from '@/lib';
 */

// Core
export { supabase } from './supabase';
export { logger } from './logger';
export { cn } from './utils';

// Environment
export { env, isDevelopment, isProduction, isStaging, isDebugEnabled } from './env';
export { isAIChatEnabled, isReceiptScannerEnabled, isSocialSharingEnabled } from './env';

// Service Factory
export { createService, projectService, candidateService, expenseClaimService, paymentService } from './service-factory';

// Auth
export { getSession, getCurrentUser, signOut } from './auth';

// Cache
export { cacheManager } from './cache-manager';

// Projects
export { fetchProjects, fetchProjectsByMonth, createProject, updateProject, deleteProject } from './projects';

// Re-export types
export type { Env } from './env';
