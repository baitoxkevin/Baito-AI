/**
 * Auth Store - Zustand state management for authentication
 *
 * Handles user authentication state, session management,
 * and user profile data.
 *
 * Install: npm install zustand
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

// Types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'manager' | 'staff' | 'candidate';
  is_super_admin?: boolean;
  company_id?: string;
  created_at?: string;
}

export interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithMagicLink: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;

  // Internal
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      // Initialize auth state from Supabase session
      initialize: async () => {
        set({ isLoading: true });

        try {
          // Get current session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) throw sessionError;

          if (session?.user) {
            // Fetch user profile from database
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const user: User = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: userData?.full_name || session.user.user_metadata?.full_name,
              avatar_url: userData?.avatar_url || session.user.user_metadata?.avatar_url,
              role: userData?.role || 'staff',
              is_super_admin: userData?.is_super_admin || false,
              company_id: userData?.company_id,
            };

            set({
              user,
              session,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to initialize auth';
          set({ error: message, isLoading: false });
        }

        // Set up auth state listener
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const user: User = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: userData?.full_name,
              avatar_url: userData?.avatar_url,
              role: userData?.role || 'staff',
              is_super_admin: userData?.is_super_admin || false,
              company_id: userData?.company_id,
            };

            set({ user, session, isAuthenticated: true });
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, session: null, isAuthenticated: false });
          } else if (event === 'TOKEN_REFRESHED' && session) {
            set({ session });
          }
        });
      },

      // Sign in with email and password
      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sign in failed';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      // Sign in with magic link
      signInWithMagicLink: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) throw error;

          set({ isLoading: false });
          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to send magic link';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      // Sign out
      signOut: async () => {
        set({ isLoading: true });

        try {
          await supabase.auth.signOut();
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sign out failed';
          set({ error: message, isLoading: false });
        }
      },

      // Refresh session
      refreshSession: async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) throw error;
          if (data.session) {
            set({ session: data.session });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Session refresh failed';
          set({ error: message });
        }
      },

      // Update user profile
      updateProfile: async (updates: Partial<User>) => {
        const { user } = get();
        if (!user) return false;

        try {
          const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id);

          if (error) throw error;

          set({ user: { ...user, ...updates } });
          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Profile update failed';
          set({ error: message });
          return false;
        }
      },

      // Internal setters
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session }),
      setError: (error) => set({ error }),
    }),
    { name: 'AuthStore' }
  )
);

// Selector hooks for optimized re-renders
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);

// Role-based selectors
export const useIsAdmin = () => useAuthStore((state) =>
  state.user?.role === 'admin' || state.user?.is_super_admin
);
export const useIsSuperAdmin = () => useAuthStore((state) => state.user?.is_super_admin);
export const useUserRole = () => useAuthStore((state) => state.user?.role);
