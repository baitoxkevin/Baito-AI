import './App.css';
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppStateProvider } from './contexts/AppStateContext';
import LoginPage from './pages/LoginPage';
import MainAppLayout from './components/MainAppLayout';
import { EnhancedToaster } from './components/ui/enhanced-toaster';
// StaticCandidateUpdatePage was removed
import ReceiptScannerPage from './pages/ReceiptScannerPage';
import TestPage from './pages/TestPage';
import IntegratedStaffingPayrollDemo from './pages/IntegratedStaffingPayrollDemo';
import PaymentQueueDemo from './pages/PaymentQueueDemo';
import MobileCandidateUpdatePage from './pages/MobileCandidateUpdatePage';
import { renderCanvas } from './components/ui/canvas';
import { SpotlightCommand } from './components/SpotlightCommand';

function App() {
  const [effectActive, setEffectActive] = useState(false);
  const spacebarCount = useRef(0);
  
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
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/receipt-scanner" element={<ReceiptScannerPage />} />
          <Route path="/test-button" element={<TestPage />} />
          {/* Candidate update routes with secure token */}
          <Route path="/candidate-update-mobile/:candidateId" element={<MobileCandidateUpdatePage />} />
          <Route path="/candidate-form/:token" element={<Navigate to="/login" replace />} />
          <Route path="/candidate/:token" element={<Navigate to="/login" replace />} />
          <Route 
            path="/dashboard" 
            element={<MainAppLayout effectActive={effectActive} />} 
          />
          <Route 
            path="/staffing-payroll-demo" 
            element={<IntegratedStaffingPayrollDemo />} 
          />
          <Route 
            path="/payment-queue" 
            element={<PaymentQueueDemo />} 
          />
          {/* Routes that work both in localhost and production */}
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
            path="/payments" 
            element={<MainAppLayout effectActive={effectActive} />} 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <SpotlightCommand />
        <EnhancedToaster />
      </BrowserRouter>
    </AppStateProvider>
  );
}

export default App;