import React, { useState } from 'react';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './dialog';

export function TestDialog() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-8">
      <h2 className="text-lg font-bold mb-4">Dialog Test</h2>
      <Button 
        onClick={() => {
          // console.log("Opening dialog");
          setOpen(true);
        }}
        className="bg-blue-600"
      >
        Open Test Dialog
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>
              This is a test dialog to verify that dialogs are working properly.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>If you can see this, the dialog system is working properly.</p>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => {
                // console.log("Closing dialog");
                setOpen(false);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}