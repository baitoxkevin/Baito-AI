import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogIn, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signIn } from '@/lib/auth';
import { Toaster } from '@/components/ui/toaster';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (isLoading || !email || !password) return;
    // Clear any previous error
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const { user } = await signIn(email, password);
      
      if (user) {
        // Show success toast
        toast({
          title: 'Success',
          description: 'Signed in successfully!',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      
      // Get error message
      const message = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
      
      // Set error message for inline display
      setErrorMsg(message);
      
      // Also show toast notification
      toast({
        title: 'Authentication Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-4">
      {/* Add Toaster component to display toast notifications */}
      <Toaster />
      
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">Project Manager</h1>
          <p className="text-gray-500 dark:text-gray-400">Sign in to continue</p>
        </div>
        <Card className="border-none shadow-lg w-full">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-500" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-500" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              {/* Display error message if there is one */}
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mt-2">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errorMsg}
                  </p>
                </div>
              )}
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <div className="border-t w-full pt-4 mt-2">
              <p className="text-sm text-center text-gray-500 mt-2">
                For testing, use:<br />
                <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">test@example.com / password123</span>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}