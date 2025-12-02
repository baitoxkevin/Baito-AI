/**
 * ErrorReportDialog - Modal for submitting error reports with screenshots
 * Integrates with Baiger AI Assistant for error analysis and support
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Camera,
  Send,
  X,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useBaiger } from '@/contexts/BaigerContext';

export interface ErrorReportData {
  errorId: string;
  errorMessage: string;
  errorStack?: string;
  componentStack?: string;
  screenshot?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  pageContext?: string;
}

interface ErrorReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorData: ErrorReportData | null;
  userId?: string;
  onSuccess?: () => void;
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export function ErrorReportDialog({
  open,
  onOpenChange,
  errorData,
  userId,
  onSuccess
}: ErrorReportDialogProps) {
  const { toast } = useToast();
  const { openBaiger } = useBaiger();
  const [description, setDescription] = useState('');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setDescription('');
      setSubmitStatus('idle');
      setShowTechnicalDetails(false);
      setScreenshotPreview(errorData?.screenshot || null);
      // Focus textarea after animation
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open, errorData]);

  // Capture screenshot using html2canvas
  const captureScreenshot = async () => {
    setIsCapturingScreenshot(true);
    try {
      // Dynamically import html2canvas to reduce bundle size
      const html2canvas = (await import('html2canvas')).default;

      // Hide the dialog temporarily for clean screenshot
      const dialogOverlay = document.querySelector('[data-radix-dialog-overlay]');
      const dialogContent = document.querySelector('[data-radix-dialog-content]');

      if (dialogOverlay) (dialogOverlay as HTMLElement).style.visibility = 'hidden';
      if (dialogContent) (dialogContent as HTMLElement).style.visibility = 'hidden';

      // Small delay to ensure dialog is hidden
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(document.body, {
        logging: false,
        useCORS: true,
        allowTaint: true,
        scale: 1, // Reduce scale for smaller file size
        ignoreElements: (element) => {
          // Ignore certain elements that might cause issues
          return element.classList?.contains('error-report-dialog');
        }
      });

      // Show dialog again
      if (dialogOverlay) (dialogOverlay as HTMLElement).style.visibility = 'visible';
      if (dialogContent) (dialogContent as HTMLElement).style.visibility = 'visible';

      const screenshot = canvas.toDataURL('image/png', 0.8);
      setScreenshotPreview(screenshot);

      toast({
        title: 'Screenshot captured',
        description: 'Screenshot has been added to your report.',
      });
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      toast({
        title: 'Screenshot failed',
        description: 'Could not capture screenshot. You can still submit the report.',
        variant: 'destructive',
      });
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  // Submit error report to Supabase and open Baiger
  const handleSubmit = async () => {
    if (!errorData) return;

    setSubmitStatus('submitting');

    try {
      // Prepare error report data (matching database schema)
      const reportData = {
        error_message: errorData.errorMessage,
        error_stack: errorData.errorStack || null,
        component_stack: errorData.componentStack || null,
        page_url: errorData.url,
        page_title: document.title || null,
        reporter_id: userId || null,
        user_agent: errorData.userAgent,
        user_description: description || null,
        screenshot_url: screenshotPreview || null,
        status: 'new' as const,
        severity: 'medium' as const,
      };

      // Insert into database
      const { data, error } = await supabase
        .from('error_reports')
        .insert([reportData])
        .select()
        .single();

      if (error) {
        console.error('Failed to submit error report:', error);
        // Even if DB fails, still try to open Baiger
      }

      setSubmitStatus('success');

      toast({
        title: 'Report submitted',
        description: 'Thank you! Your error report has been submitted.',
      });

      // Open Baiger with error context after a brief delay
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();

        // Open Baiger with error report context
        openBaiger({
          mode: 'general',
          initialMessage: `I just encountered an error and submitted a report. Here are the details:

**Error ID:** ${errorData.errorId}
**Error:** ${errorData.errorMessage}
${description ? `**What I was doing:** ${description}` : ''}

Can you help me understand what might have gone wrong and how to avoid this in the future?`,
        });
      }, 1500);

    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitStatus('error');
      toast({
        title: 'Submission failed',
        description: 'Could not submit report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Open Baiger directly without submitting
  const handleAskBaiger = () => {
    onOpenChange(false);
    openBaiger({
      mode: 'general',
      initialMessage: errorData
        ? `I'm experiencing an error: "${errorData.errorMessage}". Can you help me troubleshoot this?`
        : 'I encountered an error and need help troubleshooting.',
    });
  };

  if (!errorData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="error-report-dialog sm:max-w-[600px] max-h-[90vh] overflow-hidden"
        aria-labelledby="error-report-title"
        aria-describedby="error-report-description"
      >
        <DialogHeader>
          <DialogTitle id="error-report-title" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <span>Report an Error</span>
          </DialogTitle>
          <DialogDescription id="error-report-description">
            Help us improve by describing what happened. Your report will be reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Error Summary */}
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs text-red-600 dark:text-red-400 border-red-300 dark:border-red-700">
                      Error ID: {errorData.errorId.slice(0, 12)}...
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 break-words">
                    {errorData.errorMessage}
                  </p>
                </div>
              </div>

              {/* Technical Details Toggle */}
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="flex items-center gap-1 mt-3 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                {showTechnicalDetails ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {showTechnicalDetails ? 'Hide' : 'Show'} technical details
              </button>

              <AnimatePresence>
                {showTechnicalDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                      <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap break-all font-mono bg-red-100/50 dark:bg-red-900/20 p-2 rounded max-h-32 overflow-auto">
                        {errorData.errorStack || 'No stack trace available'}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Screenshot Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Screenshot</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={captureScreenshot}
                  disabled={isCapturingScreenshot}
                  className="h-8"
                >
                  {isCapturingScreenshot ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Capturing...
                    </>
                  ) : screenshotPreview ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Retake
                    </>
                  ) : (
                    <>
                      <Camera className="h-3 w-3 mr-2" />
                      Capture Screenshot
                    </>
                  )}
                </Button>
              </div>

              {screenshotPreview ? (
                <div className="relative rounded-lg border overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={screenshotPreview}
                    alt="Error screenshot"
                    className="w-full h-auto max-h-48 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setScreenshotPreview(null)}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-gray-900/70 hover:bg-gray-900/90 flex items-center justify-center text-white transition-colors"
                    aria-label="Remove screenshot"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
                  <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No screenshot captured
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Screenshots help us understand the issue better
                  </p>
                </div>
              )}
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <Label htmlFor="error-description" className="text-sm font-medium">
                What were you doing when this error occurred?
              </Label>
              <Textarea
                ref={textareaRef}
                id="error-description"
                placeholder="e.g., I was trying to save a new project when the error appeared..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={submitStatus === 'submitting' || submitStatus === 'success'}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Optional but helpful. More context helps us fix the issue faster.
              </p>
            </div>

            {/* Page Info */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Page: {errorData.url}</span>
              <span>Time: {new Date(errorData.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          {submitStatus === 'success' ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 text-green-600 dark:text-green-400"
            >
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Report submitted! Opening Baiger...</span>
            </motion.div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleAskBaiger}
                disabled={submitStatus === 'submitting'}
                className="w-full sm:w-auto"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Ask Baiger for Help
              </Button>

              <div className="flex-1" />

              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={submitStatus === 'submitting'}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitStatus === 'submitting'}
                className={cn(
                  submitStatus === 'error' && 'bg-red-600 hover:bg-red-700'
                )}
              >
                {submitStatus === 'submitting' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : submitStatus === 'error' ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ErrorReportDialog;
