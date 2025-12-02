/**
 * ErrorReportButton - Floating button for manual error/feedback reporting
 * Allows users to report issues or provide feedback at any time
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, MessageSquare, Camera, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useErrorReport } from '@/hooks/use-error-report';
import { ErrorReportDialog, ErrorReportData } from './ErrorReportDialog';

interface ErrorReportButtonProps {
  userId?: string;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  className?: string;
  variant?: 'icon' | 'text' | 'minimal';
  showLabel?: boolean;
}

export function ErrorReportButton({
  userId,
  position = 'bottom-left',
  className,
  variant = 'icon',
  showLabel = false,
}: ErrorReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorData, setErrorData] = useState<ErrorReportData | null>(null);

  const { captureScreenshot, generateErrorId } = useErrorReport({ userId });

  // Position styles
  const positionStyles = {
    'bottom-left': 'bottom-6 left-6',
    'bottom-right': 'bottom-6 right-6',
    'top-left': 'top-6 left-6',
    'top-right': 'top-6 right-6',
  };

  // Handle opening the report dialog
  const handleOpenReport = useCallback(async () => {
    setIsCapturing(true);

    try {
      // Capture screenshot
      const screenshot = await captureScreenshot();

      // Create error data for manual report
      const data: ErrorReportData = {
        errorId: generateErrorId(),
        errorMessage: 'Manual Feedback/Bug Report',
        screenshot: screenshot || undefined,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        pageContext: document.title,
      };

      setErrorData(data);
      setIsOpen(true);
    } catch (error) {
      console.error('Failed to prepare report:', error);
      // Still open dialog without screenshot
      setErrorData({
        errorId: generateErrorId(),
        errorMessage: 'Manual Feedback/Bug Report',
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        pageContext: document.title,
      });
      setIsOpen(true);
    } finally {
      setIsCapturing(false);
    }
  }, [captureScreenshot, generateErrorId]);

  const handleCloseDialog = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setErrorData(null), 300);
  }, []);

  // Minimal variant - just an icon button
  if (variant === 'minimal') {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenReport}
                disabled={isCapturing}
                className={cn(
                  'h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                  className
                )}
              >
                {isCapturing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bug className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Report a bug or give feedback</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ErrorReportDialog
          open={isOpen}
          onOpenChange={handleCloseDialog}
          errorData={errorData}
          userId={userId}
        />
      </>
    );
  }

  // Text variant - button with text
  if (variant === 'text') {
    return (
      <>
        <Button
          variant="outline"
          onClick={handleOpenReport}
          disabled={isCapturing}
          className={cn('gap-2', className)}
        >
          {isCapturing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bug className="h-4 w-4" />
          )}
          Report Issue
        </Button>

        <ErrorReportDialog
          open={isOpen}
          onOpenChange={handleCloseDialog}
          errorData={errorData}
          userId={userId}
        />
      </>
    );
  }

  // Icon variant - floating action button
  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={cn(
            'fixed z-40',
            positionStyles[position],
            className
          )}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleOpenReport}
                  disabled={isCapturing}
                  size={showLabel ? 'default' : 'icon'}
                  variant="outline"
                  className={cn(
                    'shadow-lg hover:shadow-xl transition-all hover:scale-105',
                    'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                    showLabel ? 'px-4 gap-2' : 'h-12 w-12 rounded-full'
                  )}
                >
                  {isCapturing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-gray-600 dark:text-gray-300" />
                      {showLabel && <span>Capturing...</span>}
                    </>
                  ) : (
                    <>
                      <Bug className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      {showLabel && <span>Report Bug</span>}
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              {!showLabel && (
                <TooltipContent side={position.includes('right') ? 'left' : 'right'}>
                  <p>Report a bug or give feedback</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </motion.div>
      </AnimatePresence>

      <ErrorReportDialog
        open={isOpen}
        onOpenChange={handleCloseDialog}
        errorData={errorData}
        userId={userId}
      />
    </>
  );
}

/**
 * Inline feedback button for use within forms or specific components
 */
interface InlineFeedbackButtonProps {
  userId?: string;
  context?: string;
  label?: string;
  className?: string;
}

export function InlineFeedbackButton({
  userId,
  context,
  label = 'Report Issue',
  className,
}: InlineFeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorData, setErrorData] = useState<ErrorReportData | null>(null);

  const { captureScreenshot, generateErrorId } = useErrorReport({ userId });

  const handleOpenReport = useCallback(async () => {
    setIsCapturing(true);

    try {
      const screenshot = await captureScreenshot();

      const data: ErrorReportData = {
        errorId: generateErrorId(),
        errorMessage: context || 'User Feedback',
        screenshot: screenshot || undefined,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        pageContext: context || document.title,
      };

      setErrorData(data);
      setIsOpen(true);
    } catch (error) {
      console.error('Failed to prepare report:', error);
      setErrorData({
        errorId: generateErrorId(),
        errorMessage: context || 'User Feedback',
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        pageContext: context || document.title,
      });
      setIsOpen(true);
    } finally {
      setIsCapturing(false);
    }
  }, [captureScreenshot, generateErrorId, context]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpenReport}
        disabled={isCapturing}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700',
          'dark:text-gray-400 dark:hover:text-gray-200 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded',
          className
        )}
      >
        {isCapturing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <MessageSquare className="h-3.5 w-3.5" />
        )}
        <span>{label}</span>
      </button>

      <ErrorReportDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsOpen(false);
            setTimeout(() => setErrorData(null), 300);
          }
        }}
        errorData={errorData}
        userId={userId}
      />
    </>
  );
}

export default ErrorReportButton;
