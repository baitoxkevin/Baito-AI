import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { DollarSign, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// This is a simplified version of the PayrollManager component
// that focuses only on the "Set Basic Salary" functionality
// to help isolate and debug the issue

export default function PayrollDebug() {
  // Initial states
  const [isSetBasicDialogOpen, setIsSetBasicDialogOpen] = useState(false);
  const [selectedStaffForBasic, setSelectedStaffForBasic] = useState([]);
  const [tempBasicValue, setTempBasicValue] = useState("");
  const [debugLogs, setDebugLogs] = useState([]);
  
  // Function to log debug information
  const logDebug = (message, data) => {
    console.log(message, data);
    setDebugLogs(prevLogs => [
      { timestamp: new Date().toLocaleTimeString(), message, data: JSON.stringify(data) },
      ...prevLogs
    ]);
  };
  
  // Log when component mounts
  useEffect(() => {
    logDebug("Component mounted", { isSetBasicDialogOpen });
    
    // Return cleanup function
    return () => {
      logDebug("Component unmounted", {});
    };
  }, []);
  
  // Log when dialog state changes
  useEffect(() => {
    logDebug("Dialog state changed", { isSetBasicDialogOpen });
  }, [isSetBasicDialogOpen]);
  
  // Handle button click
  const handleOpenDialog = () => {
    logDebug("Button clicked", { wasOpen: isSetBasicDialogOpen });
    setIsSetBasicDialogOpen(true);
    
    // Check state after a short delay
    setTimeout(() => {
      logDebug("State after timeout", { isSetBasicDialogOpen });
    }, 100);
  };
  
  // Dummy function for setting basic salary
  const setBasicSalaryForAllDates = () => {
    logDebug("setBasicSalaryForAllDates called", { tempBasicValue, selectedStaffForBasic });
    
    // Close dialog
    setIsSetBasicDialogOpen(false);
    setTempBasicValue("");
    setSelectedStaffForBasic([]);
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <h1 className="text-xl font-bold mb-2">PayrollManager Debug Tool</h1>
        <p>This tool helps identify issues with the "Set Basic Salary" button in the PayrollManager component.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-3">Button Controls</h2>
          
          {/* The original button from PayrollManager */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Original Implementation Button:</h3>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSetBasicDialogOpen(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 text-xs border-0"
              >
                <DollarSign className="w-3 h-3 mr-1.5" />
                Set Basic
                <Sparkles className="w-3 h-3 ml-1.5" />
              </Button>
            </motion.div>
          </div>
          
          {/* Alternative implementations */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Alternative Implementation 1:</h3>
            <Button onClick={handleOpenDialog}>
              Debug: Set Basic Salary (with logging)
            </Button>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Alternative Implementation 2:</h3>
            <Button onClick={() => {
              console.log("Direct implementation clicked");
              setIsSetBasicDialogOpen(prev => {
                console.log("State updater called, previous value:", prev);
                return true;
              });
            }}>
              Debug: Set Basic Salary (inline)
            </Button>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Current Dialog State:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              isSetBasicDialogOpen = {isSetBasicDialogOpen.toString()}
            </pre>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Manual Controls:</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsSetBasicDialogOpen(true)}>
                Open Dialog
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsSetBasicDialogOpen(false)}>
                Close Dialog
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsSetBasicDialogOpen(prev => !prev)}>
                Toggle Dialog
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border overflow-auto max-h-[400px]">
          <h2 className="text-lg font-semibold mb-3">Debug Logs</h2>
          {debugLogs.length === 0 ? (
            <p className="text-gray-500 italic">No logs yet. Try clicking the buttons.</p>
          ) : (
            <div className="space-y-2">
              {debugLogs.map((log, index) => (
                <div key={index} className="border-b border-gray-200 pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{log.timestamp}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Log #{debugLogs.length - index}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{log.message}</p>
                  <pre className="text-xs bg-gray-50 p-1 rounded mt-1 overflow-x-auto">
                    {log.data}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* The dialog implementation */}
      <Dialog 
        open={isSetBasicDialogOpen} 
        onOpenChange={(open) => {
          logDebug("Dialog onOpenChange called", { newOpen: open, wasOpen: isSetBasicDialogOpen });
          setIsSetBasicDialogOpen(open);
          if (!open) {
            setSelectedStaffForBasic([]);
            setTempBasicValue("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Set Basic Salary (Debug)
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              This is a debug version of the Set Basic Salary dialog.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="basicAmount" className="text-sm font-semibold text-indigo-700">
                Basic Salary Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 font-medium">
                  RM
                </span>
                <Input
                  id="basicAmount"
                  type="text"
                  value={tempBasicValue}
                  onChange={(e) => {
                    logDebug("basicAmount changed", { value: e.target.value });
                    setTempBasicValue(e.target.value);
                  }}
                  placeholder="0.00"
                  className="pl-10 h-12 text-lg font-medium border-2 border-indigo-300 bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-700">Debug Information</h3>
              <p className="text-xs text-blue-600 mt-1">
                Dialog is {isSetBasicDialogOpen ? 'OPEN' : 'CLOSED'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Current basic value: "{tempBasicValue}"
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                logDebug("Cancel button clicked", {});
                setIsSetBasicDialogOpen(false);
                setSelectedStaffForBasic([]);
                setTempBasicValue("");
              }}
              className="border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                logDebug("Apply button clicked", { tempBasicValue });
                setBasicSalaryForAllDates();
              }}
              disabled={!tempBasicValue}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              Apply Test Value
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}