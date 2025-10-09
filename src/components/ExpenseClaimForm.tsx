import { useState, useEffect } from 'react';
import { logger } from '../lib/logger';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ExpenseClaim } from '@/lib/expense-claim-service';
import { Receipt } from '@/lib/receipt-service';
import { CheckCircle2, Plus, Receipt as ReceiptIcon, Trash2, ScanLine, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { fetchUserReceipts, addReceipt } from '@/lib/receipt-service';
import { useExpenseClaims } from '@/hooks/use-expense-claims';
import { useAutosaveExpenseClaim } from '@/hooks/use-autosave-expense-claim';
import { useToast } from '@/hooks/use-toast';
import { ReceiptValidator } from './ReceiptValidator';

// Schema for expense claim form
const formSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters' }),
  description: z.string().optional(),
  project_id: z.string().optional().transform(val => val === 'no-project' ? undefined : val),
  approver_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseClaimFormProps {
  initialData?: Partial<ExpenseClaim>;
  projects?: Array<{ id: string; title: string }>;
  approvers?: Array<{ id: string; name: string; email: string }>;
  onSubmit?: (values: FormValues) => Promise<void>;
  onCancel?: () => void;
}

export function ExpenseClaimForm({
  initialData,
  projects = [],
  approvers = [],
  onSubmit,
  onCancel,
}: ExpenseClaimFormProps) {
  const [availableReceipts, setAvailableReceipts] = useState<Receipt[]>([]);
  const [selectedReceipts, setSelectedReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [isValidatorOpen, setIsValidatorOpen] = useState(false);
  const { toast } = useToast();

  const {
    currentClaim,
    currentClaimReceipts,
    addReceiptToClaim,
    removeReceiptFromClaim,
  } = useExpenseClaims({ autoFetch: false });

  // Set up form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      project_id: initialData?.project_id || '',
      approver_id: initialData?.approver_id || '',
    },
  });

  // Fetch available receipts
  useEffect(() => {
    const loadReceipts = async () => {
      try {
        setLoading(true);
        // Fetch user receipts that aren't already claimed elsewhere
        const receipts = await fetchUserReceipts();
        
        // If editing an existing claim, we need to filter out receipts that are already in this claim
        if (currentClaimReceipts?.length) {
          setSelectedReceipts(currentClaimReceipts);
          
          // Filter out receipts that are already in this claim or any other claim
          // const availableReceiptIds = new Set(receipts.map(r => r.id));
          const claimedReceiptIds = new Set(currentClaimReceipts.map(r => r.id));
          
          // Only show receipts that are not in the current claim
          const filteredReceipts = receipts.filter(receipt => 
            !claimedReceiptIds.has(receipt.id!)
          );
          
          setAvailableReceipts(filteredReceipts);
        } else {
          // If creating a new claim, show all unclaimed receipts
          setAvailableReceipts(receipts);
        }
      } catch (_error) {
        // logger.error('Failed to load receipts:', _error);
      } finally {
        setLoading(false);
      }
    };

    loadReceipts();
  }, [currentClaimReceipts]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };
  
  // Safe date formatting
  const formatSafeDate = (dateString: string | undefined) => {
    if (!dateString) return 'No date';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (_error) {
      // logger.warn('Invalid date format:', dateString);
      return 'Invalid Date';
    }
  };

  // Handle adding a receipt to the claim
  const handleAddReceipt = async (receipt: Receipt) => {
    // If we're editing an existing claim
    if (currentClaim?.id) {
      try {
        await addReceiptToClaim(receipt.id!, receipt.amount);
        // Receipt will be added to currentClaimReceipts via the hook
        // and removed from availableReceipts in the next render
      } catch (error) {
        logger.error('Failed to add receipt:', error);
      }
    } else {
      // If creating a new claim, just update the local state
      setSelectedReceipts(prev => [...prev, receipt]);
      setAvailableReceipts(prev => prev.filter(r => r.id !== receipt.id));
    }
  };

  // Handle removing a receipt from the claim
  const handleRemoveReceipt = async (receipt: Receipt) => {
    // If editing an existing claim
    if (currentClaim?.id) {
      try {
        await removeReceiptFromClaim(receipt.id!);
        // Receipt will be removed from currentClaimReceipts via the hook
        // and added back to availableReceipts in the next render
      } catch (error) {
        logger.error('Failed to remove receipt:', error);
      }
    } else {
      // If creating a new claim, just update the local state
      setSelectedReceipts(prev => prev.filter(r => r.id !== receipt.id));
      setAvailableReceipts(prev => [...prev, receipt]);
    }
  };

  // Calculate total amount
  const totalAmount = selectedReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);

  // Handle receipt validation and addition via OCR
  const handleReceiptValidated = async (validatedReceipt: Receipt) => {
    try {
      // First, save the receipt to the database
      const savedReceipt = await addReceipt({
        ...validatedReceipt,
        user_id: validatedReceipt.user_id || 'current-user-id' // Fallback value
      });

      // Add to our local state
      setAvailableReceipts(prev => [savedReceipt, ...prev]);

      toast({
        title: "Receipt added successfully",
        description: `${validatedReceipt.vendor}: ${new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(validatedReceipt.amount)}`,
      });
    } catch (error) {
      logger.error('Failed to add validated receipt:', error);
      toast({
        title: "Failed to add receipt",
        description: "There was an error saving the validated receipt.",
        variant: "destructive",
      });
    }
  };

  // Auto-save form changes if we have an existing claim
  const { isSaving: _isSaving, saveStatus } = useAutosaveExpenseClaim({
    claimId: initialData?.id || '',
    data: {
      title: form.watch('title'),
      description: form.watch('description'),
      project_id: form.watch('project_id'),
    },
    enabled: !!initialData?.id, // Only enable autosave when editing an existing claim
    silentSave: true, // Don't show toast for every save
  });

  // Handle form submission
  const handleFormSubmit = async (values: FormValues) => {
    if (onSubmit) {
      if (selectedReceipts.length === 0) {
        toast({
          title: "No receipts added",
          description: "Please add at least one receipt to your expense claim.",
          variant: "destructive",
        });
        return;
      }

      try {
        await onSubmit(values);
        // After the expense claim is created, receipts can be added
      } catch (error) {
        logger.error('Failed to submit form:', error);
      }
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{initialData?.id ? 'Edit Expense Claim' : 'New Expense Claim'}</CardTitle>
          <CardDescription>
            {initialData?.id
              ? 'Update your expense claim details and receipts'
              : 'Create a new expense claim by providing details and attaching receipts'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Claim Details</TabsTrigger>
              <TabsTrigger value="receipts">
                Receipts ({selectedReceipts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Business Trip to Kuala Lumpur" {...field} />
                        </FormControl>
                        <FormDescription>
                          A clear title for this expense claim
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter additional details about this expense claim..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Additional information about the expenses
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="project_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || 'no-project'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no-project">No Project</SelectItem>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Link this expense claim to a project
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!initialData?.id && (
                    <FormField
                      control={form.control}
                      name="approver_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Approver</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an approver" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {approvers.map((approver) => (
                                <SelectItem key={approver.id} value={approver.id}>
                                  {approver.name} ({approver.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Who should approve this expense claim
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-500">Total Amount</span>
                      <span className="text-xl font-bold">{formatCurrency(totalAmount)}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      This total is calculated from the receipts you've added to this claim.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={selectedReceipts.length === 0}>
                      {initialData?.id ? 'Update Claim' : 'Create Claim'}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="receipts">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Selected Receipts</h3>
                  {selectedReceipts.length > 0 ? (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {selectedReceipts.map((receipt) => (
                          <div
                            key={receipt.id}
                            className="flex items-center justify-between p-3 border rounded-md bg-green-50"
                          >
                            <div className="flex items-center">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                              <div>
                                <p className="font-medium">{receipt.vendor}</p>
                                <p className="text-xs text-gray-500">
                                  {formatSafeDate(receipt.date)} • {receipt.category || 'Uncategorized'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className="font-bold mr-4">{formatCurrency(receipt.amount)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveReceipt(receipt)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center border rounded-md bg-gray-50">
                      <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium">No receipts added</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Add receipts from your available receipts below
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">Available Receipts</h3>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1"
                      onClick={() => setIsValidatorOpen(true)}
                    >
                      <ScanLine className="h-4 w-4" />
                      <span>Add Receipt with OCR</span>
                    </Button>
                  </div>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-pulse text-center">
                        <div className="h-6 w-32 bg-gray-200 rounded mx-auto mb-2"></div>
                        <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
                      </div>
                    </div>
                  ) : availableReceipts.length > 0 ? (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {availableReceipts.map((receipt) => (
                          <div
                            key={receipt.id}
                            className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                          >
                            <div className="flex items-center">
                              <ReceiptIcon className="h-5 w-5 text-gray-400 mr-2" />
                              <div>
                                <p className="font-medium">{receipt.vendor}</p>
                                <p className="text-xs text-gray-500">
                                  {formatSafeDate(receipt.date)} • {receipt.category || 'Uncategorized'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className="font-bold mr-4">{formatCurrency(receipt.amount)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddReceipt(receipt)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4 text-green-500" />
                                <span className="sr-only">Add</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center border rounded-md bg-gray-50">
                      <ReceiptIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium">No receipts available</h3>
                      <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                        Click "Add Receipt with OCR" to scan and add a receipt. The OCR system will automatically extract details from your receipt image.
                      </p>
                      <Button
                        size="sm"
                        className="mt-4 gap-1"
                        onClick={() => setIsValidatorOpen(true)}
                      >
                        <ScanLine className="h-4 w-4" />
                        Add Receipt with OCR
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">
            {selectedReceipts.length} receipt(s) • {formatCurrency(totalAmount)}
          </p>
          {initialData?.id && (
            <div className="text-sm">
              {saveStatus === 'saving' && (
                <span className="text-amber-500">Saving changes...</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-green-500">Changes saved</span>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-500">Failed to save</span>
              )}
            </div>
          )}
        </CardFooter>
      </Card>

      <ReceiptValidator
        open={isValidatorOpen}
        onOpenChange={setIsValidatorOpen}
        onReceiptValidated={handleReceiptValidated}
        userId={currentClaim?.user_id || 'current-user-id'} // Use actual user ID or fallback
      />
    </>
  );
}