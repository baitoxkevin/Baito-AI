import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/ui/amount-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { logger } from '@/lib/logger';
import {
  Receipt,
  FileText,
  Upload,
  X,
  Calendar,
  DollarSign,
  User,
  Loader2,
  Sparkles,
  ImageIcon,
} from "lucide-react";

interface ExpenseClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  staffId: string;
  staffName: string;
  claimDate: Date | string;
  currentAmount: string;
  onClaimSubmitted?: (newAmount: number) => void;
}

const EXPENSE_CATEGORIES = [
  { value: 'transportation', label: 'Transportation' },
  { value: 'meal', label: 'Meal' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'material', label: 'Material' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'communication', label: 'Communication' },
  { value: 'other', label: 'Other' },
];

export function ExpenseClaimDialog({
  open,
  onOpenChange,
  projectId,
  staffId,
  staffName,
  claimDate,
  currentAmount,
  onClaimSubmitted,
}: ExpenseClaimDialogProps) {
  const [isOwnClaim, setIsOwnClaim] = useState(true);
  const [title, setTitle] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(
    format(new Date(claimDate), 'yyyy-MM-dd')
  );
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = files.length + newFiles.length;
      
      if (totalFiles > 5) {
        toast({
          title: "Too many files",
          description: "Maximum 5 files allowed",
          variant: "destructive",
        });
        return;
      }

      // Check file size (max 5MB per file)
      const oversizedFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast({
          title: "File too large",
          description: "Each file must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !category || !amount) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Create expense claim
      const { data: claim, error: claimError } = await supabase
        .from('expense_claims')
        .insert({
          title,
          description,
          bill_number: billNumber,
          category,
          amount: parseFloat(amount),
          expense_date: expenseDate,
          project_id: projectId,
          staff_id: staffId,
          working_date: format(new Date(claimDate), 'yyyy-MM-dd'),
          claim_type: isOwnClaim ? 'own' : 'behalf',
          submitted_by: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (claimError) throw claimError;

      // Upload files if any
      if (files.length > 0 && claim) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${claim.id}_${Date.now()}.${fileExt}`;
          const filePath = `expense-claims/${projectId}/${staffId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(filePath, file);

          if (uploadError) {
            logger.error('File upload error:', uploadError);
          } else {
            // Save receipt record
            await supabase
              .from('receipts')
              .insert({
                expense_claim_id: claim.id,
                file_path: filePath,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
              });

            // Also save to project_documents for Documents page visibility
            const { error: docError } = await supabase
              .from('project_documents')
              .insert({
                project_id: projectId,
                name: `Expense Receipt - ${file.name}`,
                type: file.type || 'application/octet-stream',
                size: file.size,
                file_path: filePath,
                category: 'expense_receipt',
                description: `Receipt for expense claim: ${title} (${billNumber})`,
                uploaded_by: user.id,
                metadata: {
                  expense_claim_id: claim.id,
                  staff_id: staffId,
                  staff_name: staffName,
                  claim_date: claimDate,
                  bill_number: billNumber,
                  amount: parseFloat(amount),
                  category: category
                }
              });

            if (docError) {
              logger.warn('Failed to save document record:', docError);
              // Don't throw error as the main receipt was saved successfully
            }
          }
        }
      }

      // Calculate new total claims amount
      const { data: allClaims } = await supabase
        .from('expense_claims')
        .select('amount')
        .eq('project_id', projectId)
        .eq('staff_id', staffId)
        .eq('working_date', format(new Date(claimDate), 'yyyy-MM-dd'))
        .eq('status', 'approved');

      const totalApprovedAmount = allClaims?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      const pendingAmount = parseFloat(amount);
      const newTotalAmount = totalApprovedAmount + pendingAmount;

      toast({
        title: "✅ Expense claim submitted",
        description: `Claim for RM ${amount} has been submitted for approval`,
      });

      // Reset form
      setTitle('');
      setBillNumber('');
      setCategory('');
      setAmount('');
      setDescription('');
      setFiles([]);
      
      // Notify parent component
      if (onClaimSubmitted) {
        onClaimSubmitted(newTotalAmount);
      }

      onOpenChange(false);
    } catch (error) {
      logger.error('Error submitting expense claim:', error);
      toast({
        title: "Error",
        description: "Failed to submit expense claim",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Receipt className="h-5 w-5 text-purple-600" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
              New Expense Claim
            </span>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </DialogTitle>
          <DialogDescription>
            Submit project-related expenses for reimbursement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Staff and Date Info */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium">{staffName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-sm">{format(new Date(claimDate), 'PPP')}</span>
            </div>
          </div>

          {/* Claim Type Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="claim-type" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Claim Type
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Own Claim</span>
              <Switch
                id="claim-type"
                checked={isOwnClaim}
                onCheckedChange={setIsOwnClaim}
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter expense title"
              className="w-full"
            />
          </div>

          {/* Bill Number */}
          <div className="space-y-2">
            <Label htmlFor="bill-number">
              Bill/Receipt/Invoice Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bill-number"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              placeholder="Enter main bill/receipt/invoice number"
              className="w-full"
            />
            <p className="text-xs text-slate-500">One bill number for all related receipts</p>
          </div>

          {/* Category and Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount (RM) <span className="text-red-500">*</span>
              </Label>
              <AmountInput
                id="amount"
                value={amount}
                onChange={(value) => setAmount(value)}
                placeholder="0.00"
                currency="RM"
                preventSelectAll={true}
                formatOnBlur={true}
                minValue={0}
              />
            </div>
          </div>

          {/* Expense Date */}
          <div className="space-y-2">
            <Label htmlFor="expense-date">
              Expense Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="expense-date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional details"
              className="min-h-[80px]"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>
              <FileText className="inline h-4 w-4 mr-1" />
              Supporting Documents * (1-5 receipts)
            </Label>
            <div 
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Drop your files here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                or click to browse • Max 5 files • 5MB per file
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2 mt-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4 text-blue-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm truncate max-w-[300px]">
                        {file.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {(file.size / 1024).toFixed(1)} KB
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* File format badges */}
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">PDF</Badge>
              <Badge variant="outline" className="text-xs">JPG</Badge>
              <Badge variant="outline" className="text-xs">PNG</Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !category || !amount}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Receipt className="h-4 w-4 mr-2" />
                Submit Claim
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}