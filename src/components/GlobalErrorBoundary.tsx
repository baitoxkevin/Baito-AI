import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId(),
    };
  }

  private generateErrorId(): string {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.generateErrorId();
    
    // Log error details securely
    logger.critical('Application Error Boundary Triggered', {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Update state with error details
    this.setState({
      errorInfo,
      errorId,
    });

    // Send error to monitoring service in production
    if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true') {
      this.reportErrorToService(error, errorInfo, errorId);
    }
  }

  private reportErrorToService(error: Error, errorInfo: ErrorInfo, errorId: string) {
    // Implement error reporting to external service
    // Example: Sentry, Rollbar, Bugsnag, etc.
    try {
      // This is where you'd integrate with your error tracking service
      // Example with Sentry:
      // if (window.Sentry) {
      //   window.Sentry.captureException(error, {
      //     contexts: {
      //       react: {
      //         componentStack: errorInfo.componentStack,
      //       },
      //     },
      //     tags: {
      //       errorBoundary: true,
      //       errorId,
      //     },
      //   });
      // }
    } catch (reportingError) {
      // Fail silently to avoid recursive errors
      logger.error('Failed to report error to monitoring service', { reportingError });
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId(),
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getErrorMessage(): string {
    const { error } = this.state;
    
    // In production, show generic messages
    if (import.meta.env.PROD) {
      if (error?.message?.includes('Network')) {
        return 'Unable to connect to our servers. Please check your internet connection.';
      }
      if (error?.message?.includes('Permission') || error?.message?.includes('Unauthorized')) {
        return 'You don\'t have permission to access this resource.';
      }
      return 'An unexpected error occurred. Our team has been notified.';
    }
    
    // In development, show actual error
    return error?.message || 'An unknown error occurred';
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
                {this.getErrorMessage()}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    Error ID: {this.state.errorId}
                  </p>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      Show technical details
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap text-gray-600 dark:text-gray-400 overflow-x-auto">
                      {this.state.error.stack}
                    </pre>
                  </details>
                </div>
              )}
              
              {import.meta.env.PROD && (
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <p>Error ID: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{this.state.errorId}</code></p>
                  <p className="mt-2">Please include this ID when contacting support.</p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
              
              <Button
                onClick={this.handleReload}
                variant="ghost"
                className="w-full sm:w-auto"
              >
                Reload Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Fallback component for specific error scenarios
export const ErrorFallback: React.FC<{
  error?: Error;
  resetError?: () => void;
}> = ({ error, resetError }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
        {error?.message || 'An unexpected error occurred'}
      </p>
      {resetError && (
        <Button onClick={resetError} variant="default">
          Try Again
        </Button>
      )}
    </div>
  );
};