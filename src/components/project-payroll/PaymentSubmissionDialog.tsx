import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '../../lib/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { logUtils } from '@/lib/activity-logger';
import { supabase } from '@/lib/supabase';
import { 
  Calendar as CalendarIcon,
  Building2,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  X,
  Copy,
  Download,
  DollarSign,
  ArrowRight,
  FileText,
  Building
} from "lucide-react";

// Import payment queue service
import { 
  submitPaymentBatch, 
  generateBatchReference, 
  PaymentMethod,
  calculateBatchTotal 
} from "@/lib/payment-queue-service";

// Import DuitNow export component
import { DuitNowPaymentExport, DuitNowPaymentExportProps } from "@/components/duitnow-payment-export";

// Types
export interface StaffPaymentSummary {
  staffId: string;
  staffName: string;
  bankCode?: string;
  bankAccountNumber?: string;
  email?: string;
  phone?: string;
  amount: number;
  totalDays?: number;
  workingDates?: string[];
  payrollDetails?: Record<string, unknown>;
}

export interface PaymentSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  staffPaymentSummaries: StaffPaymentSummary[];
  paymentDate?: Date;
  onSuccess?: (batchId: string) => void;
}

export function PaymentSubmissionDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  staffPaymentSummaries,
  paymentDate = new Date(),
  onSuccess
}: PaymentSubmissionDialogProps) {
  const { toast } = useToast();
  
  // Workflow state
  const [step, setStep] = useState<'form' | 'confirm' | 'processing' | 'success' | 'error'>('form');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  // Form state
  const [companyName, setCompanyName] = useState('');
  const [companyRegistrationNumber, setCompanyRegistrationNumber] = useState('');
  const [companyBankAccount, setCompanyBankAccount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('duitnow');
  const [notes, setNotes] = useState('');
  const [effectivePaymentDate, setEffectivePaymentDate] = useState<Date>(paymentDate);
  
  // Result state
  const [batchReference, setBatchReference] = useState('');
  const [batchId, setBatchId] = useState('');
  const [hasCopiedBatchId, setHasCopiedBatchId] = useState(false);
  const [showDuitNowExport, setShowDuitNowExport] = useState(false);
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep('form');
      setSubmissionError(null);
      setHasCopiedBatchId(false);
    } else {
      // Reset form values when dialog closes
      setCompanyName('');
      setCompanyRegistrationNumber('');
      setCompanyBankAccount('');
      setPaymentMethod('duitnow');
      setNotes('');
      setEffectivePaymentDate(paymentDate);
    }
  }, [open, paymentDate]);
  
  // Calculate total payment amount
  const totalPaymentAmount = calculateBatchTotal(staffPaymentSummaries);
  
  // Check for staff with missing bank details
  const staffWithMissingBankDetails = staffPaymentSummaries.filter(
    staff => !staff.bankCode || !staff.bankAccountNumber
  );
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Fetch existing batch references for this project
      const { data: existingBatches } = await supabase
        .from('payment_batches')
        .select('batch_reference')
        .eq('project_id', projectId);
      
      const existingReferences = existingBatches?.map(b => b.batch_reference) || [];
      
      // Generate batch reference using project name
      const tempBatchRef = generateBatchReference(projectName, existingReferences);
      setBatchReference(tempBatchRef);
      
      // Log payment submission initiation
      logUtils.action('submit_payment', false, {
        staff_count: staffPaymentSummaries.length,
        total_amount: staffPaymentSummaries.reduce((sum, staff) => sum + staff.totalAmount, 0),
        payment_date: effectivePaymentDate?.toISOString(),
        project_id: projectId
      });
      
      // Move to confirmation step
      setStep('confirm');
    } catch (error) {
      logger.error('Error in form submission:', error);
      setSubmissionError(error.message || 'An unexpected error occurred');
      setStep('error');
    }
  };
  
  // Handle actual payment submission to API
  const handleConfirmSubmission = async () => {
    try {
      // Validate bank details before submission
      if (staffWithMissingBankDetails.length > 0) {
        setSubmissionError(`Cannot proceed: ${staffWithMissingBankDetails.length} staff member(s) have missing bank details`);
        setStep('error');
        return;
      }
      
      setStep('processing');
      
      // Submit payment batch
      const result = await submitPaymentBatch(
        projectId,
        effectivePaymentDate,
        staffPaymentSummaries.map(staff => ({
          staffId: staff.staffId,
          staffName: staff.staffName,
          bankCode: staff.bankCode,
          bankAccountNumber: staff.bankAccountNumber,
          amount: staff.amount,
          totalDays: staff.totalDays,
          workingDates: staff.workingDates,
          payrollDetails: {
            ...staff.payrollDetails,
            email: staff.email,
            phone: staff.phone
          }
        })),
        {
          name: companyName || 'N/A',
          registrationNumber: companyRegistrationNumber || 'N/A',
          bankAccount: companyBankAccount || 'N/A'
        },
        paymentMethod,
        notes
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit payment batch');
      }
      
      // Store batch ID for success view
      setBatchId(result.batchId);
      
      // Log successful payment submission
      logUtils.action('submit_payment', true, {
        staff_count: staffPaymentSummaries.length,
        total_amount: staffPaymentSummaries.reduce((sum, staff) => sum + staff.totalAmount, 0),
        payment_date: effectivePaymentDate?.toISOString(),
        project_id: projectId,
        batch_id: result.batchId,
        payment_method: paymentMethod
      });
      
      // Trigger success callback if provided
      if (onSuccess) {
        onSuccess(result.batchId);
      }
      
      // Show success view
      setStep('success');
      
      // Show success toast
      toast({
        title: "Payment Submitted",
        description: `Payment batch ${batchReference} has been submitted successfully`,
      });
    } catch (error) {
      logger.error('Error submitting payment:', error);
      setSubmissionError(error.message || 'An unexpected error occurred');
      setStep('error');
      
      // Log failed payment submission
      logUtils.action('submit_payment', false, {
        staff_count: staffPaymentSummaries.length,
        total_amount: staffPaymentSummaries.reduce((sum, staff) => sum + staff.totalAmount, 0),
        project_id: projectId,
        error_message: error.message || 'Unknown error'
      });
      
      // Show error toast
      toast({
        title: "Submission Failed",
        description: error.message || 'Failed to submit payment batch',
        variant: "destructive"
      });
    }
  };
  
  // Handle dialog close
  const handleClose = () => {
    // If we're in success state and onSuccess was called, we can close safely
    if (step === 'success' && onSuccess) {
      onOpenChange(false);
      return;
    }
    
    // If we're in the middle of processing, don't allow closing
    if (step === 'processing') {
      return;
    }
    
    // If we're in error or confirmation state, allow going back
    if (step === 'error' || step === 'confirm') {
      setStep('form');
      return;
    }
    
    // Otherwise, close the dialog
    onOpenChange(false);
  };
  
  // Handle copying batch ID
  const copyBatchId = () => {
    navigator.clipboard.writeText(batchId)
      .then(() => {
        setHasCopiedBatchId(true);
        setTimeout(() => setHasCopiedBatchId(false), 2000);
      })
      .catch(err => {
        logger.error('Failed to copy batch ID:', err);
      });
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 border-b border-blue-100 dark:border-blue-900/50 flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
              {step === 'success' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Payment Submitted Successfully
                </>
              ) : step === 'error' ? (
                <>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Payment Submission Failed
                </>
              ) : step === 'processing' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Payment Submission
                </>
              ) : step === 'confirm' ? (
                <>
                  <Clock className="w-5 h-5" />
                  Confirm Payment Submission
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" />
                  Submit Payment for Approval
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-blue-600 dark:text-blue-400">
              {step === 'success' ? 'Your payment has been submitted for approval' : 
               step === 'error' ? 'There was a problem submitting your payment' :
               step === 'processing' ? 'Please wait while we process your submission' :
               step === 'confirm' ? 'Please review the payment details before confirming' :
               'Submit staff payments for approval and processing'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto p-6 flex-1">
            <AnimatePresence mode="wait">
              {step === 'form' && (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Payment Details Section */}
                  <div className="grid grid-cols-1 gap-6">
                    <Card className="shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-blue-500" />
                          Payment Details
                        </CardTitle>
                        <CardDescription>
                          Set the payment date and optional notes
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="payment-date">Payment Date</Label>
                            <DatePicker
                              date={effectivePaymentDate}
                              onDateChange={(date) => {
                                if (date) {
                                  setEffectivePaymentDate(date);
                                }
                              }}
                              placeholder="Select payment date"
                              buttonClassName="w-full pl-3 text-left font-normal flex justify-between items-center border-slate-200 dark:border-slate-700"
                              align="start"
                              fromDate={new Date(new Date().setHours(0, 0, 0, 0))}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="payment-notes">Notes (Optional)</Label>
                          <Textarea 
                            id="payment-notes" 
                            placeholder="Add any additional notes or references"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Staff Payment Details */}
                    <Card className="bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-500" />
                            <span>Staff Payment Details</span>
                            <Badge 
                              variant="outline" 
                              className="ml-2 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                            >
                              {staffPaymentSummaries.length} Staff
                            </Badge>
                          </CardTitle>
                          <Badge 
                            className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                          >
                            Total: RM {totalPaymentAmount.toLocaleString()}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                              <TableHead className="font-semibold">Staff Name</TableHead>
                              <TableHead className="text-right font-semibold">Amount</TableHead>
                              <TableHead className="text-center font-semibold">Days</TableHead>
                              <TableHead className="font-semibold">Bank Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {staffPaymentSummaries.map((staff, index) => {
                              const hasMissingBankDetails = !staff.bankCode || !staff.bankAccountNumber;
                              
                              return (
                                <TableRow
                                  key={staff.staffId}
                                  className={hasMissingBankDetails ? 
                                    "bg-amber-50 dark:bg-amber-950/10" : 
                                    "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                  }
                                >
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white text-xs">
                                          {staff.staffName.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium">{staff.staffName}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="font-medium">
                                      RM {staff.amount.toLocaleString()}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {staff.totalDays || '—'}
                                  </TableCell>
                                  <TableCell>
                                    {hasMissingBankDetails ? (
                                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Missing bank details
                                      </Badge>
                                    ) : (
                                      <div className="text-sm text-slate-600 dark:text-slate-400">
                                        {staff.bankCode} · {staff.bankAccountNumber}
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {staffWithMissingBankDetails.length > 0 && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/10 border-t border-amber-200 dark:border-amber-800">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                Missing Bank Details
                              </p>
                              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                {staffWithMissingBankDetails.length} staff members are missing bank details. You can still submit the payment, but you'll need to update their details before exporting.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                </motion.div>
              )}
              
              {step === 'confirm' && (
                <motion.div 
                  key="confirm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <Card className="shadow-sm overflow-hidden">
                    <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                      <CardTitle className="text-base">
                        Please confirm the following payment details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Project</h3>
                            <p className="text-base font-semibold">{projectName}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Batch Reference</h3>
                            <p className="text-base font-semibold">{batchReference}</p>
                          </div>
                        </div>
                        
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Payment Date</h3>
                            <p className="text-base font-semibold">{format(effectivePaymentDate, 'PPP')}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Amount</h3>
                            <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                              RM {totalPaymentAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Staff Payments</h3>
                          <p className="text-base font-semibold">{staffPaymentSummaries.length} Staff Members</p>
                          {staffWithMissingBankDetails.length > 0 && (
                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                              {staffWithMissingBankDetails.length} staff members are missing bank details
                            </p>
                          )}
                        </div>
                        
                        {notes && (
                          <div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Notes</h3>
                            <p className="text-base">{notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 dark:bg-gray-900 flex flex-col gap-4 sm:flex-row p-4">
                      <Button 
                        variant="outline" 
                        className="w-full sm:w-auto"
                        onClick={() => setStep('form')}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Back to Edit
                      </Button>
                      <Button 
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                        onClick={handleConfirmSubmission}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Confirm Submission
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )}
              
              {step === 'processing' && (
                <motion.div 
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                    <h2 className="text-xl font-medium">Processing Payment Submission</h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                      Please wait while we submit your payment batch for approval. This may take a few moments.
                    </p>
                  </div>
                </motion.div>
              )}
              
              {step === 'success' && (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center py-6">
                    <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
                      <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  
                  <div className="text-center max-w-md mx-auto">
                    <h2 className="text-xl font-medium">Payment Submitted Successfully</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                      Your payment batch has been submitted and is now pending approval from the finance team.
                    </p>
                  </div>
                  
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Batch ID</h3>
                            <div className="flex items-center gap-2">
                              <p className="text-base font-mono">{batchId}</p>
                              <button 
                                onClick={copyBatchId}
                                className="text-blue-500 hover:text-blue-700 transition-colors"
                              >
                                {hasCopiedBatchId ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Pending Approval
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Amount</h3>
                            <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                              RM {totalPaymentAmount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Staff Count</h3>
                            <p className="text-base font-semibold">{staffPaymentSummaries.length} Staff Members</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-slate-200 dark:border-slate-700 pt-4">
                      <div className="w-full">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          What would you like to do next?
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            variant="outline" 
                            className="w-full sm:w-auto"
                            onClick={() => onOpenChange(false)}
                          >
                            Close
                          </Button>
                          <Button 
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                            onClick={() => setShowDuitNowExport(true)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Export Payment File
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              )}
              
              {step === 'error' && (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center py-6">
                    <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-3">
                      <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  
                  <div className="text-center max-w-md mx-auto">
                    <h2 className="text-xl font-medium">Payment Submission Failed</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                      There was a problem submitting your payment batch. Please try again.
                    </p>
                  </div>
                  
                  <Card className="shadow-sm border-red-200 dark:border-red-800">
                    <CardHeader className="pb-2 bg-red-50 dark:bg-red-900/20">
                      <CardTitle className="text-base text-red-700 dark:text-red-300">Error Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-red-600 dark:text-red-400">
                        {submissionError || 'An unexpected error occurred while submitting the payment'}
                      </p>
                    </CardContent>
                    <CardFooter className="border-t border-red-200 dark:border-red-800 pt-4">
                      <Button 
                        className="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-800"
                        onClick={() => setStep('form')}
                      >
                        Try Again
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {step === 'form' && (
            <DialogFooter className="p-4 flex-shrink-0 border-t border-slate-200 dark:border-slate-700">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSubmit}
                disabled={false}
              >
                Continue
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      
      {/* DuitNow Payment Export Dialog */}
      {showDuitNowExport && (
        <DuitNowPaymentExport
          open={showDuitNowExport}
          onOpenChange={setShowDuitNowExport}
          projectId={projectId}
          projectName={projectName}
          staffPayrollEntries={staffPaymentSummaries.map(summary => ({
            staffId: summary.staffId,
            staff_id: summary.staffId,
            staffName: summary.staffName,
            workingSummary: {
              name: summary.staffName,
              totalDays: summary.totalDays || 0,
              totalBasicSalary: 0,
              totalClaims: 0,
              totalCommission: 0,
              totalAmount: summary.amount
            },
            bankCode: summary.bankCode,
            accountNumber: summary.bankAccountNumber,
            email: summary.email,
            phone: summary.phone,
            workingDatesWithSalary: []
          }))}
          paymentDate={effectivePaymentDate}
        />
      )}
    </>
  );
}

export default PaymentSubmissionDialog;