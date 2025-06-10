/**
 * View cache management system to preload views for seamless navigation
 */

import { prefetchProjects } from './optimized-queries';

import { logger } from './logger';
// Flag to track if preloading has been completed
let preloadedViews: Record<string, boolean> = {
  dashboard: false,
  projects: false,
  calendar: false,
  candidates: false,
  tools: false,
  todo: false,
  settings: false
};

// Current active view
let currentView: string = '';

/**
 * Set the current active view and trigger preloading of adjacent views
 */
export function setActiveView(view: string): void {
  currentView = view;
  preloadedViews[view] = true;
  
  // Schedule preloading of other views
  setTimeout(() => {
    preloadAdjacentViews(view);
  }, 300);
}

/**
 * Check if a view has been preloaded
 */
export function isViewPreloaded(view: string): boolean {
  return !!preloadedViews[view];
}

/**
 * Preload data for views that are likely to be navigated to next
 */
async function preloadAdjacentViews(currentView: string): Promise<void> {
  logger.debug(`Preloading adjacent views for: ${currentView}`);
  
  // Define the preloading strategy for each view
  switch (currentView) {
    case 'dashboard':
      await Promise.all([
        preloadView('projects'),
        preloadView('calendar')
      ]);
      break;
    
    case 'projects':
      await Promise.all([
        preloadView('calendar'),
        preloadView('dashboard')
      ]);
      break;
      
    case 'calendar':
      await Promise.all([
        preloadView('projects'),
        preloadView('dashboard')
      ]);
      break;
      
    case 'candidates':
      await Promise.all([
        preloadView('projects')
      ]);
      break;
      
    case 'todo':
      await Promise.all([
        preloadView('projects')
      ]);
      break;
      
    case 'tools':
      // Tools view might have specific preloading requirements
      break;
      
    case 'settings':
      // Settings doesn't typically need preloading
      break;
      
    default:
      // Fallback to preloading common views
      await Promise.all([
        preloadView('dashboard'),
        preloadView('projects')
      ]);
  }
}

/**
 * Preload data for a specific view
 */
async function preloadView(view: string): Promise<void> {
  // Skip if already preloaded
  if (preloadedViews[view]) {
    return;
  }
  
  try {
    logger.debug(`Preloading view: ${view}`);
    
    switch (view) {
      case 'projects':
        await prefetchProjects();
        break;
        
      case 'calendar':
        // Prefetch calendar data would go here
        break;
        
      case 'candidates':
        // Prefetch candidates data would go here
        break;
        
      case 'todo':
        // Prefetch todo data would go here
        break;
        
      // Add more views as needed
    }
    
    // Mark as preloaded
    preloadedViews[view] = true;
    logger.debug(`View preloaded: ${view}`);
  } catch (error) {
    logger.error(`Error preloading view ${view}:`, error);
    // Don't update preloaded flag on error
  }
}

/**
 * Reset the preloaded state for testing
 */
export function resetPreloadedState(): void {
  preloadedViews = {
    dashboard: false,
    projects: false,
    calendar: false,
    candidates: false,
    tools: false,
    todo: false,
    settings: false
  };
}