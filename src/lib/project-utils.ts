import { format, parseISO, isAfter, isBefore, isToday, addDays } from 'date-fns';
import type { Project } from '@/lib/types';

/**
 * Determines if a project should be featured based on criteria
 * @param project The project to check
 * @returns boolean
 */
export const isFeatureWorthy = (project: Project): boolean => {
  // Consider projects as feature-worthy if:
  // 1. They are high priority
  // 2. Have more than 10 crew members
  // 3. Start in the next 7 days
  // 4. Have a custom property marking them as featured
  
  const isHighPriority = project.priority.toLowerCase() === 'high';
  const isLargeCrew = project.crew_count > 10;
  
  const startDate = parseISO(project.start_date);
  const isUpcoming = isAfter(startDate, new Date()) && 
                    isBefore(startDate, addDays(new Date(), 7));
  
  const isMarkedAsFeatured = (project as unknown).featured === true;
  
  return isMarkedAsFeatured || 
         (isHighPriority && (isLargeCrew || isUpcoming));
};

/**
 * Group type for different project grouping methods
 */
export type ProjectGroupType = 'status' | 'priority' | 'client' | 'time' | 'none';

/**
 * Groups projects by specified grouping type
 * @param projects List of projects to group
 * @param groupType How to group the projects
 * @returns Record with group names as keys and arrays of projects as values
 */
export const groupProjects = (
  projects: Project[], 
  groupType: ProjectGroupType
): Record<string, Project[]> => {
  if (groupType === 'none' || !projects.length) {
    return { 'All Projects': projects };
  }
  
  const groups: Record<string, Project[]> = {};
  
  if (groupType === 'status') {
    // Group by status (normalize and capitalize)
    projects.forEach(project => {
      // Normalize status: replace underscores with hyphens and capitalize
      const normalizedStatus = project.status.replace(/_/g, '-');
      const status = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1).toLowerCase();
      
      // Handle special cases
      if (status === 'Scheduled' || status === 'Planning') {
        // Group scheduled and planning into Pending
        groups['Pending'] = groups['Pending'] || [];
        groups['Pending'].push(project);
      } else {
        if (!groups[status]) {
          groups[status] = [];
        }
        groups[status].push(project);
      }
    });
    
    // Sort by status priority
    const statusOrder = ['New', 'Pending', 'In-progress', 'Completed', 'Cancelled'];
    return Object.fromEntries(
      statusOrder
        .filter(status => groups[status])
        .map(status => [status, groups[status]])
    );
  } 
  
  else if (groupType === 'priority') {
    // Group by priority
    const priorityOrder = ['High', 'Medium', 'Low'];
    
    projects.forEach(project => {
      const priority = project.priority.charAt(0).toUpperCase() + project.priority.slice(1).toLowerCase();
      if (!groups[priority]) {
        groups[priority] = [];
      }
      groups[priority].push(project);
    });
    
    return Object.fromEntries(
      priorityOrder
        .filter(priority => groups[priority])
        .map(priority => [priority, groups[priority]])
    );
  } 
  
  else if (groupType === 'client') {
    // Group by client
    projects.forEach(project => {
      let clientName = 'No Client';
      
      if (project.client) {
        clientName = (project.client as unknown).name || 
                     (project.client as unknown).company_name || 
                     'Unnamed Client';
      }
      
      if (!groups[clientName]) {
        groups[clientName] = [];
      }
      groups[clientName].push(project);
    });
    
    // Sort clients alphabetically, putting "No Client" at the end
    return Object.fromEntries(
      Object.entries(groups)
        .sort(([a], [b]) => {
          if (a === 'No Client') return 1;
          if (b === 'No Client') return -1;
          return a.localeCompare(b);
        })
    );
  } 
  
  else if (groupType === 'time') {
    // Group by time relative to now: Today, This Week, This Month, Future, Past
    const today: Project[] = [];
    const thisWeek: Project[] = [];
    const thisMonth: Project[] = [];
    const future: Project[] = [];
    const past: Project[] = [];
    
    const now = new Date();
    const endOfWeek = addDays(now, 7);
    const endOfMonth = addDays(now, 30);
    
    projects.forEach(project => {
      const startDate = parseISO(project.start_date);
      
      if (isToday(startDate)) {
        today.push(project);
      } else if (isBefore(startDate, endOfWeek) && isAfter(startDate, now)) {
        thisWeek.push(project);
      } else if (isBefore(startDate, endOfMonth) && isAfter(startDate, now)) {
        thisMonth.push(project);
      } else if (isAfter(startDate, now)) {
        future.push(project);
      } else {
        past.push(project);
      }
    });
    
    if (today.length) groups['Today'] = today;
    if (thisWeek.length) groups['This Week'] = thisWeek;
    if (thisMonth.length) groups['This Month'] = thisMonth;
    if (future.length) groups['Future'] = future;
    if (past.length) groups['Past'] = past;
    
    return groups;
  }
  
  return { 'All Projects': projects };
};

/**
 * Get icon name for a group
 * @param groupName Name of the group
 * @param groupType Type of grouping used
 * @returns Icon name to represent this group
 */
export const getGroupIcon = (groupName: string, groupType: ProjectGroupType): string => {
  if (groupType === 'status') {
    return {
      'New': 'Sparkles',
      'Pending': 'Clock',
      'In-progress': 'Hourglass',
      'Completed': 'CheckCircle',
      'Cancelled': 'XCircle'
    }[groupName] || 'Circle';
  }
  
  if (groupType === 'priority') {
    return {
      'High': 'AlertTriangle',
      'Medium': 'ArrowRight',
      'Low': 'ArrowDown'
    }[groupName] || 'Circle';
  }
  
  if (groupType === 'time') {
    return {
      'Today': 'Calendar',
      'This Week': 'CalendarDays',
      'This Month': 'CalendarRange',
      'Future': 'Clock',
      'Past': 'History'
    }[groupName] || 'Calendar';
  }
  
  // For client grouping, use a generic icon
  if (groupType === 'client') {
    return 'Building';
  }
  
  return 'Circle';
};

