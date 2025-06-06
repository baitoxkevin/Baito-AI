import { useEffect, useState } from 'react';
import { fetchProjects, fetchProjectsByMonth, createProject, updateProject, deleteProject, deleteMultipleProjects } from '@/lib/projects';
import type { Project } from '@/lib/types';
import { useCache } from '@/lib/cache';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const { getData, isLoading, invalidateCache } = useCache<Project[], []>('projects', fetchProjects);

  // Load projects when the component mounts
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await getData();
        setProjects(data);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };

    loadProjects();
  }, [getData]);

  // Function to create a new project
  const addProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newProject = await createProject(project);
      setProjects(prevProjects => [...prevProjects, newProject]);
      invalidateCache(); // Invalidate cache after creating a new project
      return newProject;
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  };

  // Function to update a project
  const updateProjectData = async (id: string, updates: Partial<Project>) => {
    try {
      const updatedProject = await updateProject(id, updates);
      setProjects(prevProjects =>
        prevProjects.map(project => (project.id === id ? updatedProject : project))
      );
      invalidateCache(); // Invalidate cache after updating a project
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  // Function to delete a project
  const removeProject = async (id: string, userId: string) => {
    try {
      await deleteProject(id, userId);
      setProjects(prevProjects => prevProjects.filter(project => project.id !== id));
      invalidateCache(); // Invalidate cache after deleting a project
    } catch (error) {
      console.error('Error removing project:', error);
      throw error;
    }
  };

  // Function to delete multiple projects
  const removeMultipleProjects = async (projectIds: string[], userId: string) => {
    try {
      const result = await deleteMultipleProjects(projectIds, userId);
      
      // Remove successfully deleted projects from state
      if (result.success.length > 0) {
        setProjects(prevProjects => 
          prevProjects.filter(project => !result.success.includes(project.id))
        );
        // Clear selections after deletion
        setSelectedProjects([]);
        invalidateCache();
      }
      
      return result;
    } catch (error) {
      console.error('Error removing multiple projects:', error);
      throw error;
    }
  };

  // Function to refresh the projects list
  const refreshProjects = async () => {
    try {
      invalidateCache(); // Force cache invalidation
      const data = await getData();
      setProjects(data);
      // Clear selections on refresh
      setSelectedProjects([]);
    } catch (error) {
      console.error('Error refreshing projects:', error);
    }
  };

  // Toggle project selection
  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        // Remove from selection
        return prev.filter(id => id !== projectId);
      } else {
        // Add to selection
        return [...prev, projectId];
      }
    });
  };

  // Select all visible projects
  const selectAllProjects = (visibleProjectIds: string[]) => {
    // If all visible projects are already selected, deselect all
    const allSelected = visibleProjectIds.every(id => selectedProjects.includes(id));
    
    if (allSelected) {
      // Deselect only the visible projects
      setSelectedProjects(prev => prev.filter(id => !visibleProjectIds.includes(id)));
    } else {
      // Select all visible projects that aren't already selected
      const newSelections = visibleProjectIds.filter(id => !selectedProjects.includes(id));
      setSelectedProjects(prev => [...prev, ...newSelections]);
    }
  };

  // Clear all selections
  const clearProjectSelections = () => {
    setSelectedProjects([]);
  };

  return {
    projects,
    isLoading,
    addProject,
    updateProject: updateProjectData,
    removeProject,
    removeMultipleProjects,
    refreshProjects,
    selectedProjects,
    toggleProjectSelection,
    selectAllProjects,
    clearProjectSelections
  };
}

export function useProjectsByMonth() {
  const { getData, isLoading, invalidateCache, prefetch } = useCache<Project[], [number, number]>(
    'projectsByMonth', 
    (month: number, year?: number) => {
      // If year is not provided, use current year
      const currentYear = year || new Date().getFullYear();
      // console.log(`Fetching projects for ${currentYear}/${month}`);
      return fetchProjectsByMonth(currentYear, month);
    }
  );

  // Get projects by month - with enhanced error handling and retry mechanism
  const getProjectsByMonth = async (month: number, year?: number) => {
    try {
      // console.log(`Getting projects for month ${month}, year ${year || new Date().getFullYear()}`);
      
      // Track attempt for retries if needed
      let attempts = 0;
      const MAX_ATTEMPTS = 2;
      
      // Try to fetch with retries on failure
      while (attempts < MAX_ATTEMPTS) {
        try {
          const data = await getData(month, year);
          
          // Log success information (only detailed on first attempt)
          if (attempts === 0) {
            // console.log(`Successfully fetched ${data.length} projects for ${month}/${year || new Date().getFullYear()}`);
          } else {
            // console.log(`Retry #${attempts} successful, got ${data.length} projects`);
          }
          
          // If we get empty data on first attempt, try once with cache invalidation
          if (data.length === 0 && attempts === 0) {
            // console.log('No projects returned from cache, invalidating and retrying');
            invalidateCache(month, year);
            attempts++;
            continue;
          }
          
          return data;
        } catch (innerError) {
          console.error(`Attempt #${attempts + 1} failed:`, innerError);
          
          // Invalidate cache and retry
          invalidateCache(month, year);
          attempts++;
          
          // If we've exhausted all attempts, throw to outer handler
          if (attempts >= MAX_ATTEMPTS) {
            throw innerError;
          }
        }
      }
      
      // Should never reach here due to throw above, but TypeScript needs this
      return [];
    } catch (error) {
      console.error('Error in getProjectsByMonth:', error);
      return [];
    }
  };

  // Prefetch next and previous month data
  const prefetchAdjacentMonths = (currentMonth: number) => {
    const currentYear = new Date().getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    
    // For previous month, handle year change if necessary
    const prevYear = prevMonth === 11 && currentMonth === 0 ? currentYear - 1 : currentYear;
    // For next month, handle year change if necessary
    const nextYear = nextMonth === 0 && currentMonth === 11 ? currentYear + 1 : currentYear;
    
    // Prefetch adjacent months
    prefetch(prevMonth, prevYear);
    prefetch(nextMonth, nextYear);
  };

  return {
    getProjectsByMonth,
    isLoading,
    invalidateCache,
    prefetchAdjacentMonths
  };
}