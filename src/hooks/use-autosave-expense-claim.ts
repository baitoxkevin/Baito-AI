import { useEffect, useRef, useState } from 'react';
import { useExpenseClaims } from '@/hooks/use-expense-claims';
import { toast } from '@/hooks/use-toast';
import { ExpenseClaim } from '@/lib/expense-claim-service';

interface UseAutosaveExpenseClaimOptions {
  claimId: string;
  data: Partial<Omit<ExpenseClaim, 'total_amount'>>;
  enabled?: boolean;
  debounceDelay?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  silentSave?: boolean;
}

export function useAutosaveExpenseClaim({
  claimId,
  data,
  enabled = true,
  debounceDelay = 2000,
  onSuccess,
  onError,
  silentSave = false,
}: UseAutosaveExpenseClaimOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const { updateClaim } = useExpenseClaims({ autoFetch: false });

  useEffect(() => {
    if (!enabled || !data || !claimId) return;

    const currentData = JSON.stringify(data);
    
    // Skip if no changes
    if (currentData === lastSavedRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setSaveStatus('saving');

      try {
        await updateClaim(claimId, data);
        lastSavedRef.current = currentData;
        setSaveStatus('saved');
        
        if (!silentSave) {
          toast({
            title: 'Changes saved',
            description: 'Your changes have been saved automatically.',
            duration: 2000,
          });
        }

        onSuccess?.();
      } catch (error) {
        setSaveStatus('error');
        console.error('Autosave error:', error);
        
        toast({
          title: 'Failed to save changes',
          description: 'Your changes could not be saved. Please try again.',
          variant: 'destructive',
        });

        onError?.(error as Error);
      } finally {
        setIsSaving(false);
      }
    }, debounceDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [claimId, data, enabled, debounceDelay, onSuccess, onError, updateClaim, silentSave]);

  return { isSaving, saveStatus };
}