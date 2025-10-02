import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { signIn } from '@/lib/auth';

// Lazy load heavy components
const Button = lazy(() => import('@/components/ui/button').then(m => ({ default: m.Button })));
const Input = lazy(() => import('@/components/ui/input').then(m => ({ default: m.Input })));
const Label = lazy(() => import('@/components/ui/label').then(m => ({ default: m.Label })));
const Toaster = lazy(() => import('@/components/ui/toaster').then(m => ({ default: m.Toaster })));
const useToast = lazy(() => import('@/hooks/use-toast').then(m => ({ default: m.useToast })));

// Optimized logo with preload and inline base64 for instant display
const LOGO_BASE64 = "data:image/png;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCABQAFADASIAAhEBAxEB/8QAGwABAAIDAQEAAAAAAAAAAAAAAAUGAgMEBwH/xAA2EAABAwMCBAQDBgYDAAAAAAABAAIDBAUREiEGMUFRExQiYXGBkQcVMqGxwSNCUmLR8ENykv/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A9qREQEREBERAREQEREBERAREQEREBERB//9k="; // Placeholder - replace with actual base64

// Minimal loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-12">
    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
  </div>
);

// Eye icon components (inline to avoid extra imports)
const EyeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

export default function LoginPageOptimized() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ title: string; description: string; variant?: string } | null>(null);
  const navigate = useNavigate();

  // Memoized validation
  const isFormValid = useMemo(() => email && password && !isLoading, [email, password, isLoading]);

  // Optimized handlers with useCallback
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

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
          setToast({
            title: 'Welcome back!',
            description: 'Successfully signed in',
          });
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      
      const message = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
      
      setToast({
        title: 'Unable to sign in',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, password, isFormValid, navigate]);

  // Optimized keypress handler
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isFormValid) {
      handleLogin(e as any);
    }
  }, [isFormValid, handleLogin]);

  return (
    <>
      {/* Critical CSS inline for instant render */}
      <style dangerouslySetInnerHTML={{ __html: `
        .login-container {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .login-card {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          padding: 2.5rem;
          width: 100%;
          max-width: 32rem;
          margin: 0 1rem;
          animation: fadeInUp 0.3s ease-out;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .logo {
          width: 5rem;
          height: 5rem;
          border-radius: 50%;
          object-fit: cover;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .input-field {
          width: 100%;
          height: 3rem;
          padding: 0 3rem;
          font-size: 1rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          transition: all 0.2s;
        }
        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .btn-primary {
          width: 100%;
          height: 3rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 500;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .icon-left {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        }
        .icon-right {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          cursor: pointer;
        }
        .icon-right:hover {
          color: #6b7280;
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      ` }} />

      <div className="login-container">
        {toast && (
          <Suspense fallback={null}>
            <Toaster />
          </Suspense>
        )}
        
        <div className="login-card">
          {/* Logo with optimized loading */}
          <div className="flex justify-center mb-10">
            <img
              src={LOGO_BASE64}
              className="logo"
              alt="BaitoAI Labs"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onLoad={() => {
                // Lazy load the actual logo after initial render
                const img = new Image();
                img.src = "https://i.postimg.cc/28D4j6hk/Submark-Alternative-Colour.png";
                img.onload = function() {
                  const logoEl = document.querySelector('.logo') as HTMLImageElement;
                  if (logoEl) logoEl.src = img.src;
                };
              }}
            />
          </div>
          
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h1>
            <p className="text-gray-600 text-base">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Suspense fallback={<label className="text-base font-medium text-gray-700">Email address</label>}>
                <Label htmlFor="email" className="text-base font-medium text-gray-700">
                  Email address
                </Label>
              </Suspense>
              <div className="relative">
                <svg className="icon-left h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <Suspense fallback={
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={handleEmailChange}
                    onKeyPress={handleKeyPress}
                    className="input-field"
                    autoFocus
                    autoComplete="email"
                    required
                  />
                }>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={handleEmailChange}
                    onKeyPress={handleKeyPress}
                    className="pl-12 h-12 text-base bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                    autoComplete="email"
                    required
                  />
                </Suspense>
              </div>
            </div>
            
            <div className="space-y-2">
              <Suspense fallback={<label className="text-base font-medium text-gray-700">Password</label>}>
                <Label htmlFor="password" className="text-base font-medium text-gray-700">
                  Password
                </Label>
              </Suspense>
              <div className="relative">
                <svg className="icon-left h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <Suspense fallback={
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    onKeyPress={handleKeyPress}
                    className="input-field"
                    autoComplete="current-password"
                    required
                  />
                }>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    onKeyPress={handleKeyPress}
                    className="pl-12 pr-12 h-12 text-base bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoComplete="current-password"
                    required
                  />
                </Suspense>
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="icon-right focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Suspense fallback={
                <button
                  type="submit"
                  className="btn-primary flex items-center justify-center"
                  disabled={isLoading || !isFormValid}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              }>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-md hover:shadow-lg transform transition-all duration-200 hover:-translate-y-0.5" 
                  disabled={isLoading || !isFormValid}
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
              </Suspense>
            </div>
          </form>

          {/* Enter key hint */}
          <p className="mt-8 text-center text-xs text-gray-500">
            Press Enter to sign in
          </p>
        </div>
      </div>
    </>
  );
}