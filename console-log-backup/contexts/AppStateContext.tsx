import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { fetchProjectsOptimized, fetchProjectsByMonthOptimized, deleteMultipleProjectsOptimized } from '@/lib/optimized-queries';
import { createProject, updateProject, deleteProject } from '@/lib/projects';
import type { Project } from '@/lib/types';
import { useCache } from '@/lib/cache-optimized';
import { useToast } from '@/hooks/use-toast';
import { getUser, getSession } from '@/lib/auth';

// Define the context shape
interface AppStateContextType {
  // Projects state
  projects: Project[];
  isLoadingProjects: boolean;
  selectedProjects: string[];
  
  // Project actions
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project>;
  removeProject: (id: string) => Promise<void>;
  removeMultipleProjects: (projectIds: string[]) => Promise<{ success: string[], failed: string[] }>;
  refreshProjects: () => Promise<void>;
  toggleProjectSelection: (projectId: string) => void;
  selectAllProjects: (visibleProjectIds: string[]) => void;
  clearProjectSelections: () => void;
  
  // Projects by month
  getProjectsByMonth: (month: number) => Promise<Project[]>;
  isLoadingProjectsByMonth: boolean;
  prefetchAdjacentMonths: (currentMonth: number) => void;
  
  // User state
  currentUser: unknown; // Use proper user type if available
  isLoadingUser: boolean;
}

// Create context with default values
const AppStateContext = createContext<AppStateContextType>({
  projects: [],
  isLoadingProjects: false,
  selectedProjects: [],
  addProject: async () => ({ id: '', title: '', status: '', priority: '' } as Project),
  updateProject: async () => ({ id: '', title: '', status: '', priority: '' } as Project),
  removeProject: async () => {},
  removeMultipleProjects: async () => ({ success: [], failed: [] }),
  refreshProjects: async () => {},
  toggleProjectSelection: () => {},
  selectAllProjects: () => {},
  clearProjectSelections: () => {},
  getProjectsByMonth: async () => [],
  isLoadingProjectsByMonth: false,
  prefetchAdjacentMonths: () => {},
  currentUser: null,
  isLoadingUser: true,
});

