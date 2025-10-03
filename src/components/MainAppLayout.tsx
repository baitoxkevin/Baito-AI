import React, { useState, useEffect, Suspense, lazy, useMemo, memo } from 'react';
import { useParams, useLocation, Navigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import SidebarAdapter from '@/components/SidebarAdapter';
import { WavesBackground } from '@/components/ui/waves-background';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

import { logger } from '../lib/logger';
// Import pages
import DashboardPage from '@/pages/DashboardPage';
import CalendarPage from '@/pages/CalendarPage';
import ToolsPage from '@/pages/ToolsPage';
import ProjectsPageRedesign from '@/pages/ProjectsPageRedesign';
import InvitesPage from '@/pages/InvitesPage';
import CandidatesPage from '@/pages/CandidatesPage';
import SettingsPage from '@/pages/SettingsPage';
import TeamManagementPage from '@/pages/TeamManagementPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import PaymentsPage from '@/pages/PaymentsPage';
import GoalsPage from '@/pages/GoalsPage';
import ExpenseClaimsPage from '@/pages/ExpenseClaimsPage';
import WarehousePage from '@/pages/WarehousePage';

interface MainAppLayoutProps {
  effectActive: boolean;
}

const MainAppLayout = memo(({ effectActive }: MainAppLayoutProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const params = useParams();
  const projectId = params.projectId;
  const location = useLocation();
  const { theme } = useTheme();

  // Determine active view based on the current route - memoized
  const activeView = useMemo(() => {
    const pathname = location.pathname;

    if (projectId) return 'project-detail';
    if (pathname.startsWith('/dashboard')) return 'dashboard';
    if (pathname.startsWith('/projects')) return 'projects';
    if (pathname.startsWith('/calendar')) return 'calendar';
    if (pathname.startsWith('/candidates')) return 'candidates';
    if (pathname.startsWith('/tools')) return 'tools';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/team')) return 'team';
    if (pathname.startsWith('/invites')) return 'invites';
    if (pathname.startsWith('/payments')) return 'payments';
    if (pathname.startsWith('/goals')) return 'goals';
    if (pathname.startsWith('/expenses')) return 'expenses';
    if (pathname.startsWith('/warehouse')) return 'warehouse';

    return 'dashboard'; // default
  }, [location.pathname, projectId]);


  useEffect(() => {
    let isMounted = true;
    let authCheckTimeout: NodeJS.Timeout;

    const checkAuth = async () => {
      try {
        logger.info('🔍 Starting auth check in MainAppLayout');

        // CRITICAL: Small delay to allow LoginPage to complete navigation
        // This prevents race condition where MainAppLayout mounts before session is ready
        await new Promise(resolve => setTimeout(resolve, 50));

        // CRITICAL: Check localStorage directly first (same as LoginPage)
        // This is more reliable than getSession() which depends on Supabase's internal state
        const checkLocalStorage = () => {
          try {
            const stored = localStorage.getItem('baito-auth');
            if (stored) {
              const parsed = JSON.parse(stored);
              // Check both access_token and session validity
              if (parsed?.access_token) {
                logger.info('✅ Valid session found in localStorage');
                return true;
              }
            }
          } catch (e) {
            logger.warn('⚠️ Error reading localStorage:', e);
          }
          return false;
        };

        // First quick check - localStorage is fastest
        if (checkLocalStorage()) {
          logger.info('✅ Session found in localStorage immediately');
          if (isMounted) {
            setIsAuthenticated(true);
          }
          return;
        }

        // Also try getSession() API as fallback
        const session = await getSession();
        if (!isMounted) return;

        if (session) {
          logger.info('✅ Session found via getSession() API');
          setIsAuthenticated(true);
          return;
        }

        // If neither found session, implement patient retry strategy
        // LoginPage can take up to 500ms to write to storage in production
        // Poll every 100ms for up to 8 seconds (increased for slower connections)
        logger.info('⏳ No session found, starting polling strategy...');
        const maxAttempts = 80; // 80 * 100ms = 8 seconds
        let attempts = 0;

        while (attempts < maxAttempts && isMounted) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;

          // Check localStorage first (faster and more reliable)
          if (checkLocalStorage()) {
            logger.info(`✅ Session found in localStorage after ${attempts * 100}ms`);
            if (isMounted) {
              setIsAuthenticated(true);
            }
            return;
          }

          // Fallback to API check every 500ms (5 attempts)
          if (attempts % 5 === 0) {
            const retrySession = await getSession();
            if (!isMounted) return;

            if (retrySession) {
              logger.info(`✅ Session found via API after ${attempts * 100}ms`);
              setIsAuthenticated(true);
              return;
            }
          }
        }

        // After all retries exhausted, mark as not authenticated
        if (isMounted) {
          logger.warn('❌ No session found after polling - redirecting to login');
          setIsAuthenticated(false);
        }
      } catch (error) {
        logger.error('❌ Auth check failed with error:', error);
        if (isMounted) {
          setIsAuthenticated(false);
        }
      }
    };

    // Set a maximum timeout for auth check (12 seconds)
    // Must be longer than the 8s polling period to prevent premature redirect
    authCheckTimeout = setTimeout(() => {
      if (isMounted && isAuthenticated === null) {
        logger.warn('⚠️ Auth check timeout after 12s - redirecting to login');
        setIsAuthenticated(false);
      }
    }, 12000);

    checkAuth();

    // Auth state listener with defensive logic to prevent false logouts
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('🔔 Auth state change event:', event, 'Session exists:', !!session);

      if (!isMounted) return;

      // Handle explicit sign-in events
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        logger.info('✅ User authenticated via event:', event);
        setIsAuthenticated(true);
        return;
      }

      // CRITICAL: Be very defensive about SIGNED_OUT events
      // Only log out if we can confirm there's truly no session
      if (event === 'SIGNED_OUT') {
        logger.warn('⚠️ SIGNED_OUT event received - verifying...');

        // Double-check localStorage before logging out
        try {
          const stored = localStorage.getItem('baito-auth');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.access_token) {
              logger.info('✅ Session still exists in localStorage - ignoring SIGNED_OUT');
              return;
            }
          }
        } catch (e) {
          logger.warn('Error checking localStorage during SIGNED_OUT');
        }

        // Triple-check by querying session directly
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!currentSession) {
          logger.warn('🚪 Confirmed no session - logging out');
          setIsAuthenticated(false);
        } else {
          logger.info('✅ Session still exists via API - ignoring SIGNED_OUT event');
        }
        return;
      }

      // Explicitly ignore INITIAL_SESSION - it's handled by checkAuth()
      // This prevents race conditions where INITIAL_SESSION fires before session is ready
      if (event === 'INITIAL_SESSION') {
        logger.info('📋 INITIAL_SESSION event ignored - checkAuth() handles this');
        return;
      }
    });

    // Cleanup on unmount
    return () => {
      isMounted = false;
      clearTimeout(authCheckTimeout);
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return <div className="route-transition-spinner">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary"></div>
    </div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center">
      {/* Background waves effect - always visible */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <WavesBackground
          lineColor={theme === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"}
          backgroundColor="transparent"
          waveSpeedX={0.02}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={15}
          yGap={30}
        />
      </div>

      {/* Special effect triggered by pressing space 5 times */}
      <div
        id="canvas-container"
        className={`absolute inset-0 z-50 ${effectActive ? 'block' : 'hidden'}`}
        style={{ pointerEvents: 'none' }}
      >
        <canvas
          className="w-full h-full"
          id="canvas"
        ></canvas>
      </div>
      <div className="w-full h-screen flex items-center justify-center p-2 sm:p-4 md:p-8">
        <SidebarAdapter>
          {/* Conditionally render only the active view for better performance */}
          {activeView === 'dashboard' && (
            <div style={{ height: '100%' }}>
              <DashboardPage />
            </div>
          )}
          {activeView === 'calendar' && (
            <div style={{ height: '100%' }}>
              <CalendarPage key="calendar-page" />
            </div>
          )}
          {activeView === 'tools' && (
            <div style={{ height: '100%' }}>
              <ToolsPage />
            </div>
          )}
          {activeView === 'projects' && (
            <div style={{ height: '100%' }}>
              <ProjectsPageRedesign />
            </div>
          )}
          {activeView === 'invites' && (
            <div style={{ height: '100%' }}>
              <InvitesPage />
            </div>
          )}
          {activeView === 'candidates' && (
            <div style={{ height: '100%' }}>
              <CandidatesPage />
            </div>
          )}
          {activeView === 'settings' && (
            <div style={{ height: '100%' }}>
              <SettingsPage />
            </div>
          )}
          {activeView === 'team' && (
            <div style={{ height: '100%' }}>
              <TeamManagementPage />
            </div>
          )}
          {activeView === 'payments' && (
            <div style={{ height: '100%' }}>
              <PaymentsPage />
            </div>
          )}
          {activeView === 'goals' && (
            <div style={{ height: '100%' }}>
              <GoalsPage />
            </div>
          )}
          {activeView === 'expenses' && (
            <div style={{ height: '100%' }}>
              <ExpenseClaimsPage />
            </div>
          )}
          {activeView === 'warehouse' && (
            <div style={{ height: '100%' }}>
              <WarehousePage />
            </div>
          )}
          {activeView === 'project-detail' && projectId && (
            <div style={{ height: '100%' }}>
              <ProjectDetailPage />
            </div>
          )}
        </SidebarAdapter>
      </div>

      {/* Quick auth check widget - disabled */}
      {/* {import.meta.env.DEV && <QuickAuthCheck />} */}
    </div>
  );
});

export default MainAppLayout;