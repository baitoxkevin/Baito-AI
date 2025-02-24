import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { supabase } from './lib/supabase';
import type { User } from './types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import './index.css';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current auth state
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (data) {
            setUser(data as User);
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
        toast.error('Authentication error');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          toast.success('Successfully signed in');
        }
        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUser(data as User);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Initialize Supabase auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          toast.success('Successfully signed in');
        }
        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUser(data as User);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route 
          path="/login" 
          element={
            loading ? (
              <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : user ? (
              <Navigate 
                to={user.raw_user_meta_data?.is_super_admin ? '/admin' : '/'} 
                replace 
              />
            ) : (
              <LoginPage />
            )
          } 
        />
        <Route
          path="/admin"
          element={
            loading ? (
              <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : user?.raw_user_meta_data?.is_super_admin ? (
              <div>Admin Dashboard</div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/"
          element={
            loading ? (
              <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : user ? (
              <div>Dashboard</div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </div>
  );
}