// Provider component
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<unknown>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  
  const { toast } = useToast();

  // Cache setup for projects
  const {
    getData: getProjects,
    isLoading: isLoadingProjects,
    invalidateCache: invalidateProjectsCache
  } = useCache<Project[], []>(
    'projects',
    fetchProjectsOptimized,
    {
      expireAfter: 5 * 60 * 1000, // 5 minutes
      staleAfter: 1 * 60 * 1000,  // 1 minute
    }
  );

  // Cache setup for projects by month
  const {
    getData: getProjectsByMonth,
    isLoading: isLoadingProjectsByMonth,
    invalidateCache: invalidateMonthCache,
    prefetch
  } = useCache<Project[], [number]>(
    'projectsByMonth',
    fetchProjectsByMonthOptimized,
    {
      expireAfter: 10 * 60 * 1000, // 10 minutes
      staleAfter: 2 * 60 * 1000,   // 2 minutes
    }
  );

  // Load user data on initialization - but skip for public routes
  useEffect(() => {
    // Skip user authentication for specific public routes 
    const isPublicRoute = window.location.pathname.includes('/candidate-update/');
    
    if (isPublicRoute) {
      // console.log('Public route detected - skipping authentication');
      setIsLoadingUser(false);
      return;
    }
    
    const loadUser = async () => {
      try {
        setIsLoadingUser(true);
        const user = await getUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error loading user:', error);

        // Handle auth session missing error silently
        const errorMessage = String(error);
        if (errorMessage.includes('AuthSessionMissingError') ||
            errorMessage.includes('Auth session missing')) {
          // console.log('No authentication session found - user not logged in');
          setCurrentUser(null);
        }
        // Don't show toast for candidate-update routes or auth session missing errors
        else if (!isPublicRoute) {
          toast({
            title: 'Authentication Error',
            description: 'Failed to authenticate user. Please try logging in again.',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUser();
  }, [toast]);

  // Load projects when the component mounts - but skip for public routes
  useEffect(() => {
    // Skip projects loading for public routes
    const isPublicRoute = window.location.pathname.includes('/candidate-update/');
    
    if (isPublicRoute) {
      // console.log('Public route detected - skipping projects loading');
      return;
    }
    
    const loadProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Error loading projects:', error);
        // Only show toast for real errors, not for normal initialization issues
        if (error instanceof Error && !error.message.includes('no data available')) {
          toast({
            title: 'Data Load Error',
            description: 'Failed to load projects. Please try refreshing.',
            variant: 'destructive',
          });
        }
      }
    };

    loadProjects();
  }, [getProjects, toast]);

  // Function to create a new project
  const addProject = useCallback(async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newProject = await createProject(project);
      setProjects(prevProjects => [...prevProjects, newProject]);
      invalidateProjectsCache();
      invalidateMonthCache();
      
      toast({
        title: 'Project Created',
        description: `Successfully created project "${newProject.title}"`,
      });
      
      return newProject;
    } catch (error) {
      console.error('Error adding project:', error);
      
      toast({
        title: 'Creation Failed',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [invalidateProjectsCache, invalidateMonthCache, toast]);

  // Function to update a project
  const updateProjectData = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      const updatedProject = await updateProject(id, updates);
      setProjects(prevProjects =>
        prevProjects.map(project => (project.id === id ? updatedProject : project))
      );
      invalidateProjectsCache();
      invalidateMonthCache();
      
      // Only show toast for user-initiated updates, not automatic refreshes
      if (updates.modified_by) {
        toast({
          title: 'Project Updated',
          description: `Successfully updated "${updatedProject.title}"`,
        });
      }
      
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      
      toast({
        title: 'Update Failed',
        description: 'Failed to update project. Please try again.',
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [invalidateProjectsCache, invalidateMonthCache, toast]);

  // Function to delete a project
  const removeProject = useCallback(async (id: string) => {
    try {
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }
      
      await deleteProject(id, currentUser.id);
      setProjects(prevProjects => prevProjects.filter(project => project.id !== id));
      invalidateProjectsCache();
      invalidateMonthCache();
      
      toast({
        title: 'Project Deleted',
        description: 'Project has been successfully deleted',
      });
    } catch (error) {
      console.error('Error removing project:', error);
      
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [currentUser, invalidateProjectsCache, invalidateMonthCache, toast]);

  // Function to delete multiple projects efficiently
  const removeMultipleProjects = useCallback(async (projectIds: string[]) => {
    if (!projectIds.length) return { success: [], failed: [] };
    
    try {
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }
      
      const result = await deleteMultipleProjectsOptimized(projectIds, currentUser.id);
      
      // Remove successfully deleted projects from state
      if (result.success.length > 0) {
        setProjects(prevProjects => 
          prevProjects.filter(project => !result.success.includes(project.id))
        );
        // Clear selections after deletion
        setSelectedProjects([]);
        invalidateProjectsCache();
        invalidateMonthCache();
      }
      
      toast({
        title: 'Projects Deleted',
        description: `Successfully deleted ${result.success.length} projects` +
                    (result.failed.length ? `. Failed to delete ${result.failed.length} projects.` : ''),
      });
      
      return result;
    } catch (error) {
      console.error('Error removing multiple projects:', error);
      
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete projects. Please try again.',
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [currentUser, invalidateProjectsCache, invalidateMonthCache, toast]);

  // Function to refresh the projects list
  const refreshProjects = useCallback(async () => {
    try {
      invalidateProjectsCache();
      const data = await getProjects();
      setProjects(data);
      
      // Clear selections on refresh
      setSelectedProjects([]);
      
      toast({
        title: 'Refreshed',
        description: 'Projects list has been updated',
      });
    } catch (error) {
      console.error('Error refreshing projects:', error);
      
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh projects. Please try again.',
        variant: 'destructive',
      });
    }
  }, [getProjects, invalidateProjectsCache, toast]);

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

  // Prefetch adjacent months for better UX
  const prefetchAdjacentMonths = useCallback((currentMonth: number) => {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    
    prefetch(prevMonth);
    prefetch(nextMonth);
  }, [prefetch]);

  return (
    <AppStateContext.Provider 
      value={{
        // Projects state
        projects,
        isLoadingProjects,
        selectedProjects,
        
        // Project actions
        addProject,
        updateProject: updateProjectData,
        removeProject,
        removeMultipleProjects,
        refreshProjects,
        toggleProjectSelection,
        selectAllProjects,
        clearProjectSelections,
        
        // Projects by month
        getProjectsByMonth,
        isLoadingProjectsByMonth,
        prefetchAdjacentMonths,
        
        // User state
        currentUser,
        isLoadingUser,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

// Custom hook to use the app state
export const useAppState = () => useContext(AppStateContext);