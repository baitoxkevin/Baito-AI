import './App.css';
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { AppStateProvider } from './contexts/AppStateContext';
import LoginPage from './pages/LoginPage';
import MainAppLayout from './components/MainAppLayout';
import { EnhancedToaster } from './components/ui/enhanced-toaster';
// StaticCandidateUpdatePage was removed
import ReceiptScannerPage from './pages/ReceiptScannerPage';
import MobileCandidateUpdatePage from './pages/MobileCandidateUpdatePage';
import CandidateDashboardPage from './pages/CandidateDashboardPage';
import JobDiscoveryPage from './pages/JobDiscoveryPage'; // Added
import SetPasswordPage from './pages/SetPasswordPage';
import LocationFeatureDemo from './pages/LocationFeatureDemo';
import DatePickerTestPage from './pages/DatePickerTestPage';
import AmountInputTestPage from './pages/AmountInputTestPage';
import StaffDashboardPage from './pages/StaffDashboardPage';
import ReportSickLeavePage from './pages/ReportSickLeavePage';
import SickLeaveApprovalPage from './pages/SickLeaveApprovalPage';
import { renderCanvas } from './components/ui/canvas';
import { SpotlightCommand } from './components/SpotlightCommand';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { ChatWidget } from './components/ai-assistant/ChatWidget';
import { NotificationBell } from './components/NotificationBell';
import { useAppState } from './contexts/AppStateContext';

// Redirect component for dynamic project ID
function ProjectRedirect() {
  const { projectId } = useParams();
  return <Navigate to={`/projects/${projectId}`} replace />;
}

function AppContent() {
  const { currentUser } = useAppState();
  const [effectActive, setEffectActive] = useState(false);
  const spacebarCount = useRef(0);
  const location = useLocation();

  // Check if current route is login or public route
  const isPublicRoute = location.pathname === '/login' ||
                        location.pathname === '/set-password' ||
                        location.pathname.includes('/candidate-update') ||
                        location.pathname.includes('/candidate/');
  
  useEffect(() => {
    // Function to handle keydown events for the spacebar trigger
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept spacebar if user is typing in an input field
      const activeElement = document.activeElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );
      
      if (isTyping) {
        return; // Let the spacebar work normally in input fields
      }
      
      if (e.code === 'Space') {
        spacebarCount.current += 1;
        
        // Check if spacebar was pressed 5 times in quick succession
        if (spacebarCount.current === 5) {
          setEffectActive(prevState => !prevState);
          spacebarCount.current = 0; // Reset counter
        }
        
        // Reset counter after 2 seconds if not reached 5 presses
        setTimeout(() => {
          if (spacebarCount.current < 5) {
            spacebarCount.current = 0;
          }
        }, 2000);
      }
    };
    
    // Function to handle custom navigation events 
    const handleNavigation = (e: CustomEvent) => {
      const { path, tool } = e.detail;
      if (path === '/tools') {
        // Store the active tool in session storage for ToolsPage to pick up
        if (tool) {
          sessionStorage.setItem('activeToolComponent', tool);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('navigate', handleNavigation as EventListener);
    
    // Only initialize canvas when effect is active
    if (effectActive) {
      renderCanvas();
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('navigate', handleNavigation as EventListener);
    };
  }, [effectActive]);

  return (
    <BrowserRouter>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />
      <Route path="/receipt-scanner" element={<ReceiptScannerPage />} />
      <Route path="/job-discovery" element={<JobDiscoveryPage />} /> {/* Added Route */}
      <Route path="/staff-dashboard" element={<StaffDashboardPage />} />
      <Route path="/report-sick-leave" element={<ReportSickLeavePage />} />
      <Route path="/sick-leave/pending" element={<SickLeaveApprovalPage />} />
      <Route path="/location-feature-demo" element={<LocationFeatureDemo />} />
      {/* Candidate update routes with secure token */}
      <Route path="/candidate-update-mobile/:candidateId" element={<MobileCandidateUpdatePage />} />
      <Route path="/candidate/dashboard/:candidateId" element={<CandidateDashboardPage />} />
      <Route path="/candidate-form/:token" element={<Navigate to="/login" replace />} />
      <Route path="/candidate/:token" element={<Navigate to="/login" replace />} />
      <Route
        path="/dashboard"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      {/* Routes that work both in localhost and production */}
      {/* Redirect from singular /project to plural /projects */}
      <Route path="/project" element={<Navigate to="/projects" replace />} />
      <Route path="/project/:projectId" element={<ProjectRedirect />} />
      <Route
        path="/projects"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route
        path="/projects/:projectId"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route
        path="/calendar"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route
        path="/calendar/list"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route
        path="/calendar/view"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route
        path="/calendar/dashboard"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route
        path="/tools"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route
        path="/invites"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route
        path="/candidates"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route
        path="/candidates/ui-comparison"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route
        path="/team"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route
        path="/settings"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route
        path="/date-picker-test"
        element={<DatePickerTestPage />}
      />
      <Route
        path="/amount-input-test"
        element={<AmountInputTestPage />}
      />
      <Route
        path="/payments"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route
        path="/goals"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route
        path="/expenses"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route
        path="/warehouse"
        element={<MainAppLayout effectActive={effectActive} />}
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      {/* Catch-all route for 404s - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <SpotlightCommand />
      <EnhancedToaster />
      {/* AI Chat Widget - only show when user is logged in AND not on public routes */}
      {!isPublicRoute && currentUser && <ChatWidget userId={currentUser.id} />}
      {/* Notification Bell - only show when user is logged in AND not on public routes */}
      {!isPublicRoute && currentUser && (
        <div className="fixed top-4 right-20 z-50">
          <NotificationBell userId={currentUser.id} />
        </div>
      )}
    </BrowserRouter>
  );
}

function App() {
  return (
    <GlobalErrorBoundary>
      <AppStateProvider>
        <AppContent />
      </AppStateProvider>
    </GlobalErrorBoundary>
  );
}

export default App;