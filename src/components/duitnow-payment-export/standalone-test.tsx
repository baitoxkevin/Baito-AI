import React, { useState } from 'react';
import { DuitNowPaymentExport } from './index';

export function StandaloneTest() {
  const [open, setOpen] = useState(false);
  
  // Mock data for testing
  const mockStaffPayrollEntries = [
    {
      staffId: "1",
      staff_id: "1",
      staffName: "John Doe",
      workingSummary: {
        name: "John Doe",
        totalDays: 5,
        totalBasicSalary: 500,
        totalClaims: 100,
        totalCommission: 0,
        totalAmount: 600,
        workingDates: [],
        workingDatesWithSalary: []
      },
      workingDatesWithSalary: []
    },
    {
      staffId: "2",
      staff_id: "2",
      staffName: "Jane Smith",
      workingSummary: {
        name: "Jane Smith",
        totalDays: 3,
        totalBasicSalary: 300,
        totalClaims: 50,
        totalCommission: 0,
        totalAmount: 350,
        workingDates: [],
        workingDatesWithSalary: []
      },
      workingDatesWithSalary: []
    }
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">DuitNow Payment Export Standalone Test</h2>
      <p className="mb-4">Click the button below to open the DuitNow Payment Export dialog</p>
      
      <button 
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => {
          console.log("Opening DuitNow dialog");
          setOpen(true);
        }}
      >
        Open DuitNow Export
      </button>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p><strong>Dialog State:</strong> {open ? 'Open' : 'Closed'}</p>
      </div>
      
      {/* Test dialog directly */}
      <div className="fixed inset-0 flex items-center justify-center" style={{ display: open ? 'flex' : 'none' }}>
        <div className="bg-black bg-opacity-50 absolute inset-0" onClick={() => setOpen(false)}></div>
        <div className="bg-white p-6 rounded-lg z-50 max-w-3xl w-full">
          <h3 className="text-lg font-bold">Manual Dialog Test</h3>
          <p className="my-4">This is a manual test dialog. If you can see this, the issue is with the Dialog component.</p>
          <button 
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
      
      {/* The actual component */}
      <DuitNowPaymentExport
        open={open}
        onOpenChange={setOpen}
        projectId="test-project"
        projectName="Test Project"
        staffPayrollEntries={mockStaffPayrollEntries}
        paymentDate={new Date()}
      />
    </div>
  );
}