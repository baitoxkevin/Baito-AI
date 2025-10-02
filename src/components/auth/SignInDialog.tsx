import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signIn, signUp, resetPassword } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignedIn?: () => void;
}

// Helper component for creating test accounts during development
function TestAccountButtons() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  
  const createTestAccounts = async () => {
    setIsCreating(true);
    
    try {
      const accounts = [
        { email: 'admin@baito.events', password: 'password123!!', role: 'super_admin', name: 'Kevin Baito Admin' },
        { email: 'admin@example.com', password: 'password123', role: 'super_admin', name: 'Admin User' },
        { email: 'manager@example.com', password: 'password123', role: 'manager', name: 'Manager User' },
        { email: 'staff@example.com', password: 'password123', role: 'staff', name: 'Staff User' }
      ];
      
      for (const account of accounts) {
        // Check if user exists
        const { data: existingUsers } = await supabase
          .from('users')
          .select('email')
          .eq('email', account.email)
          .maybeSingle();
          
        if (!existingUsers) {
          // Create auth user
          const { data, error } = await supabase.auth.signUp({
            email: account.email,
            password: account.password,
            options: {
              data: {
                full_name: account.name,
                role: account.role,
                is_super_admin: account.role === 'super_admin'
              }
            }
          });
          
          if (error) {
            console.error(`Error creating ${account.role} account:`, error);
            continue;
          }
          
          // Create user profile
          if (data.user) {
            const { error: profileError } = await supabase
              .from('users')
              .insert([{
                id: data.user.id,
                email: account.email,
                full_name: account.name,
                role: account.role,
                is_super_admin: account.role === 'super_admin',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }]);
              
            if (profileError) {
              console.error(`Error creating ${account.role} profile:`, profileError);
            }
          }
        }
      }
      
      toast({
        title: 'Test accounts created',
        description: 'Test accounts have been created or already exist',
      });
    } catch (error) {
      console.error('Error creating test accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test accounts',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center mb-2">
        <Info className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Development accounts:</span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={createTestAccounts}
          disabled={isCreating}
          className="text-xs h-8"
        >
          {isCreating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
          Create Test Accounts
        </Button>
        <div className="text-xs text-muted-foreground space-y-1">
          <div><span className="font-medium">Your Admin:</span> admin@baito.events / password123!!</div>
          <div><span className="font-medium">Test Admin:</span> admin@example.com / password123</div>
          <div><span className="font-medium">Manager:</span> manager@example.com / password123</div>
          <div><span className="font-medium">Staff:</span> staff@example.com / password123</div>
        </div>
      </div>
    </div>
  );
}

export default function SignInDialog({ open, onOpenChange, onSignedIn }: SignInDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(process.env.NODE_ENV !== 'production');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { toast } = useToast();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResettingPassword(true);
    setErrorMessage(null);
    
    // Basic validation
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      setIsResettingPassword(false);
      return;
    }
    
    try {
      await resetPassword(email);
      toast({
        title: 'Password reset email sent',
        description: 'Please check your email for instructions to reset your password.',
      });
      setIsForgotPassword(false);
      setEmail('');
      setErrorMessage(null);
    } catch (error) {
      console.error('Password reset error:', error);
      let message = 'An unexpected error occurred';
      
      if (error instanceof Error) {
        message = error.message;
        
        // More user-friendly error messages
        if (message.includes('Rate limit')) {
          message = 'Too many reset attempts. Please try again later.';
        }
      }
      
      setErrorMessage(message);
    } finally {
      setIsResettingPassword(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If in forgot password mode, handle that separately
    if (isForgotPassword) {
      handleForgotPassword(e);
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null); // Clear any previous errors

    // Basic validation
    if (!email.trim() || (!isForgotPassword && !password.trim())) {
      setErrorMessage(isForgotPassword ? 'Please enter your email address.' : 'Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Password strength validation
        if (password.length < 8) {
          setErrorMessage('Password must be at least 8 characters long.');
          setIsLoading(false);
          return;
        }
        
        const result = await signUp(email, password);
        
        if (result.user) {
          setIsSignUp(false);
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setErrorMessage(null);
          
          // Check if email confirmation is required
          if (result.user.identities && result.user.identities.length === 0) {
            toast({
              title: 'Account created',
              description: 'Please check your email to verify your account before signing in.',
            });
          } else {
            toast({
              title: 'Account created',
              description: 'Your account has been created successfully. You can now sign in.',
            });
          }
        }
      } else {
        const result = await signIn(email, password);
        
        if (result.user) {
          setErrorMessage(null);
          toast({
            title: 'Signed in successfully',
            description: `Welcome ${result.user.email?.split('@')[0] || 'back'}!`,
          });
          onSignedIn?.();
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      let message = 'An unexpected error occurred';
      
      if (error instanceof Error) {
        message = error.message;
        
        // More user-friendly error messages
        if (message.includes('invalid login credentials') || message.includes('Invalid login')) {
          message = 'Invalid email or password. Please try again.';
        } else if (message.includes('confirmation')) {
          message = 'Please check your email and confirm your account before signing in.';
        } else if (message.includes('too many requests')) {
          message = 'Too many login attempts. Please try again later.';
        } else if (message.includes('Email not confirmed')) {
          message = 'Please verify your email before signing in.';
        }
      }
      
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage(null); // Clear error when switching modes
  };
  
  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setIsSignUp(false);
    setErrorMessage(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Sign In'}
          </DialogTitle>
          <DialogDescription>
            {isForgotPassword 
              ? 'Enter your email address to receive a password reset link' 
              : isSignUp 
                ? 'Create a new account to continue' 
                : 'Sign in to your account to continue'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                autoComplete="email"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                placeholder="Enter your email"
              />
            </div>
            {!isForgotPassword && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={toggleForgotPassword}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isForgotPassword}
                    className="w-full pr-10"
                    placeholder={isSignUp ? "Create a password" : "Enter your password"}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-primary hover:underline"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? "Hide" : "Click to view"}
                  </button>
                </div>
                {isSignUp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Password must be at least 8 characters long
                  </p>
                )}
              </div>
            )}
            {isSignUp && !isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    autoComplete="new-password"
                    id="confirmPassword"
                    type={isPasswordVisible ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={isSignUp}
                    className="w-full pr-10"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-primary hover:underline"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? "Hide" : "Click to view"}
                  </button>
                </div>
              </div>
            )}
            
            {/* Error message display */}
            {errorMessage && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/30">
                {errorMessage}
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="w-full flex flex-col gap-2">
              {isForgotPassword ? (
                <>
                  <Button 
                    type="submit" 
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending reset link...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={toggleForgotPassword}
                  >
                    Back to Sign In
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={toggleMode}
                  >
                    {isSignUp ? 'Already have an account?' : 'Need an account?'}
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isSignUp ? 'Creating account...' : 'Signing in...'}
                      </>
                    ) : (
                      isSignUp ? 'Create Account' : 'Sign In'
                    )}
                  </Button>
                </>
              )}
            
            {/* Toggle test accounts section in development/staging */}
            {import.meta.env.DEV && !isSignUp && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setShowTestAccounts(!showTestAccounts)}
              >
                {showTestAccounts ? 'Hide' : 'Show'} Development Options
              </Button>
            )}
            
            {/* Test accounts section */}
            {import.meta.env.DEV && showTestAccounts && !isSignUp && (
              <TestAccountButtons />
            )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}