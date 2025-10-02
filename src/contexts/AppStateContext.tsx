import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { fetchProjects, fetchProjectsByMonth, createProject, updateProject, deleteProject } from '@/lib/projects';
import type { Project } from '@/lib/types';
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
  
  // User state
  currentUser: any; // Use proper user type if available
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
  currentUser: null,
  isLoadingUser: true,
});

// Provider component
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  
  const { toast } = useToast();

  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingProjectsByMonth, setIsLoadingProjectsByMonth] = useState(false);

  // Simple data fetching functions
  const getProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const data = await fetchProjects();
      setProjects(data);
      return data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  const getProjectsByMonth = useCallback(async (month: number) => {
    setIsLoadingProjectsByMonth(true);
    try {
      const data = await fetchProjectsByMonth(month);
      return data;
    } catch (error) {
      console.error('Error fetching projects by month:', error);
      throw error;
    } finally {
      setIsLoadingProjectsByMonth(false);
    }
  }, []);

  // Load user data on initialization - but skip for public routes
  useEffect(() => {
    // Skip user authentication for specific public routes 
    const isPublicRoute = window.location.pathname.includes('/candidate-update/');
    
    if (isPublicRoute) {
      console.log('Public route detected - skipping authentication');
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
          console.log('No authentication session found - user not logged in');
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
      console.log('Public route detected - skipping projects loading');
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
      // Refresh projects data
      await getProjects();
      
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
  }, [getProjects, toast]);

  // Function to update a project
  const updateProjectData = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      const updatedProject = await updateProject(id, updates);
      setProjects(prevProjects =>
        prevProjects.map(project => (project.id === id ? updatedProject : project))
      );
      // Refresh projects data
      await getProjects();
      
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
  }, [getProjects, toast]);

  // Function to delete a project
  const removeProject = useCallback(async (id: string) => {
    try {
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }
      
      await deleteProject(id, currentUser.id);
      setProjects(prevProjects => prevProjects.filter(project => project.id !== id));
      // Refresh projects data
      await getProjects();
      
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
  }, [currentUser, getProjects, toast]);

  // Function to delete multiple projects efficiently
  const removeMultipleProjects = useCallback(async (projectIds: string[]) => {
    if (!projectIds.length) return { success: [], failed: [] };
    
    try {
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }
      
      // Delete projects one by one (simplified approach without optimization)
      const results = await Promise.allSettled(
        projectIds.map(id => deleteProject(id, currentUser.id))
      );
      
      const result = {
        success: projectIds.filter((_, index) => 
          results[index].status === 'fulfilled' && results[index].value === true
        ),
        failed: projectIds.filter((_, index) => 
          results[index].status === 'rejected' || results[index].value === false
        )
      };
      
      // Remove successfully deleted projects from state
      if (result.success.length > 0) {
        setProjects(prevProjects => 
          prevProjects.filter(project => !result.success.includes(project.id))
        );
        // Clear selections after deletion
        setSelectedProjects([]);
        await getProjects();
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
  }, [currentUser, getProjects, toast]);

  // Function to refresh the projects list
  const refreshProjects = useCallback(async () => {
    try {
      await getProjects();
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
  }, [getProjects, toast]);

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

  // Simplified approach without prefetching
  const prefetchAdjacentMonths = useCallback((currentMonth: number) => {
    // This is now a no-op since we removed caching
    console.log('Prefetching disabled for month', currentMonth);
  }, []);

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