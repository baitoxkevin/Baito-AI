import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  generateECPExport,
  ECPExportOptions,
  PaymentBatchDetails,
  getSupportedBanks,
  getSupportedCountryCodes
} from '@/lib/payment-queue-service';

interface ECPExportDialogProps {
  batch: PaymentBatchDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ECPExportDialog({
  batch,
  open,
  onOpenChange
}: ECPExportDialogProps) {
  const [transactionType, setTransactionType] = useState<'IBG' | 'RENTAS' | 'DUITNOW'>('DUITNOW');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [enrichedBatch, setEnrichedBatch] = useState<PaymentBatchDetails | null>(batch);
  const [isFetchingICNumbers, setIsFetchingICNumbers] = useState(false);
  const { toast } = useToast();

  // Fetch missing IC numbers from candidates table for existing batches
  useEffect(() => {
    const fetchMissingICNumbers = async () => {
      if (!batch || !open || !batch.payments) return;

      // Check if any payments are missing IC numbers
      const paymentsNeedingIC = batch.payments.filter(p => !p.ic_number || p.ic_number.trim() === '');

      if (paymentsNeedingIC.length === 0) {
        // All payments already have IC numbers
        setEnrichedBatch(batch);
        return;
      }

      try {
        setIsFetchingICNumbers(true);

        // Extract unique staff IDs that need IC numbers
        const staffIds = [...new Set(paymentsNeedingIC.map(p => p.staff_id))];

        // Fetch IC numbers from candidates table
        const { data: candidates, error } = await supabase
          .from('candidates')
          .select('id, ic_number')
          .in('id', staffIds);

        if (error) {
          console.error('Error fetching IC numbers:', error);
          setEnrichedBatch(batch);
          return;
        }

        // Create IC lookup map
        const icMap = new Map(
          candidates?.map(c => [c.id, c.ic_number || '']) || []
        );

        // Enrich payments with IC numbers from candidates table
        const enrichedPayments = batch.payments.map(payment => ({
          ...payment,
          ic_number: payment.ic_number || icMap.get(payment.staff_id) || ''
        }));

        // Update enriched batch
        setEnrichedBatch({
          ...batch,
          payments: enrichedPayments
        });

        // Log enrichment activity
        const fetchedCount = enrichedPayments.filter(p =>
          !batch.payments.find(orig => orig.id === p.id)?.ic_number && p.ic_number
        ).length;

        if (fetchedCount > 0) {
          console.log(`Enriched ${fetchedCount} payment(s) with IC numbers from candidates table`);
        }

      } catch (error) {
        console.error('Error enriching batch with IC numbers:', error);
        setEnrichedBatch(batch);
      } finally {
        setIsFetchingICNumbers(false);
      }
    };

    fetchMissingICNumbers();
  }, [batch, open]);

  if (!batch) return null;

  // Use enriched batch for all calculations and display
  const activeBatch = enrichedBatch || batch;

  // Check for payments missing required fields
  const paymentsWithoutIC = activeBatch.payments.filter(p => !p.ic_number).length;
  const paymentsWithoutBankDetails = activeBatch.payments.filter(p => !p.bank_account_number).length;
  const paymentsWithPassport = activeBatch.payments.filter(p =>
    p.ic_number && /[A-Za-z]/.test(p.ic_number)
  ).length;

  const handleExport = async () => {
    try {
      setIsGenerating(true);

      // Generate unique batch reference
      const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
      const batchRef = `ECP-${activeBatch.batch_reference}-${timestamp}`;

      const options: ECPExportOptions = {
        transactionType,
        paymentDate,
        batchReference: batchRef
      };

      // Generate ECP file
      const blob = await generateECPExport(activeBatch, options);

      // Download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${batchRef}_${transactionType}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success message
      toast({
        title: 'Export Successful',
        description: `ECP file generated: ${a.download}`,
      });

      // Log export activity
      console.log('ECP Export completed:', {
        batchId: activeBatch.id,
        transactionType,
        paymentDate: format(paymentDate, 'yyyy-MM-dd'),
        filename: a.download
      });

      onOpenChange(false);

    } catch (error: any) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to generate ECP file',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isValidForExport = () => {
    // For DuitNow, all payments must have IC/ID
    if (transactionType === 'DUITNOW' && paymentsWithoutIC > 0) return false;
    // For IBG, need bank details
    if (transactionType === 'IBG' && paymentsWithoutBankDetails > 0) return false;
    // For RENTAS, need both bank details and IC
    if (transactionType === 'RENTAS' && (paymentsWithoutIC > 0 || paymentsWithoutBankDetails > 0)) return false;
    return true;
  };

  // Calculate total amount
  const totalAmount = activeBatch.payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export to ECP File
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* IC Number Fetching Status */}
          {isFetchingICNumbers && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertDescription>
                Fetching missing IC numbers from database...
              </AlertDescription>
            </Alert>
          )}

          {/* Batch Summary */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Batch Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Batch Reference:</span>
                <span className="ml-2 font-medium">{activeBatch.batch_reference}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Total Payments:</span>
                <span className="ml-2 font-medium">{activeBatch.payments.length}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                <span className="ml-2 font-medium">RM {totalAmount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Project:</span>
                <span className="ml-2 font-medium">{activeBatch.project_name || activeBatch.project_id}</span>
              </div>
            </div>
          </div>

          {/* Missing Bank Details Warning */}
          {paymentsWithoutBankDetails > 0 && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <strong>Error:</strong> {paymentsWithoutBankDetails} payment(s) are missing bank account details.
                All payments must have bank account numbers for ECP export.
              </AlertDescription>
            </Alert>
          )}

          {/* Transaction Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="transaction-type">Transaction Type</Label>
            <Select
              value={transactionType}
              onValueChange={(value) => setTransactionType(value as 'IBG' | 'RENTAS' | 'DUITNOW')}
            >
              <SelectTrigger id="transaction-type">
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DUITNOW">
                  <div className="flex flex-col">
                    <span className="font-medium">DuitNow - Instant Transfer (Recommended)</span>
                    <span className="text-xs text-gray-500">Instant transfer using IC/Passport</span>
                  </div>
                </SelectItem>
                <SelectItem value="IBG">
                  <div className="flex flex-col">
                    <span className="font-medium">IBG - Interbank GIRO</span>
                    <span className="text-xs text-gray-500">Next business day transfer</span>
                  </div>
                </SelectItem>
                <SelectItem value="RENTAS">
                  <div className="flex flex-col">
                    <span className="font-medium">RENTAS - Real-time Transfer</span>
                    <span className="text-xs text-gray-500">Immediate high-value payments</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {/* Show description based on selection */}
            {transactionType === 'DUITNOW' && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Instant transfer using IC/Passport or mobile number. Most cost-effective for local payments.
              </p>
            )}
            {transactionType === 'IBG' && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Standard interbank transfer. Processed next business day.
              </p>
            )}
            {transactionType === 'RENTAS' && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Immediate transfer for urgent or high-value payments. Requires beneficiary IC number.
              </p>
            )}
          </div>

          {/* DuitNow ID Warning */}
          {transactionType === 'DUITNOW' && paymentsWithoutIC > 0 && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <strong>Error:</strong> {paymentsWithoutIC} payment(s) are missing ID numbers.
                Recipient ID (IC/Passport) is mandatory for all DuitNow transactions.
              </AlertDescription>
            </Alert>
          )}

          {/* DuitNow Passport Info */}
          {transactionType === 'DUITNOW' && paymentsWithPassport > 0 && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>Info:</strong> {paymentsWithPassport} payment(s) appear to use passport numbers.
                3-digit country codes will be automatically appended (e.g., MYS for Malaysia).
              </AlertDescription>
            </Alert>
          )}

          {/* RENTAS IC Warning */}
          {transactionType === 'RENTAS' && paymentsWithoutIC > 0 && (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                <strong>Warning:</strong> {paymentsWithoutIC} payment(s) are missing IC numbers.
                Beneficiary ID is mandatory for all RENTAS transactions.
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Date Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Payment Date</Label>
            <Calendar
              mode="single"
              selected={paymentDate}
              onSelect={(date) => date && setPaymentDate(date)}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today || date > addDays(today, 60);
              }}
              className="rounded-md border"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Payment date can be today or up to 60 days in advance. Cannot be backdated.
            </p>
          </div>


          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isGenerating || !isValidForExport()}
              className="min-w-[120px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate ECP
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}