/**
 * Custom Hooks Barrel Export
 *
 * This file provides a single import point for all custom hooks.
 *
 * Usage:
 * import { useProjects, useDebounce, useToast } from '@/hooks';
 */

// Data Hooks
export { useProjects } from './use-projects';
export { useProjectsOptimized } from './use-projects-optimized';
export { useCalendarCache } from './use-calendar-cache';
export { useExpenseClaims } from './use-expense-claims';
export { useReceipts } from './use-receipts';
export { useHierarchicalCompanies } from './use-hierarchical-companies';

// Auto-save Hooks
export { useAutosaveProject } from './use-autosave-project';
export { useAutosaveStaff } from './use-autosave-staff';
export { useAutosaveExpenseClaim } from './use-autosave-expense-claim';

// UI Hooks
export { useToast, toast } from './use-toast';
export { useEnhancedToast } from './use-enhanced-toast';
export { useDebounce } from './use-debounce';
export { usePersistentState } from './use-persistent-state';
export { useMobile } from './use-mobile';

// Feature Hooks
export { useAiChat } from './use-ai-chat';

// Re-export types
export type { Toast, ToasterToast } from './use-toast';
