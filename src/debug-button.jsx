import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DollarSign } from "lucide-react";

export function DebugButton() {
  // State for the dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Log when component mounts
  useEffect(() => {
    console.log('DebugButton component mounted');
  }, []);
  
  // Log when dialog state changes
  useEffect(() => {
    console.log('Dialog state changed to:', isDialogOpen);
  }, [isDialogOpen]);
  
  // Button click handler
  const handleButtonClick = () => {
    console.log('Button clicked, current state:', isDialogOpen);
    
    // Update state using functional form for safety
    setIsDialogOpen(prev => {
      console.log('Setting isDialogOpen from', prev, 'to true');
      return true;
    });
    
    // Check if state was updated after a brief delay
    setTimeout(() => {
      console.log('After timeout, isDialogOpen =', isDialogOpen);
      console.log('Dialog element present:', document.querySelector('[role="dialog"]') !== null);
    }, 100);
  };
  
  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-xl font-bold text-center">Debug Button Test</h2>
      
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700 mb-4">
          Current dialog state: <strong>{isDialogOpen ? 'OPEN' : 'CLOSED'}</strong>
        </p>
        
        <Button 
          onClick={handleButtonClick}
          className="w-full"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Test Set Basic Button
        </Button>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <p className="py-4">If you can see this dialog, the button is working correctly!</p>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>
              Close Dialog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DebugButton;