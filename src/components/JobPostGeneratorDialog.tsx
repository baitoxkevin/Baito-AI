import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface JobPostGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectData?: any;
}

export function JobPostGeneratorDialog({ open, onOpenChange }: JobPostGeneratorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Job Post</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-muted-foreground">Job post generator feature coming soon...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}