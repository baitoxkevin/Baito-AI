/**
 * useErrorReport Hook
 * Manages error reporting state and screenshot capture functionality
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { ErrorReportData } from '@/components/error-reporting/ErrorReportDialog';

interface UseErrorReportOptions {
  userId?: string;
  autoCapture?: boolean;
}

interface UseErrorReportReturn {
  isDialogOpen: boolean;
  errorData: ErrorReportData | null;
  isCapturing: boolean;
  openErrorReport: (error?: Error, componentStack?: string) => Promise<void>;
  closeErrorReport: () => void;
  captureScreenshot: () => Promise<string | null>;
  submitErrorReport: (description?: string, screenshot?: string) => Promise<{ success: boolean; reportId?: string }>;
  generateErrorId: () => string;
}

export function useErrorReport(options: UseErrorReportOptions = {}): UseErrorReportReturn {
  const { userId, autoCapture = true } = options;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorData, setErrorData] = useState<ErrorReportData | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Ref to prevent duplicate captures
  const captureInProgress = useRef(false);

  /**
   * Generate a unique error ID
   */
  const generateErrorId = useCallback((): string => {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Capture a screenshot of the current page
   */
  const captureScreenshot = useCallback(async (): Promise<string | null> => {
    if (captureInProgress.current) return null;

    captureInProgress.current = true;
    setIsCapturing(true);

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;

      // Capture the entire page
      const canvas = await html2canvas(document.body, {
        logging: false,
        useCORS: true,
        allowTaint: true,
        scale: 1, // Reduce scale for smaller file size
        ignoreElements: (element) => {
          // Ignore modals and overlays
          return (
            element.classList?.contains('error-report-dialog') ||
            element.getAttribute('role') === 'dialog' ||
            element.getAttribute('data-radix-dialog-overlay') !== null
          );
        },
      });

      const screenshot = canvas.toDataURL('image/png', 0.8);
      return screenshot;
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return null;
    } finally {
      captureInProgress.current = false;
      setIsCapturing(false);
    }
  }, []);

  /**
   * Open the error report dialog
   */
  const openErrorReport = useCallback(
    async (error?: Error, componentStack?: string) => {
      const errorId = generateErrorId();
      let screenshot: string | undefined;

      // Auto-capture screenshot if enabled
      if (autoCapture) {
        const capturedScreenshot = await captureScreenshot();
        if (capturedScreenshot) {
          screenshot = capturedScreenshot;
        }
      }

      // Gather error data
      const data: ErrorReportData = {
        errorId,
        errorMessage: error?.message || 'Unknown error occurred',
        errorStack: error?.stack,
        componentStack: componentStack,
        screenshot,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        pageContext: document.title,
      };

      setErrorData(data);
      setIsDialogOpen(true);
    },
    [autoCapture, captureScreenshot, generateErrorId]
  );

  /**
   * Close the error report dialog
   */
  const closeErrorReport = useCallback(() => {
    setIsDialogOpen(false);
    // Clear error data after animation completes
    setTimeout(() => {
      setErrorData(null);
    }, 300);
  }, []);

  /**
   * Submit error report to database
   */
  const submitErrorReport = useCallback(
    async (
      description?: string,
      screenshot?: string
    ): Promise<{ success: boolean; reportId?: string }> => {
      if (!errorData) {
        return { success: false };
      }

      try {
        const reportData = {
          error_id: errorData.errorId,
          user_id: userId || null,
          error_message: errorData.errorMessage,
          error_stack: errorData.errorStack || null,
          component_stack: errorData.componentStack || null,
          user_description: description || null,
          screenshot_url: screenshot || errorData.screenshot || null,
          page_url: errorData.url,
          user_agent: errorData.userAgent,
          page_context: errorData.pageContext || null,
          created_at: new Date().toISOString(),
          status: 'new',
        };

        const { data, error } = await supabase
          .from('error_reports')
          .insert([reportData])
          .select('id')
          .single();

        if (error) {
          console.error('Failed to submit error report:', error);
          return { success: false };
        }

        return { success: true, reportId: data?.id };
      } catch (error) {
        console.error('Error submitting report:', error);
        return { success: false };
      }
    },
    [errorData, userId]
  );

  return {
    isDialogOpen,
    errorData,
    isCapturing,
    openErrorReport,
    closeErrorReport,
    captureScreenshot,
    submitErrorReport,
    generateErrorId,
  };
}

/**
 * Global error report store for access outside React components
 */
let globalErrorReportHandler: ((error: Error, componentStack?: string) => void) | null = null;

export function setGlobalErrorReportHandler(
  handler: (error: Error, componentStack?: string) => void
) {
  globalErrorReportHandler = handler;
}

export function triggerGlobalErrorReport(error: Error, componentStack?: string) {
  if (globalErrorReportHandler) {
    globalErrorReportHandler(error, componentStack);
  }
}

export default useErrorReport;
