import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DuitNowPaymentExport } from './index';

export default function DuitNowPaymentExportDebug() {
  const [isOpen, setIsOpen] = React.useState(false);

  // Mock data
  const mockStaffPayrollEntries = [
    {
      staffId: '1',
      staff_id: '1',
      staffName: 'John Doe',
      workingSummary: {
        name: 'John Doe',
        totalDays: 5,
        totalBasicSalary: 500,
        totalClaims: 100,
        totalCommission: 0,
        totalAmount: 600,
        workingDates: []
      },
      workingDatesWithSalary: []
    },
    {
      staffId: '2',
      staff_id: '2',
      staffName: 'Jane Smith',
      workingSummary: {
        name: 'Jane Smith',
        totalDays: 3,
        totalBasicSalary: 300,
        totalClaims: 50,
        totalCommission: 0,
        totalAmount: 350,
        workingDates: []
      },
      workingDatesWithSalary: []
    }
  ];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">DuitNow Payment Export Debug</h2>
      <p className="mb-4">Click the button below to test the DuitNow Payment Export component.</p>
      
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        Test DuitNow Export
      </Button>

      <DuitNowPaymentExport
        open={isOpen}
        onOpenChange={setIsOpen}
        projectId="test-123"
        projectName="Test Project"
        staffPayrollEntries={mockStaffPayrollEntries}
        paymentDate={new Date()}
      />
    </Card>
  );
}