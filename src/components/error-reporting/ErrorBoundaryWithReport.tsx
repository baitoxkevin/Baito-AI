/**
 * ErrorBoundaryWithReport - Enhanced Error Boundary with Screenshot Capture and Reporting
 * Catches React errors and provides a user-friendly error reporting experience
 */

import React, { Component, ErrorInfo, ReactNode, createRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorReportDialog, ErrorReportData } from './ErrorReportDialog';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  userId?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  screenshot: string | null;
  isCapturingScreenshot: boolean;
  showReportDialog: boolean;
}

export class ErrorBoundaryWithReport extends Component<Props, State> {
  private captureRef = createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId(),
      screenshot: null,
      isCapturingScreenshot: false,
      showReportDialog: false,
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

    // Log error details
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

    // Capture screenshot after a brief delay to ensure error UI is not shown
    this.captureScreenshot();

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  private captureScreenshot = async () => {
    this.setState({ isCapturingScreenshot: true });

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;

      // We need to capture what was shown before the error
      // Since the error has occurred, we'll capture the current state
      // In a real app, you might store periodic snapshots
      const canvas = await html2canvas(document.body, {
        logging: false,
        useCORS: true,
        allowTaint: true,
        scale: 1,
        ignoreElements: (element) => {
          // Ignore the error boundary fallback UI
          return element.classList?.contains('error-boundary-fallback');
        },
      });

      const screenshot = canvas.toDataURL('image/png', 0.8);
      this.setState({ screenshot });
    } catch (err) {
      console.error('Failed to capture screenshot:', err);
    } finally {
      this.setState({ isCapturingScreenshot: false });
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId(),
      screenshot: null,
      showReportDialog: false,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleOpenReportDialog = () => {
    this.setState({ showReportDialog: true });
  };

  private handleCloseReportDialog = () => {
    this.setState({ showReportDialog: false });
  };

  private getErrorMessage(): string {
    const { error } = this.state;

    // In production, show generic messages
    if (import.meta.env.PROD) {
      if (error?.message?.includes('Network')) {
        return 'Unable to connect to our servers. Please check your internet connection.';
      }
      if (error?.message?.includes('Permission') || error?.message?.includes('Unauthorized')) {
        return "You don't have permission to access this resource.";
      }
      return 'An unexpected error occurred. Our team has been notified.';
    }

    // In development, show actual error
    return error?.message || 'An unknown error occurred';
  }

  private getErrorReportData(): ErrorReportData | null {
    const { error, errorInfo, errorId, screenshot } = this.state;

    if (!error) return null;

    return {
      errorId,
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack: errorInfo?.componentStack,
      screenshot: screenshot || undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      pageContext: document.title,
    };
  }

  render() {
    const { hasError, error, errorId, showReportDialog, isCapturingScreenshot } = this.state;
    const { children, fallback, userId } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <>
          <div className="error-boundary-fallback min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="max-w-lg w-full shadow-xl">
                <CardHeader className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4"
                  >
                    <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </motion.div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Oops! Something went wrong
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
                    {this.getErrorMessage()}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Error ID Display */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Error ID:{' '}
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                        {errorId}
                      </code>
                    </p>
                  </div>

                  {/* Development-only details */}
                  {import.meta.env.DEV && error && (
                    <details className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                      <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        Technical details
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400 overflow-x-auto max-h-32">
                        {error.stack}
                      </pre>
                    </details>
                  )}

                  {/* Report Error CTA */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Bug className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                          Help us fix this issue
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Submit a report with a screenshot to help us understand and fix this problem faster.
                        </p>
                        <Button
                          onClick={this.handleOpenReportDialog}
                          size="sm"
                          className="mt-3"
                          disabled={isCapturingScreenshot}
                        >
                          {isCapturingScreenshot ? (
                            'Preparing report...'
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Report This Error
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
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
            </motion.div>
          </div>

          {/* Error Report Dialog */}
          <ErrorReportDialog
            open={showReportDialog}
            onOpenChange={(open) => {
              if (!open) {
                this.handleCloseReportDialog();
              }
            }}
            errorData={this.getErrorReportData()}
            userId={userId}
            onSuccess={this.handleReset}
          />
        </>
      );
    }

    return children;
  }
}

/**
 * Hook-friendly wrapper for ErrorBoundaryWithReport
 */
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  userId?: string;
  fallback?: ReactNode;
}

export function ErrorBoundaryWrapper({
  children,
  userId,
  fallback,
}: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundaryWithReport userId={userId} fallback={fallback}>
      {children}
    </ErrorBoundaryWithReport>
  );
}

export default ErrorBoundaryWithReport;
