import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Error Boundary for Calendar components
 * Catches rendering errors and provides recovery options
 */
export class CalendarErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    console.error('Calendar Error Boundary caught an error:', error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.handleReset);
      }

      // Default error UI
      const { error, errorInfo, retryCount } = this.state;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-xl">Calendar Error</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Something went wrong while loading the calendar
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error message */}
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium text-foreground mb-1">
                  Error Details:
                </p>
                <p className="text-sm text-muted-foreground font-mono">
                  {error?.message || 'Unknown error occurred'}
                </p>
              </div>

              {/* Retry count indicator */}
              {retryCount > 0 && (
                <div className="text-sm text-muted-foreground">
                  Retry attempts: {retryCount}
                </div>
              )}

              {/* Technical details (collapsed by default in production) */}
              {process.env.NODE_ENV === 'development' && errorInfo && (
                <details className="bg-muted p-3 rounded-md">
                  <summary className="text-sm font-medium cursor-pointer mb-2">
                    Technical Details (Development Only)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-40 font-mono">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Helpful suggestions */}
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  What you can try:
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>Try again - sometimes temporary issues resolve themselves</li>
                  <li>Reload the page to reset the application state</li>
                  <li>Check your internet connection</li>
                  <li>Clear your browser cache and cookies</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex flex-wrap gap-2">
              <Button
                onClick={this.handleReset}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>

              <Button
                variant="outline"
                onClick={this.handleReload}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </Button>

              <Button
                variant="ghost"
                onClick={this.handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for easier use with hooks
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <CalendarErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </CalendarErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
}
