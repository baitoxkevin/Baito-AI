/**
 * Standard project status values used throughout the application
 * All status values should use hyphens for multi-word statuses
 */
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
  NEW: 'new'
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

/**
 * Status display names for UI
 */
export const PROJECT_STATUS_DISPLAY: Record<ProjectStatus, string> = {
  [PROJECT_STATUS.PLANNING]: 'Planning',
  [PROJECT_STATUS.SCHEDULED]: 'Scheduled',
  [PROJECT_STATUS.ACTIVE]: 'Active',
  [PROJECT_STATUS.IN_PROGRESS]: 'In Progress',
  [PROJECT_STATUS.COMPLETED]: 'Completed',
  [PROJECT_STATUS.CANCELLED]: 'Cancelled',
  [PROJECT_STATUS.PENDING]: 'Pending',
  [PROJECT_STATUS.NEW]: 'New'
};

/**
 * Status colors for UI components
 */
export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  [PROJECT_STATUS.PLANNING]: 'bg-gray-100 text-gray-800',
  [PROJECT_STATUS.SCHEDULED]: 'bg-blue-100 text-blue-800',
  [PROJECT_STATUS.ACTIVE]: 'bg-green-100 text-green-800',
  [PROJECT_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [PROJECT_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
  [PROJECT_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
  [PROJECT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [PROJECT_STATUS.NEW]: 'bg-purple-100 text-purple-800'
};

/**
 * Helper function to normalize status values
 * Converts underscores to hyphens and handles case
 */
export function normalizeProjectStatus(status: string): ProjectStatus {
  const normalized = status.toLowerCase().replace(/_/g, '-');
  
  // Map common variations
  if (normalized === 'active' || normalized === 'in-progress') {
    return PROJECT_STATUS.IN_PROGRESS;
  }
  
  // Return normalized value if it's valid, otherwise default to pending
  return Object.values(PROJECT_STATUS).includes(normalized as ProjectStatus) 
    ? normalized as ProjectStatus 
    : PROJECT_STATUS.PENDING;
}