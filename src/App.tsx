import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LoginPage } from '@/pages/LoginPage';
import { TestColorPicker } from '@/pages/TestColorPicker';
import Sidebar from '@/components/Sidebar';
import ProjectsPage from '@/components/ProjectsPage';
import CalendarPage from '@/components/CalendarPage';
import TodoPage from '@/components/TodoPage';
import AdminPage from '@/components/AdminPage';
import CandidatesPage from '@/components/CandidatesPage';
import CandidateProfile from '@/components/CandidateProfile';
import EmailPage from '@/components/EmailPage';
import DocumentsPage from '@/components/DocumentsPage';
import AIAssistant from '@/components/AIAssistant';
import { LogOut as LogOutIcon } from 'lucide-react';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.split('/')[1] || 'dashboard';

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        if (window.location.pathname !== '/login') {
          navigate('/login');
        }
        setHasAdminAccess(false);
        setIsSuperAdmin(false);
      } else {
        await checkAdminStatus();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminStatus = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role, is_super_admin')
          .eq('id', authUser.id)
          .single();

        if (error) throw error;
        
        const isAdmin = userData?.role === 'admin';
        const superAdmin = userData?.is_super_admin === true;
        
        setHasAdminAccess(isAdmin || superAdmin);
        setIsSuperAdmin(superAdmin);

        if (!isAdmin && !superAdmin && window.location.pathname === '/admin') {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/login');
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <NotificationProvider>
        {location.pathname === '/login' ? (
          <LoginPage />
        ) : (
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <header className="h-16 border-b bg-card flex items-center justify-between px-6">
                <h1 className="text-xl font-semibold capitalize">{activeTab}</h1>
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOutIcon className="h-5 w-5" />
                  </Button>
                </div>
              </header>

              <main className="flex-1 overflow-auto p-6">
                <Routes>
                  <Route path="/" element={<ProjectsPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/test-color-picker" element={<TestColorPicker />} />
                  <Route path="/todo" element={<TodoPage />} />
                  {(hasAdminAccess || isSuperAdmin) && <Route path="/admin" element={<AdminPage isSuperAdmin={isSuperAdmin} />} />}
                  <Route path="/candidates" element={<CandidatesPage />} />
                  <Route path="/candidates/:id" element={<CandidateProfile />} />
                  <Route path="/email" element={<EmailPage />} />
                  <Route path="/documents" element={<DocumentsPage />} />
                </Routes>
              </main>
            </div>
          </div>
        )}

        <AIAssistant />
        <Toaster />
      </NotificationProvider>
    </div>
    );
}
