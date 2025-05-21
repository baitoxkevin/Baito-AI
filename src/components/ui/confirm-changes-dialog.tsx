import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ConfirmChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  changesSummary: React.ReactNode;
  reason: string;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  cancelText?: string;
  submitText?: string;
  submitInProgressText?: string;
}

export function ConfirmChangesDialog({
  open,
  onOpenChange,
  title = 'Confirm Changes',
  changesSummary,
  reason,
  onReasonChange,
  onSubmit,
  isSubmitting,
  cancelText = 'Cancel',
  submitText = 'Confirm & Save',
  submitInProgressText = 'Submitting...',
}: ConfirmChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            <p className="font-medium mb-1">The following changes will be applied:</p>
            {changesSummary}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="change-reason">Reason for change (required)</Label>
            <Textarea
              id="change-reason"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="e.g., Updated staff assignments for Q3, fixed typos in task descriptions."
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {cancelText}
          </Button>
          <Button onClick={onSubmit} disabled={!reason.trim() || isSubmitting}>
            {isSubmitting ? submitInProgressText : submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}