import { useState, useEffect } from 'react';
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

const MainAppLayout = ({ effectActive }: MainAppLayoutProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const params = useParams();
  const projectId = params.projectId;
  const location = useLocation();
  const { theme } = useTheme();

  // Determine active view based on the current route
  const getActiveView = () => {
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
  };

  const activeView = getActiveView();


  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        logger.error('Auth check failed:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      } else if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
      }
    });

    // Cleanup listener on unmount
    return () => {
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
};

export default MainAppLayout;