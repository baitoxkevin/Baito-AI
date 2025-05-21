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
  
  const isMarkedAsFeatured = (project as any).featured === true;
  
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
    // Group by status (capitalize first letter)
    projects.forEach(project => {
      const status = project.status.charAt(0).toUpperCase() + project.status.slice(1).toLowerCase();
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(project);
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
        clientName = (project.client as any).name || 
                     (project.client as any).company_name || 
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
export const sortProjects = (
  projects: Project[], 
  sortBy: 'date' | 'priority' | 'status' | 'title' | 'progress'
): Project[] => {
  const sortedProjects = [...projects];
  
  switch (sortBy) {
    case 'date':
      // Sort by start date, newest first
      return sortedProjects.sort((a, b) => 
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
      
    case 'priority':
      // Sort by priority: high → medium → low
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return sortedProjects.sort((a, b) => {
        const aPriority = a.priority.toLowerCase();
        const bPriority = b.priority.toLowerCase();
        return (priorityOrder[aPriority as keyof typeof priorityOrder] || 3) - 
               (priorityOrder[bPriority as keyof typeof priorityOrder] || 3);
      });
      
    case 'status':
      // Sort by status: in-progress → pending → new → completed → cancelled
      const statusOrder = { 
        'in-progress': 0, 
        pending: 1, 
        new: 2, 
        completed: 3, 
        cancelled: 4 
      };
      return sortedProjects.sort((a, b) => {
        const aStatus = a.status.toLowerCase();
        const bStatus = b.status.toLowerCase();
        return (statusOrder[aStatus as keyof typeof statusOrder] || 5) - 
               (statusOrder[bStatus as keyof typeof statusOrder] || 5);
      });
      
    case 'title':
      // Sort alphabetically by title
      return sortedProjects.sort((a, b) => 
        a.title.localeCompare(b.title)
      );
      
    case 'progress':
      // Sort by crew fill progress (filled / total)
      return sortedProjects.sort((a, b) => {
        const aProgress = a.filled_positions / a.crew_count;
        const bProgress = b.filled_positions / b.crew_count;
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
  if (!searchTerm && Object.keys(filters).length === 0) {
    return projects;
  }
  
  return projects.filter(project => {
    // Search term matching
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesTitle = project.title.toLowerCase().includes(term);
      const matchesVenue = project.venue_address.toLowerCase().includes(term);
      const matchesClient = project.client && 
        ((project.client as any).name?.toLowerCase().includes(term) || 
         (project.client as any).company_name?.toLowerCase().includes(term));
         
      // If no matches, skip this project
      if (!(matchesTitle || matchesVenue || matchesClient)) {
        return false;
      }
    }
    
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.some(s => s.toLowerCase() === project.status.toLowerCase())) {
        return false;
      }
    }
    
    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.some(p => p.toLowerCase() === project.priority.toLowerCase())) {
        return false;
      }
    }
    
    // Client filter
    if (filters.client && filters.client.length > 0) {
      const clientName = (project.client as any)?.name || 
                        (project.client as any)?.company_name || 
                        'No Client';
      if (!filters.client.some(c => c === clientName)) {
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