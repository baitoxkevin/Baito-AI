/**
 * Error Reporting Components
 * Comprehensive error reporting system with screenshot capture and Baiger integration
 */

// Main components
export { ErrorReportDialog } from './ErrorReportDialog';
export type { ErrorReportData } from './ErrorReportDialog';

export {
  ErrorBoundaryWithReport,
  ErrorBoundaryWrapper,
} from './ErrorBoundaryWithReport';

export {
  ErrorReportButton,
  InlineFeedbackButton,
} from './ErrorReportButton';

// Re-export hook
export { useErrorReport } from '@/hooks/use-error-report';
