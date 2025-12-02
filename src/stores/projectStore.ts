/**
 * Project Store - Zustand state management for projects
 *
 * Replaces the project-related state from AppStateContext
 * with a more scalable, type-safe solution.
 *
 * Install: npm install zustand
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

// Types
export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'planned' | 'active' | 'completed' | 'archived' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date?: string;
  end_date?: string;
  venue_address?: string;
  color?: string;
  crew_count?: number;
  filled_positions?: number;
  working_hours_start?: string;
  working_hours_end?: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectFilters {
  status?: Project['status'] | 'all';
  priority?: Project['priority'] | 'all';
  search?: string;
  dateRange?: { start: Date; end: Date };
  companyId?: string;
}

interface ProjectState {
  // Data
  projects: Project[];
  selectedProject: Project | null;
  filters: ProjectFilters;

  // UI State
  isLoading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list' | 'kanban';

  // Actions
  fetchProjects: (year?: number, month?: number) => Promise<void>;
  fetchProjectById: (id: string) => Promise<Project | null>;
  createProject: (project: Partial<Project>) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;

  // Selection
  selectProject: (project: Project | null) => void;

  // Filters
  setFilters: (filters: Partial<ProjectFilters>) => void;
  clearFilters: () => void;

  // UI
  setViewMode: (mode: 'grid' | 'list' | 'kanban') => void;
  setError: (error: string | null) => void;
}

// Default filter state
const defaultFilters: ProjectFilters = {
  status: 'all',
  priority: 'all',
  search: '',
};

export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        projects: [],
        selectedProject: null,
        filters: defaultFilters,
        isLoading: false,
        error: null,
        viewMode: 'grid',

        // Fetch all projects (optionally filtered by year/month)
        fetchProjects: async (year?: number, month?: number) => {
          set({ isLoading: true, error: null });

          try {
            let query = supabase
              .from('projects')
              .select('*')
              .order('start_date', { ascending: false });

            // Filter by date range if provided
            if (year && month !== undefined) {
              const startDate = new Date(year, month, 1);
              const endDate = new Date(year, month + 1, 0);
              query = query
                .gte('start_date', startDate.toISOString())
                .lte('start_date', endDate.toISOString());
            }

            const { data, error } = await query;

            if (error) throw error;

            set({ projects: data || [], isLoading: false });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch projects';
            set({ error: message, isLoading: false });
          }
        },

        // Fetch a single project by ID
        fetchProjectById: async (id: string) => {
          try {
            const { data, error } = await supabase
              .from('projects')
              .select('*')
              .eq('id', id)
              .single();

            if (error) throw error;

            return data;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch project';
            set({ error: message });
            return null;
          }
        },

        // Create a new project
        createProject: async (project: Partial<Project>) => {
          set({ isLoading: true, error: null });

          try {
            const { data, error } = await supabase
              .from('projects')
              .insert(project)
              .select()
              .single();

            if (error) throw error;

            // Add to local state
            set((state) => ({
              projects: [data, ...state.projects],
              isLoading: false,
            }));

            return data;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create project';
            set({ error: message, isLoading: false });
            return null;
          }
        },

        // Update an existing project
        updateProject: async (id: string, updates: Partial<Project>) => {
          set({ isLoading: true, error: null });

          try {
            const { data, error } = await supabase
              .from('projects')
              .update(updates)
              .eq('id', id)
              .select()
              .single();

            if (error) throw error;

            // Update local state
            set((state) => ({
              projects: state.projects.map((p) => (p.id === id ? data : p)),
              selectedProject: state.selectedProject?.id === id ? data : state.selectedProject,
              isLoading: false,
            }));

            return true;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update project';
            set({ error: message, isLoading: false });
            return false;
          }
        },

        // Delete a project
        deleteProject: async (id: string) => {
          set({ isLoading: true, error: null });

          try {
            const { error } = await supabase
              .from('projects')
              .delete()
              .eq('id', id);

            if (error) throw error;

            // Remove from local state
            set((state) => ({
              projects: state.projects.filter((p) => p.id !== id),
              selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
              isLoading: false,
            }));

            return true;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete project';
            set({ error: message, isLoading: false });
            return false;
          }
        },

        // Select a project
        selectProject: (project) => set({ selectedProject: project }),

        // Set filters
        setFilters: (filters) =>
          set((state) => ({
            filters: { ...state.filters, ...filters },
          })),

        // Clear all filters
        clearFilters: () => set({ filters: defaultFilters }),

        // Set view mode
        setViewMode: (viewMode) => set({ viewMode }),

        // Set error
        setError: (error) => set({ error }),
      }),
      {
        name: 'baito-project-store',
        partialize: (state) => ({
          viewMode: state.viewMode,
          filters: state.filters,
        }),
      }
    ),
    { name: 'ProjectStore' }
  )
);

// Selector hooks for optimized re-renders
export const useProjects = () => useProjectStore((state) => state.projects);
export const useSelectedProject = () => useProjectStore((state) => state.selectedProject);
export const useProjectFilters = () => useProjectStore((state) => state.filters);
export const useProjectLoading = () => useProjectStore((state) => state.isLoading);
export const useProjectError = () => useProjectStore((state) => state.error);

// Filtered projects selector
export const useFilteredProjects = () =>
  useProjectStore((state) => {
    const { projects, filters } = state;

    return projects.filter((project) => {
      // Status filter
      if (filters.status && filters.status !== 'all' && project.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority && filters.priority !== 'all' && project.priority !== filters.priority) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = project.title?.toLowerCase().includes(searchLower);
        const matchesDescription = project.description?.toLowerCase().includes(searchLower);
        const matchesVenue = project.venue_address?.toLowerCase().includes(searchLower);

        if (!matchesTitle && !matchesDescription && !matchesVenue) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        const projectDate = project.start_date ? new Date(project.start_date) : null;
        if (projectDate) {
          if (projectDate < filters.dateRange.start || projectDate > filters.dateRange.end) {
            return false;
          }
        }
      }

      // Company filter
      if (filters.companyId && project.company_id !== filters.companyId) {
        return false;
      }

      return true;
    });
  });
