// This is a simplified version to break infinite loops
import { useCallback } from 'react';
import type { Project } from '@/lib/types';

// Dummy data for the calendar
const dummyProjects: Project[] = [
  {
    id: "dummy-1",
    title: "Demo Project 1",
    status: "Completed",
    priority: "High",
    start_date: new Date().toISOString(),
    end_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
    venue_address: "123 Main St",
    working_hours_start: "09:00",
    working_hours_end: "17:00",
    event_type: "conference",
    crew_count: 5,
    filled_positions: 5,
    color: "#93C5FD",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    supervisors_required: 1
  },
  {
    id: "dummy-2",
    title: "Demo Project 2",
    status: "In Progress",
    priority: "Medium",
    start_date: new Date().toISOString(),
    end_date: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
    venue_address: "456 Main St",
    working_hours_start: "10:00",
    working_hours_end: "18:00",
    event_type: "roadshow",
    crew_count: 10,
    filled_positions: 7,
    color: "#FCA5A5",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    supervisors_required: 2
  }
];

export function useFixedCalendarCache() {
  // A simplified version that just returns our dummy data
  const getMonthData = useCallback(async () => {
    return dummyProjects;
  }, []);

  const invalidateCache = useCallback(() => {
    // No-op function for compatibility
  }, []);

  return {
    getMonthData,
    invalidateCache,
    isLoading: false,
    useDummyData: true,
    prefetchAdjacentMonths: () => {}
  };
}

export function useFixedProjects() {
  return {
    projects: dummyProjects,
    isLoading: false,
    addProject: async () => dummyProjects[0],
    updateProject: async () => dummyProjects[0],
    removeProject: async () => {},
    removeMultipleProjects: async () => ({ success: [], failed: [] }),
    refreshProjects: async () => {},
    selectedProjects: [],
    toggleProjectSelection: () => {},
    selectAllProjects: () => {},
    clearProjectSelections: () => {}
  };
}