import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

export function LoginPage() {
  // Login page is rendered outside main app container by default due to routing setup
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please fill in all required fields"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (authError || !authData.user) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Please verify your credentials"
        });
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, raw_user_meta_data')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Please verify your credentials"
        });
        return;
      }

      // Direct routing based on super admin status
      if (userData?.raw_user_meta_data?.is_super_admin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome to BaitoAI</CardTitle>
          <CardDescription>
            Internal access only - Please sign in with your credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "w-full",
                  !email && "border-destructive"
                )}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "w-full",
                  !password && "border-destructive"
                )}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full font-semibold"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