/**
 * Sort projects by a specified criteria
 * @param projects List of projects to sort
 * @param sortBy Sort criteria
 * @returns Sorted array of projects
 */
// Pre-defined sort orders for performance
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const STATUS_ORDER = { 
  'in-progress': 0, 
  'in_progress': 0,  // Handle underscore variant
  'active': 0,       // Handle active as in-progress
  'confirmed': 1,    // Handle confirmed as pending
  pending: 1, 
  planning: 1,       // Handle planning as pending
  scheduled: 1,      // Handle scheduled as pending
  new: 2, 
  completed: 3, 
  cancelled: 4 
};

export const sortProjects = (
  projects: Project[], 
  sortBy: 'date' | 'priority' | 'status' | 'title' | 'progress'
): Project[] => {
  // Early return for empty or single-item arrays
  if (!projects || projects.length <= 1) return projects;
  
  const sortedProjects = [...projects];
  
  switch (sortBy) {
    case 'date':
      // Sort by start date, newest first - optimized with cached timestamps
      return sortedProjects.sort((a, b) => {
        // Cache date conversions
        const aTime = new Date(b.start_date).getTime();
        const bTime = new Date(a.start_date).getTime();
        return aTime - bTime;
      });
      
    case 'priority':
      // Sort by priority: high → medium → low - optimized with pre-defined order
      return sortedProjects.sort((a, b) => {
        const aPriority = a.priority.toLowerCase();
        const bPriority = b.priority.toLowerCase();
        const aOrder = PRIORITY_ORDER[aPriority as keyof typeof PRIORITY_ORDER] ?? 3;
        const bOrder = PRIORITY_ORDER[bPriority as keyof typeof PRIORITY_ORDER] ?? 3;
        return aOrder - bOrder;
      });
      
    case 'status':
      // Sort by status - optimized with pre-defined order
      return sortedProjects.sort((a, b) => {
        const aStatus = a.status.toLowerCase().replace(/_/g, '-');
        const bStatus = b.status.toLowerCase().replace(/_/g, '-');
        const aOrder = STATUS_ORDER[aStatus as keyof typeof STATUS_ORDER] ?? 5;
        const bOrder = STATUS_ORDER[bStatus as keyof typeof STATUS_ORDER] ?? 5;
        return aOrder - bOrder;
      });
      
    case 'title':
      // Sort alphabetically by title - using localeCompare for proper sorting
      return sortedProjects.sort((a, b) => 
        a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' })
      );
      
    case 'progress':
      // Sort by crew fill progress (filled / total) - handle division by zero
      return sortedProjects.sort((a, b) => {
        const aProgress = a.crew_count > 0 ? a.filled_positions / a.crew_count : 0;
        const bProgress = b.crew_count > 0 ? b.filled_positions / b.crew_count : 0;
        return bProgress - aProgress;
      });
      
    default:
      return sortedProjects;
  }
};

/**
 * Filters projects based on search terms and filters
 * @param projects List of projects to filter
 * @param searchTerm Search term to match against project title and details
 * @param filters Optional filters to apply
 * @returns Filtered array of projects
 */
export const filterProjects = (
  projects: Project[],
  searchTerm: string = '',
  filters: {
    status?: string[];
    priority?: string[];
    client?: string[];
    dateRange?: { from?: Date; to?: Date };
  } = {}
): Project[] => {
  // Early return for no filters
  if (!searchTerm && Object.keys(filters).length === 0) {
    return projects;
  }
  
  // Pre-process search term and filters for performance
  const term = searchTerm ? searchTerm.toLowerCase() : null;
  const statusSet = filters.status?.length ? new Set(filters.status.map(s => s.toLowerCase())) : null;
  const prioritySet = filters.priority?.length ? new Set(filters.priority.map(p => p.toLowerCase())) : null;
  const clientSet = filters.client?.length ? new Set(filters.client) : null;
  
  return projects.filter(project => {
    // Search term matching - optimized with early returns
    if (term) {
      // Check title first (most likely match)
      if (project.title.toLowerCase().includes(term)) {
        // Continue to other filters
      } else if (project.venue_address?.toLowerCase().includes(term)) {
        // Continue to other filters
      } else if (project.client) {
        const client = project.client as any;
        if (!client.name?.toLowerCase().includes(term) && 
            !client.company_name?.toLowerCase().includes(term)) {
          return false;
        }
      } else {
        return false;
      }
    }
    
    // Status filter - optimized with Set lookup
    if (statusSet && !statusSet.has(project.status.toLowerCase())) {
      return false;
    }
    
    // Priority filter - optimized with Set lookup
    if (prioritySet && !prioritySet.has(project.priority.toLowerCase())) {
      return false;
    }
    
    // Client filter - optimized with Set lookup
    if (clientSet) {
      const clientName = (project.client as any)?.name || 
                        (project.client as any)?.company_name || 
                        'No Client';
      if (!clientSet.has(clientName)) {
        return false;
      }
    }
    
    // Date range filter
    if (filters.dateRange) {
      const startDate = parseISO(project.start_date);
      
      if (filters.dateRange.from && isBefore(startDate, filters.dateRange.from)) {
        return false;
      }
      
      if (filters.dateRange.to && isAfter(startDate, filters.dateRange.to)) {
        return false;
      }
    }
    
    // Passed all filters
    return true;
  });
};