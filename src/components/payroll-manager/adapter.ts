/**
 * Adapter for smooth integration with different projects
 * 
 * This module provides a compatibility layer to ensure PayrollManager
 * can be easily integrated with any React application.
 */

// Re-export appropriate hooks and services for current project
import { supabase as project8Supabase } from '@/lib/supabase';
import { useToast as useProject8Toast } from '@/hooks/use-toast';

// Export for use in PayrollManager component
export const supabase = project8Supabase;
export function useToast() {
  return useProject8Toast();
}

// Re-export utility functions from service layer
export { 
  calculateStaffWorkingSummaries,
  saveStaffPaymentDetails, 
  saveProjectPayroll,
  getProjectPayroll
} from './services';