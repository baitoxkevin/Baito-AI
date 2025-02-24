import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import type { Session } from '@supabase/supabase-js';

// Add global styles
import '../index.css';

export function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  // Using sonner toast directly

  useEffect(() => {
    document.title = 'Login - BaitoAI';
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Attempting login...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      console.log('Auth response:', { authData, authError });

      if (authError || !authData.user) {
        toast.error("Access denied. Please verify your credentials");
        setIsLoading(false);
        return;
      }

      console.log('Fetching user data...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, raw_user_meta_data')
        .eq('id', authData.user.id)
        .single();

      console.log('User data:', { userData, userError });

      if (userError) {
        toast.error("Access denied. Please verify your credentials");
        setIsLoading(false);
        return;
      }

      // Direct routing based on super admin status
      if (userData?.raw_user_meta_data?.is_super_admin) {
        console.log('Redirecting to admin...');
        navigate('/admin', { replace: true });
      } else {
        console.log('Redirecting to home...');
        navigate('/', { replace: true });
      }
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <Card className="w-[400px] shadow-lg border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-foreground">Welcome to BaitoAI</CardTitle>
          <CardDescription className="text-muted-foreground">
            Internal access only - Please sign in with your credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "w-full bg-background text-foreground",
                  !email && "border-destructive"
                )}
                required
                data-devinid="email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "w-full bg-background text-foreground",
                  !password && "border-destructive"
                )}
                required
                data-devinid="password-input"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !email || !password}
              data-devinid="login-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
