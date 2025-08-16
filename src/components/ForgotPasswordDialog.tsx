import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resetPassword } from '@/lib/auth';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [canResend, setCanResend] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);
  const { toast } = useToast();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const startResendTimer = () => {
    setCanResend(false);
    setResendTimer(60); // 60 second cooldown
    
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      await resetPassword(email.trim());
      setIsSuccess(true);
      startResendTimer();
      
      toast({
        title: "Reset link sent",
        description: "Check your email for password reset instructions",
        duration: 5000,
      });
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      
      if (errorMessage.toLowerCase().includes('rate limit')) {
        setError('Too many reset attempts. Please wait before trying again.');
      } else if (errorMessage.toLowerCase().includes('not found')) {
        setError('No account found with this email address');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
      
      toast({
        title: "Reset failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    try {
      await resetPassword(email.trim());
      startResendTimer();
      
      toast({
        title: "Reset link resent",
        description: "Check your email for the new reset link",
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Failed to resend",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setIsSuccess(false);
    setIsLoading(false);
    setCanResend(true);
    setResendTimer(0);
    onOpenChange(false);
  };

  const handleBackToLogin = () => {
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
            {isSuccess ? (
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : (
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <DialogTitle className="text-xl font-semibold">
            {isSuccess ? 'Reset Link Sent' : 'Forgot Password?'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSuccess 
              ? `We've sent a password reset link to ${email}. Check your email and follow the instructions to reset your password.`
              : 'Enter your email address and we\'ll send you a link to reset your password.'
            }
          </DialogDescription>
        </DialogHeader>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="pl-10"
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !email.trim() || !isValidEmail(email)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-800 dark:text-green-200">
                <p className="font-medium mb-1">Reset link expires in 15 minutes</p>
                <p>Didn't receive the email? Check your spam folder or try resending.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBackToLogin}
                className="flex-1"
              >
                Back to Login
              </Button>
              <Button
                onClick={handleResend}
                disabled={!canResend || isLoading}
                variant="secondary"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : canResend ? (
                  'Resend Link'
                ) : (
                  `Resend in ${resendTimer}s`
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-gray-500 dark:text-gray-400 border-t pt-4">
          <p>Need help? Contact support for assistance with your account.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}