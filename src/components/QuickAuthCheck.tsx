import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User } from 'lucide-react';

export default function QuickAuthCheck() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully."
      });
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) return null;

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 max-w-xs">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {currentUser.email}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ID: {currentUser.id.substring(0, 8)}...
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSignOut}
          className="flex-shrink-0"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}