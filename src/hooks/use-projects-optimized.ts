import { useEffect, useState, useCallback } from 'react';
import { logger } from '../lib/logger';
import { 
  fetchProjectsOptimized, 
  fetchProjectsByMonthOptimized,
  deleteMultipleProjectsOptimized 
} from '@/lib/optimized-queries';
import { createProject, updateProject, deleteProject } from '@/lib/projects';
import type { Project } from '@/lib/types';
import { useCache } from '@/lib/cache';

export function useProjectsOptimized() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const { getData, isLoading, invalidateCache } = useCache<Project[], []>(
    'projects', 
    fetchProjectsOptimized,
    {
      // Add cache expiration for optimized performance
      expireAfter: 5 * 60 * 1000, // 5 minutes 
      staleAfter: 1 * 60 * 1000,  // 1 minute
    }
  );

  // Load projects when the component mounts
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await getData();
        setProjects(data);
      } catch (error) {
        logger.error('Error loading projects:', error);
      }
    };

    loadProjects();
  }, [getData]);

  // Function to create a new project
  const addProject = useCallback(async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newProject = await createProject(project);
      setProjects(prevProjects => [...prevProjects, newProject]);
      invalidateCache(); // Invalidate cache after creating a new project
      return newProject;
    } catch (error) {
      logger.error('Error adding project:', error);
      throw error;
    }
  }, [invalidateCache]);

  // Function to update a project
  const updateProjectData = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      const updatedProject = await updateProject(id, updates);
      setProjects(prevProjects =>
        prevProjects.map(project => (project.id === id ? updatedProject : project))
      );
      invalidateCache(); // Invalidate cache after updating a project
      return updatedProject;
    } catch (error) {
      logger.error('Error updating project:', error);
      throw error;
    }
  }, [invalidateCache]);

  // Function to delete a project
  const removeProject = useCallback(async (id: string, userId: string) => {
    try {
      await deleteProject(id, userId);
      setProjects(prevProjects => prevProjects.filter(project => project.id !== id));
      invalidateCache(); // Invalidate cache after deleting a project
    } catch (error) {
      logger.error('Error removing project:', error);
      throw error;
    }
  }, [invalidateCache]);

  // Function to delete multiple projects efficiently
  const removeMultipleProjects = useCallback(async (projectIds: string[], userId: string) => {
    if (!projectIds.length) return { success: [], failed: [] };
    
    try {
      const result = await deleteMultipleProjectsOptimized(projectIds, userId);
      
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
      logger.error('Error removing multiple projects:', error);
      throw error;
    }
  }, [invalidateCache]);

  // Function to refresh the projects list
  const refreshProjects = useCallback(async () => {
    try {
      invalidateCache(); // Force cache invalidation
      const data = await getData();
      setProjects(data);
      // Clear selections on refresh
      setSelectedProjects([]);
    } catch (error) {
      logger.error('Error refreshing projects:', error);
    }
  }, [getData, invalidateCache]);

  // Toggle project selection
  const toggleProjectSelection = useCallback((projectId: string) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        // Remove from selection
        return prev.filter(id => id !== projectId);
      } else {
        // Add to selection
        return [...prev, projectId];
      }
    });
  }, []);

  // Select all visible projects
  const selectAllProjects = useCallback((visibleProjectIds: string[]) => {
    // If all visible projects are already selected, deselect all
    setSelectedProjects(prev => {
      const allSelected = visibleProjectIds.every(id => prev.includes(id));
      
      if (allSelected) {
        // Deselect only the visible projects
        return prev.filter(id => !visibleProjectIds.includes(id));
      } else {
        // Select all visible projects that aren't already selected
        const newSelections = visibleProjectIds.filter(id => !prev.includes(id));
        return [...prev, ...newSelections];
      }
    });
  }, []);

  // Clear all selections
  const clearProjectSelections = useCallback(() => {
    setSelectedProjects([]);
  }, []);

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

export function useProjectsByMonthOptimized() {
  const { getData, isLoading, invalidateCache, prefetch } = useCache<Project[], [number]>(
    'projectsByMonth', 
    async (month: number) => {
      // logger.debug(`Fetching projects for month ${month}`);
      try {
        const result = await fetchProjectsByMonthOptimized(month);
        // logger.debug(`Successfully fetched ${result.length} projects for month ${month}`);
        return result;
      } catch (err) {
        logger.error(`Error fetching projects for month ${month}:`, err);
        throw err;
      }
    },
    {
      expireAfter: 10 * 60 * 1000, // 10 minutes
      staleAfter: 2 * 60 * 1000,   // 2 minutes
    }
  );

  // Prefetch adjacent months for better UX
  const prefetchAdjacentMonths = useCallback((currentMonth: number) => {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    
    prefetch(prevMonth);
    prefetch(nextMonth);
  }, [prefetch]);

  return {
    getProjectsByMonth: getData,
    isLoading,
    invalidateCache,
    prefetchAdjacentMonths
  };
}