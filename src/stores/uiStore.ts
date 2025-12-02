/**
 * UI Store - Zustand state management for UI state
 *
 * Handles global UI state like sidebar, modals, toasts,
 * and other visual preferences.
 *
 * Install: npm install zustand
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface Modal {
  id: string;
  component: string;
  props?: Record<string, unknown>;
}

export interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Modals
  activeModals: Modal[];

  // Toasts
  toasts: Toast[];

  // Mobile
  isMobile: boolean;
  mobileMenuOpen: boolean;

  // Quick Add Dialog
  quickAddOpen: boolean;
  quickAddType: 'project' | 'candidate' | 'expense' | null;

  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  openModal: (modal: Modal) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  setMobile: (isMobile: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;

  openQuickAdd: (type: 'project' | 'candidate' | 'expense') => void;
  closeQuickAdd: () => void;

  setGlobalLoading: (loading: boolean, message?: string) => void;
}

// Generate unique ID for toasts
const generateId = () => Math.random().toString(36).substring(2, 9);

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        sidebarOpen: true,
        sidebarCollapsed: false,
        theme: 'system',
        activeModals: [],
        toasts: [],
        isMobile: false,
        mobileMenuOpen: false,
        quickAddOpen: false,
        quickAddType: null,
        globalLoading: false,
        loadingMessage: null,

        // Sidebar actions
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

        // Theme actions
        setTheme: (theme) => set({ theme }),

        // Modal actions
        openModal: (modal) =>
          set((state) => ({
            activeModals: [...state.activeModals, modal],
          })),
        closeModal: (id) =>
          set((state) => ({
            activeModals: state.activeModals.filter((m) => m.id !== id),
          })),
        closeAllModals: () => set({ activeModals: [] }),

        // Toast actions
        addToast: (toast) => {
          const id = generateId();
          set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
          }));

          // Auto-remove after duration
          const duration = toast.duration || 5000;
          setTimeout(() => {
            get().removeToast(id);
          }, duration);

          return id;
        },
        removeToast: (id) =>
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          })),
        clearToasts: () => set({ toasts: [] }),

        // Mobile actions
        setMobile: (isMobile) => set({ isMobile }),
        toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
        setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

        // Quick Add actions
        openQuickAdd: (type) => set({ quickAddOpen: true, quickAddType: type }),
        closeQuickAdd: () => set({ quickAddOpen: false, quickAddType: null }),

        // Global loading
        setGlobalLoading: (loading, message) =>
          set({ globalLoading: loading, loadingMessage: message || null }),
      }),
      {
        name: 'baito-ui-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

// Selector hooks for optimized re-renders
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen);
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed);
export const useTheme = () => useUIStore((state) => state.theme);
export const useIsMobile = () => useUIStore((state) => state.isMobile);
export const useGlobalLoading = () => useUIStore((state) => ({
  loading: state.globalLoading,
  message: state.loadingMessage,
}));
export const useQuickAdd = () => useUIStore((state) => ({
  open: state.quickAddOpen,
  type: state.quickAddType,
}));
