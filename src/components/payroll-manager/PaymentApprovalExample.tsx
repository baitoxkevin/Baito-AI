import React, { useState } from 'react';
import { PaymentApprovalWorkflow } from './index';
import { toast } from '@/hooks/use-toast';

export default function PaymentApprovalExample() {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const handleBatchSelected = (batchId: string) => {
    setSelectedBatchId(batchId);
    toast({
      title: "Batch Selected",
      description: `You selected batch ID: ${batchId}`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payment Approval Dashboard</h1>
        {selectedBatchId && (
          <div className="text-sm bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded">
            Selected Batch ID: <code className="font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded text-xs">{selectedBatchId}</code>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <PaymentApprovalWorkflow 
          showStatistics={true}
          showFilters={true}
          defaultStatus="pending"
          onBatchSelected={handleBatchSelected}
        />
      </div>
    </div>
  );
}