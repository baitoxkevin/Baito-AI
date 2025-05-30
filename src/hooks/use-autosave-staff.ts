import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { updateProject } from '@/lib/projects';
import { recordProjectChanges } from '@/lib/project-change-service';
import { getUser } from '@/lib/auth';

interface UseAutosaveStaffOptions {
  projectId: string;
  confirmedStaff: unknown[];
  applicants: unknown[];
  enabled?: boolean;
  debounceDelay?: number;
}

export function useAutosaveStaff({
  projectId,
  confirmedStaff,
  applicants,
  enabled = true,
  debounceDelay = 2000, // 2 seconds default
}: UseAutosaveStaffOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<{ staff: string; applicants: string }>({
    staff: JSON.stringify(confirmedStaff),
    applicants: JSON.stringify(applicants),
  });
  
  // Update initial values when props change on mount
  useEffect(() => {
    // console.log('[Autosave] Initializing lastSavedRef');
    lastSavedRef.current = {
      staff: JSON.stringify(confirmedStaff),
      applicants: JSON.stringify(applicants),
    };
  }, []); // Only run once on mount

  // Function to prepare staff for saving
  const prepareStaffForSaving = (staffArray: unknown[]) => {
    return staffArray.map(staff => {
      const cleanStaff = { ...staff };
      // Remove UI-specific properties
      delete cleanStaff.dragging;
      delete cleanStaff.editing;
      
      // Convert workingDates to ISO strings
      if (cleanStaff.workingDates && Array.isArray(cleanStaff.workingDates)) {
        cleanStaff.workingDates = cleanStaff.workingDates.map((date: unknown) => {
          if (date instanceof Date) {
            return date.toISOString();
          }
          return date;
        });
      }
      
      return cleanStaff;
    });
  };

  const saveChanges = useCallback(async () => {
    // console.log('[Autosave] saveChanges called', { enabled });
    if (!enabled) {
      // console.log('[Autosave] Not enabled, returning');
      return;
    }

    const currentStaff = JSON.stringify(confirmedStaff);
    const currentApplicants = JSON.stringify(applicants);

    // console.log('[Autosave] Comparing changes', {
    //   currentStaffEquals: currentStaff === lastSavedRef.current.staff,
    //   currentApplicantsEquals: currentApplicants === lastSavedRef.current.applicants,
    //   currentStaffLength: confirmedStaff.length,
    //   lastStaffLength: JSON.parse(lastSavedRef.current.staff || '[]').length,
    //   currentApplicantsLength: applicants.length,
    //   lastApplicantsLength: JSON.parse(lastSavedRef.current.applicants || '[]').length,
    // });

    // Check if there are actually changes
    if (
      currentStaff === lastSavedRef.current.staff &&
      currentApplicants === lastSavedRef.current.applicants
    ) {
      // console.log('[Autosave] No changes detected, marking as saved');
      setSaveStatus('saved');
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      // Update only staff and applicants
      const updateData = {
        confirmed_staff: prepareStaffForSaving(confirmedStaff),
        applicants: prepareStaffForSaving(applicants),
      };

      // console.log('[Autosave] Saving staff changes:', {
      //   projectId,
      //   confirmedStaffCount: confirmedStaff.length,
      //   applicantsCount: applicants.length,
      // });

      await updateProject(projectId, updateData);

      // Record the change in the change log
      const changes = [];
      if (currentStaff !== lastSavedRef.current.staff) {
        changes.push({
          field: 'staff',
          old: lastSavedRef.current.staff,
          new: currentStaff,
        });
      }
      if (currentApplicants !== lastSavedRef.current.applicants) {
        changes.push({
          field: 'applicants',
          old: lastSavedRef.current.applicants,
          new: currentApplicants,
        });
      }

      if (changes.length > 0) {
        // Get current user for change tracking
        const user = await getUser();
        
        await recordProjectChanges(
          projectId,
          changes,
          user?.id || 'system' // Use 'system' as fallback if no user is authenticated
        );
      }

      // Update last saved references
      lastSavedRef.current = {
        staff: currentStaff,
        applicants: currentApplicants,
      };

      setSaveStatus('saved');
      
      // Show success toast
      toast({
        title: 'Changes saved',
        description: 'Staff and applicant changes saved automatically',
        duration: 2000,
      });
    } catch (error) {
      console.error('[Autosave] Error saving staff changes:', error);
      setSaveStatus('error');
      
      toast({
        title: 'Failed to save changes',
        description: 'Staff changes could not be saved automatically. Please try saving manually.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [projectId, confirmedStaff, applicants, enabled]);

  // Debounced save effect
  useEffect(() => {
    // console.log('[Autosave] useEffect triggered', {
    //   enabled,
    //   confirmedStaffLength: confirmedStaff.length,
    //   applicantsLength: applicants.length,
    // });
    
    if (!enabled) {
      // console.log('[Autosave] Disabled, skipping');
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set status to indicate pending save
    if (saveStatus === 'saved' || saveStatus === 'idle') {
      setSaveStatus('idle');
    }

    // Set new timeout
    // console.log(`[Autosave] Setting timeout for ${debounceDelay}ms`);
    saveTimeoutRef.current = setTimeout(() => {
      // console.log('[Autosave] Timeout reached, calling saveChanges');
      saveChanges();
    }, debounceDelay);

    // Cleanup function
    return () => {
      if (saveTimeoutRef.current) {
        // console.log('[Autosave] Cleanup: clearing timeout');
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [confirmedStaff, applicants, enabled, debounceDelay]); // Removed saveChanges from dependencies to avoid infinite loop

  // Save immediately when component unmounts
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Note: We can't make async calls in cleanup functions
      // Consider using a beforeunload event handler if immediate save on unmount is critical
    };
  }, []);

  return {
    isSaving,
    saveStatus,
    saveImmediately: saveChanges,
  };
}