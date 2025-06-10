import { useEffect, useRef, useState } from 'react';
import { updateProject } from '@/lib/projects';
import { toast } from '@/hooks/use-toast';

import { logger } from '../lib/logger';
interface UseAutosaveProjectOptions {
  projectId: string;
  data: unknown;
  enabled?: boolean;
  debounceDelay?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useAutosaveProject({
  projectId,
  data,
  enabled = true,
  debounceDelay = 2000,
  onSuccess,
  onError,
}: UseAutosaveProjectOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !data) return;

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
        await updateProject(projectId, data);
        lastSavedRef.current = currentData;
        setSaveStatus('saved');
        
        toast({
          title: 'Changes saved',
          description: 'Your changes have been saved automatically.',
          duration: 2000,
        });

        onSuccess?.();
      } catch (error) {
        setSaveStatus('error');
        logger.error('Autosave error:', error);
        
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
  }, [projectId, data, enabled, debounceDelay, onSuccess, onError]);

  return { isSaving, saveStatus };
}