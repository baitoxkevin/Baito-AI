/**
 * Zustand Store Index
 *
 * Barrel export for all Zustand stores.
 * Install zustand: npm install zustand
 *
 * Usage:
 * import { useProjectStore, useAuthStore, useUIStore } from '@/stores';
 */

export { useProjectStore } from './projectStore';
export { useAuthStore } from './authStore';
export { useUIStore } from './uiStore';

// Re-export types
export type { Project, ProjectFilters } from './projectStore';
export type { User, AuthState } from './authStore';
export type { UIState } from './uiStore';
