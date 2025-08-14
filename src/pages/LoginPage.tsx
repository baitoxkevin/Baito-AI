import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signIn } from '@/lib/auth';
import { Toaster } from '@/components/ui/toaster';

// Performance monitoring (only in development)
if (process.env.NODE_ENV === 'development') {
  import('../utils/performance-test').then(module => {
    if (window.location.pathname === '/login') {
      module.runLoginPagePerformanceTest();
    }
  }).catch(console.error);
}

const LOGO_URL = "https://i.postimg.cc/28D4j6hk/Submark-Alternative-Colour.png";

// Preload logo for better performance
if (typeof window !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = LOGO_URL;
  document.head.appendChild(link);
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Show content after minimal delay to prevent flash
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setShowContent(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  // Memoized validation for better performance
  const isFormValid = useMemo(() => email && password && !isLoading, [email, password, isLoading]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setIsLoading(true);

    try {
      const { user } = await signIn(email, password);
      
      if (user) {
        // Navigate immediately for perceived performance
        navigate('/dashboard');
        
        // Show toast after navigation (non-blocking)
        requestAnimationFrame(() => {
          toast({
            title: 'Welcome back!',
            description: 'Successfully signed in',
            duration: 2000,
          });
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      
      const message = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
      
      toast({
        title: 'Unable to sign in',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, password, isFormValid, navigate, toast]);

  // Optimized input handlers
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Handle Enter key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isFormValid) {
      handleLogin(e as any);
    }
  }, [isFormValid, handleLogin]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Toaster />
      
      {/* Background decoration - only render when visible */}
      {showContent && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob will-change-transform" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 will-change-transform" />
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 will-change-transform" />
        </div>
      )}
      
      {/* Centered container - using absolute positioning for perfect centering */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg px-4">
        <div
          className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 transition-all duration-300 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <img
              src={LOGO_URL}
              className={`h-20 w-20 rounded-full object-cover shadow-lg transition-transform duration-500 ${showContent ? 'scale-100' : 'scale-0'}`}
              alt="BaitoAI Labs"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
          
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleLogin}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium text-gray-700 dark:text-gray-300">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  onKeyPress={handleKeyPress}
                  autoComplete="email"
                  className="pl-12 h-12 text-base bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium text-gray-700 dark:text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyPress={handleKeyPress}
                  autoComplete="current-password"
                  className="pl-12 pr-12 h-12 text-base bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-md hover:shadow-lg transform transition-all duration-200 hover:-translate-y-0.5" 
                disabled={!isFormValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </div>
          </form>

          {/* Enter key hint */}
          <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
            Press Enter to sign in
          </p>
        </div>
      </div>

      {/* Optimized animations with GPU acceleration */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate3d(0px, 0px, 0) scale(1);
          }
          33% {
            transform: translate3d(30px, -50px, 0) scale(1.1);
          }
          66% {
            transform: translate3d(-20px, 20px, 0) scale(0.9);
          }
          100% {
            transform: translate3d(0px, 0px, 0) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .will-change-transform {
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-blob {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}