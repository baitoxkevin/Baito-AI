import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ReceiptScanner from '@/components/ReceiptScanner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import type { ReceiptData } from '@/lib/receipt-service';

export default function ReceiptScannerPage() {
  const [scannedReceipts, setScannedReceipts] = useState<ReceiptData[]>([]);
  
  // Demo user ID - in a real app this would come from authentication
  const demoUserId = '00000000-0000-0000-0000-000000000000';
  
  // Handle receipt data from the scanner
  const handleReceiptScanned = (data: ReceiptData) => {
    setScannedReceipts(prev => [data, ...prev]);
  };
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold mt-2">Receipt Scanner</h1>
      </div>
      
      {/* Receipt Scanner Component */}
      <div className="mb-8">
        <ReceiptScanner 
          onReceiptScanned={handleReceiptScanned}
          userId={demoUserId}
        />
      </div>
      
      {/* List of scanned receipts */}
      {scannedReceipts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Recent Scans ({scannedReceipts.length})</h2>
          
          <div className="grid gap-4">
            {scannedReceipts.map((receipt, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-gray-50 pb-3">
                  <CardTitle className="text-lg flex justify-between">
                    <span>{receipt.vendor}</span>
                    <span className="text-green-600">${receipt.amount.toFixed(2)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600">{receipt.date}</p>
                      <p className="text-sm mt-1">{receipt.description}</p>
                      {receipt.category && (
                        <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                          {receipt.category}
                        </span>
                      )}
                    </div>
                    
                    {receipt.image_url && (
                      <a 
                        href={receipt.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 shrink-0"
                      >
                        <div 
                          className="w-16 h-16 bg-gray-100 border rounded overflow-hidden"
                          style={{
                            backgroundImage: `url(${receipt.image_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setScannedReceipts([])}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {scannedReceipts.length === 0 && (
        <div className="mt-8 p-6 border border-dashed rounded-lg text-center text-gray-500">
          <p>No receipts scanned yet. Use the scanner above to get started.</p>
        </div>
      )}

      {/* Include Toaster component for notifications (optional since it's in App.tsx,
          but useful for testing this page in isolation) */}
      <Toaster />
    </div>
  );
}