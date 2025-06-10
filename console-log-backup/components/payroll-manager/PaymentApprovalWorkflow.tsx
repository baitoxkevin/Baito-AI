import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardCheck,
  Calendar as CalendarIcon,
  CreditCard,
  Download,
  Users,
  Building,
  Search,
  Check,
  X,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  ChevronDown,
  Filter,
  RefreshCw,
  Copy,
  Ban,
  ExternalLink,
  Pencil,
  History,
} from "lucide-react";

// Import payment queue service
import {
  fetchPaymentBatches,
  getPaymentBatchDetails,
  getPaymentBatchHistory,
  approvePaymentBatch,
  rejectPaymentBatch,
  markPaymentBatchExported,
  markPaymentBatchCompleted,
  cancelPaymentBatch,
  updatePaymentBatchNotes,
  PaymentBatch,
  PaymentBatchStatus,
  PaymentItem,
  PaymentApprovalHistory,
  PaymentBatchDetails,
  formatDuitNowCsvData
} from '@/lib/payment-queue-service';

// Types
export interface PaymentApprovalWorkflowProps {
  initialStatus?: PaymentBatchStatus | 'all';
  onSelectBatch?: (batchId: string) => void;
  showStatistics?: boolean;
  allowApproval?: boolean;
  allowRejection?: boolean;
  allowExport?: boolean;
  allowCompletion?: boolean;
  allowCancel?: boolean;
  defaultItemsPerPage?: number;
  className?: string;
}

// Utility functions
const getBadgeColorForStatus = (status: PaymentBatchStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'approved':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'processing':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatCurrency = (amount: number) => {
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const StatusBadge = ({ status }: { status: PaymentBatchStatus }) => {
  const statusIcons = {
    pending: <Clock className="h-3 w-3 mr-1" />,
    approved: <Check className="h-3 w-3 mr-1" />,
    rejected: <X className="h-3 w-3 mr-1" />,
    processing: <Download className="h-3 w-3 mr-1" />,
    completed: <CheckCircle2 className="h-3 w-3 mr-1" />,
    cancelled: <Ban className="h-3 w-3 mr-1" />
  };

  return (
    <Badge className={getBadgeColorForStatus(status)}>
      {statusIcons[status]}
      <span className="capitalize">{status}</span>
    </Badge>
  );
};

// Main component
export function PaymentApprovalWorkflow({
  initialStatus = 'pending',
  onSelectBatch,
  showStatistics = true,
  allowApproval = true,
  allowRejection = true,
  allowExport = true,
  allowCompletion = true,
  allowCancel = true,
  defaultItemsPerPage = 10,
  className = ''
}: PaymentApprovalWorkflowProps) {
  const { toast } = useToast();
  
  // State for batch listing
  const [isLoading, setIsLoading] = useState(false);
  const [batches, setBatches] = useState<PaymentBatch[]>([]);
  const [totalBatches, setTotalBatches] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<PaymentBatchStatus | 'all'>(initialStatus);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // State for batch details
  const [selectedBatch, setSelectedBatch] = useState<PaymentBatchDetails | null>(null);
  const [batchHistory, setBatchHistory] = useState<PaymentApprovalHistory[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // State for action forms
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [updatedNotes, setUpdatedNotes] = useState('');
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  
  // State for filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [sortField, setSortField] = useState<'date' | 'amount' | 'project'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [hasCopiedBatchId, setHasCopiedBatchId] = useState(false);
  
  // Load batches on initial render and when filters change
  useEffect(() => {
    loadBatches();
  }, [selectedStatus, page, itemsPerPage, sortField, sortOrder]);
  
  // Function to load batches with current filters
  const loadBatches = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsLoading(true);
      } else if (page > 1) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      
      // Calculate offset
      const offset = (page - 1) * itemsPerPage;
      
      // Prepare filter params
      const filterParams: any = {
        limit: itemsPerPage,
        offset
      };
      
      // Add status filter if not 'all'
      if (selectedStatus !== 'all') {
        filterParams.status = selectedStatus;
      }
      
      // Add project filter if specified
      if (projectFilter) {
        filterParams.projectId = projectFilter;
      }
      
      // Add date filter if specified
      if (dateFilter) {
        filterParams.fromDate = dateFilter;
        filterParams.toDate = dateFilter;
      }
      
      // Fetch batches
      const result = await fetchPaymentBatches(filterParams);
      
      if (isRefresh || page === 1) {
        setBatches(result.data);
      } else {
        // Append to existing batches for pagination
        setBatches(prev => [...prev, ...result.data]);
      }
      
      setTotalBatches(result.count);
    } catch (error) {
      console.error('Error loading payment batches:', error);
      toast({
        title: "Error",
        description: "Failed to load payment batches",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };
  
  // Function to load batch details
  const loadBatchDetails = async (batchId: string) => {
    try {
      setIsLoadingDetails(true);
      setDetailsError(null);
      
      // Fetch batch details
      const result = await getPaymentBatchDetails(batchId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.data) {
        setSelectedBatch(result.data);
        setUpdatedNotes(result.data.notes || '');
        
        // Also fetch batch history
        const historyResult = await getPaymentBatchHistory(batchId);
        if (historyResult.error) {
          console.error('Error loading batch history:', historyResult.error);
        } else {
          setBatchHistory(historyResult.data);
        }
        
        // Show details dialog
        setShowDetailsDialog(true);
        
        // Call onSelectBatch if provided
        if (onSelectBatch) {
          onSelectBatch(batchId);
        }
      } else {
        throw new Error('Batch not found');
      }
    } catch (error) {
      console.error('Error loading batch details:', error);
      setDetailsError(error.message || 'Failed to load batch details');
      toast({
        title: "Error",
        description: error.message || 'Failed to load batch details',
        variant: "destructive"
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };
  
  // Function to approve a batch
  const handleApproveBatch = async () => {
    if (!selectedBatch) return;
    
    try {
      setIsApproving(true);
      
      // Call approve function
      const result = await approvePaymentBatch(selectedBatch.id, approvalNotes);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve batch');
      }
      
      // Show success message
      toast({
        title: "Batch Approved",
        description: "The payment batch has been approved successfully",
      });
      
      // Refresh batch details
      await loadBatchDetails(selectedBatch.id);
      
      // Refresh batches list
      await loadBatches(true);
      
      // Reset notes
      setApprovalNotes('');
    } catch (error) {
      console.error('Error approving batch:', error);
      toast({
        title: "Approval Failed",
        description: error.message || 'Failed to approve batch',
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };
  
  // Function to reject a batch
  const handleRejectBatch = async () => {
    if (!selectedBatch) return;
    
    try {
      setIsRejecting(true);
      
      // Call reject function
      const result = await rejectPaymentBatch(selectedBatch.id, approvalNotes);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reject batch');
      }
      
      // Show success message
      toast({
        title: "Batch Rejected",
        description: "The payment batch has been rejected",
      });
      
      // Refresh batch details
      await loadBatchDetails(selectedBatch.id);
      
      // Refresh batches list
      await loadBatches(true);
      
      // Reset notes
      setApprovalNotes('');
    } catch (error) {
      console.error('Error rejecting batch:', error);
      toast({
        title: "Rejection Failed",
        description: error.message || 'Failed to reject batch',
        variant: "destructive"
      });
    } finally {
      setIsRejecting(false);
    }
  };
  
  // Function to mark a batch as exported
  const handleMarkExported = async () => {
    if (!selectedBatch) return;
    
    try {
      setIsExporting(true);
      
      // Call mark exported function
      const result = await markPaymentBatchExported(selectedBatch.id, approvalNotes);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to mark batch as exported');
      }
      
      // Show success message
      toast({
        title: "Batch Marked as Exported",
        description: "The payment batch has been marked as exported",
      });
      
      // Refresh batch details
      await loadBatchDetails(selectedBatch.id);
      
      // Refresh batches list
      await loadBatches(true);
      
      // Reset notes
      setApprovalNotes('');
    } catch (error) {
      console.error('Error marking batch as exported:', error);
      toast({
        title: "Export Failed",
        description: error.message || 'Failed to mark batch as exported',
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Function to mark a batch as completed
  const handleMarkCompleted = async () => {
    if (!selectedBatch) return;
    
    try {
      setIsCompleting(true);
      
      // Call mark completed function
      const result = await markPaymentBatchCompleted(selectedBatch.id, approvalNotes);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to mark batch as completed');
      }
      
      // Show success message
      toast({
        title: "Batch Marked as Completed",
        description: "The payment batch has been marked as completed",
      });
      
      // Refresh batch details
      await loadBatchDetails(selectedBatch.id);
      
      // Refresh batches list
      await loadBatches(true);
      
      // Reset notes
      setApprovalNotes('');
    } catch (error) {
      console.error('Error marking batch as completed:', error);
      toast({
        title: "Completion Failed",
        description: error.message || 'Failed to mark batch as completed',
        variant: "destructive"
      });
    } finally {
      setIsCompleting(false);
    }
  };
  
  // Function to cancel a batch
  const handleCancelBatch = async () => {
    if (!selectedBatch) return;
    
    try {
      setIsCancelling(true);
      
      // Call cancel function
      const result = await cancelPaymentBatch(selectedBatch.id, approvalNotes);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel batch');
      }
      
      // Show success message
      toast({
        title: "Batch Cancelled",
        description: "The payment batch has been cancelled",
      });
      
      // Refresh batch details
      await loadBatchDetails(selectedBatch.id);
      
      // Refresh batches list
      await loadBatches(true);
      
      // Reset notes
      setApprovalNotes('');
    } catch (error) {
      console.error('Error cancelling batch:', error);
      toast({
        title: "Cancellation Failed",
        description: error.message || 'Failed to cancel batch',
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };
  
  // Function to update batch notes
  const handleUpdateNotes = async () => {
    if (!selectedBatch) return;
    
    try {
      setIsUpdatingNotes(true);
      
      // Call update notes function
      const result = await updatePaymentBatchNotes(selectedBatch.id, updatedNotes);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update notes');
      }
      
      // Show success message
      toast({
        title: "Notes Updated",
        description: "Batch notes have been updated",
      });
      
      // Refresh batch details
      await loadBatchDetails(selectedBatch.id);
      
      // Exit editing mode
      setEditingNotes(false);
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: "Update Failed",
        description: error.message || 'Failed to update notes',
        variant: "destructive"
      });
    } finally {
      setIsUpdatingNotes(false);
    }
  };
  
  // Function to export batch as CSV
  const handleExportCsv = () => {
    if (!selectedBatch) return;
    
    try {
      // Generate CSV data
      const csvData = formatDuitNowCsvData(selectedBatch, true);
      
      // Create a blob with the CSV data
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      const filename = `Payment_${selectedBatch.batch_reference}.csv`;
      
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "CSV Generated",
        description: `Generated payment file with ${selectedBatch.payment_items?.length || 0} entries`,
      });
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast({
        title: "Error",
        description: "Failed to generate CSV file",
        variant: "destructive"
      });
    }
  };
  
  // Copy batch ID to clipboard
  const copyBatchId = () => {
    if (!selectedBatch) return;
    
    navigator.clipboard.writeText(selectedBatch.id)
      .then(() => {
        setHasCopiedBatchId(true);
        setTimeout(() => setHasCopiedBatchId(false), 2000);
        
        toast({
          title: "Copied",
          description: "Batch ID copied to clipboard",
        });
      })
      .catch(err => {
        console.error('Failed to copy batch ID:', err);
      });
  };
  
  // Handle search
  const handleSearch = () => {
    // Reset page to 1 when searching
    setPage(1);
    loadBatches(true);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setProjectFilter('');
    setDateFilter(null);
    setPage(1);
    loadBatches(true);
  };
  
  // Toggle sort
  const toggleSort = (field: 'date' | 'amount' | 'project') => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and reset order to desc
      setSortField(field);
      setSortOrder('desc');
    }
  };
  
  // Memoized filtered and sorted batches
  const filteredSortedBatches = useMemo(() => {
    let result = [...batches];
    
    // Apply search term filter
    if (searchTerm) {
      result = result.filter(batch => 
        batch.batch_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort the results
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'amount':
          comparison = a.total_amount - b.total_amount;
          break;
        case 'project':
          comparison = (a.project_name || '').localeCompare(b.project_name || '');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [batches, searchTerm, sortField, sortOrder]);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalBatches / itemsPerPage);
  
  // Check if there are more pages
  const hasMorePages = page < totalPages;
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters and Actions Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as PaymentBatchStatus | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-9"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadBatches(true)}
            className="h-9"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(parseInt(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Items per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 per page</SelectItem>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {totalBatches > 0 ? (
              <span>
                Showing {Math.min((page - 1) * itemsPerPage + 1, totalBatches)}-
                {Math.min(page * itemsPerPage, totalBatches)} of {totalBatches}
              </span>
            ) : (
              <span>No batches found</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Additional filters */}
      {showFilters && (
        <Card className="bg-slate-50 dark:bg-slate-900">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="flex space-x-2">
                  <Input
                    id="search"
                    placeholder="Search batches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project">Project Filter</Label>
                <Input
                  id="project"
                  placeholder="Project ID"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date Filter</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full pl-3 text-left font-normal flex justify-between items-center"
                    >
                      {dateFilter ? (
                        format(dateFilter, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="h-4 w-4 opacity-70" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFilter || undefined}
                      onSelect={(date) => {
                        setDateFilter(date);
                        setIsCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Batches list */}
      <Card className="overflow-hidden h-full flex flex-col">
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-xl flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Payment Batches
          </CardTitle>
          <CardDescription>
            Manage and process payment batches
          </CardDescription>
        </CardHeader>
        
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800">
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">
                  <button
                    className="flex items-center hover:text-blue-600"
                    onClick={() => toggleSort('date')}
                  >
                    Date
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead className="font-medium">
                  <button
                    className="flex items-center hover:text-blue-600"
                    onClick={() => toggleSort('project')}
                  >
                    Project
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead className="font-medium">Company</TableHead>
                <TableHead className="font-medium text-right">
                  <button
                    className="flex items-center hover:text-blue-600 ml-auto"
                    onClick={() => toggleSort('amount')}
                  >
                    Amount
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-right">Staff</TableHead>
                <TableHead className="font-medium text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">Loading payment batches...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSortedBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <CreditCard className="h-8 w-8 text-slate-400" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">No payment batches found</p>
                      <Button variant="outline" onClick={() => loadBatches(true)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSortedBatches.map((batch) => (
                  <TableRow
                    key={batch.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => loadBatchDetails(batch.id)}
                  >
                    <TableCell>
                      <StatusBadge status={batch.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(new Date(batch.created_at), 'PP')}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {format(new Date(batch.created_at), 'HH:mm')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[180px] truncate font-medium">
                        {batch.project_name || 'Unknown Project'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {batch.batch_reference}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="max-w-[150px] truncate block">
                        {batch.company_name || 'Unknown Company'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(batch.total_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {batch.items_count || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination footer */}
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-center space-x-2 py-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            
            <div className="text-sm">
              Page {page} of {totalPages}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!hasMorePages || isLoading}
            >
              Next
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {/* Payment batch details dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          {isLoadingDetails ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p>Loading batch details...</p>
              </div>
            </div>
          ) : detailsError ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4 max-w-md text-center px-4">
                <AlertCircle className="h-10 w-10 text-red-500" />
                <h3 className="text-lg font-medium">Error Loading Batch</h3>
                <p className="text-slate-500 dark:text-slate-400">{detailsError}</p>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : selectedBatch ? (
            <>
              <DialogHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 border-b border-blue-100 dark:border-blue-900/50">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <DialogTitle className="text-xl flex items-center gap-2 text-blue-800 dark:text-blue-300">
                      <CreditCard className="h-5 w-5" />
                      Payment Batch Details
                    </DialogTitle>
                    <DialogDescription className="text-blue-600 dark:text-blue-400">
                      {selectedBatch.batch_reference}
                    </DialogDescription>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={selectedBatch.status} />
                    
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyBatchId}
                        className="h-8 px-2 text-slate-600 dark:text-slate-400"
                      >
                        {hasCopiedBatchId ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetailsDialog(false)}
                        className="h-8 px-2 text-slate-600 dark:text-slate-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="overflow-y-auto flex-1 p-0">
                <Tabs defaultValue="details" className="w-full">
                  <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-700">
                    <TabsList className="mb-0">
                      <TabsTrigger value="details">Batch Details</TabsTrigger>
                      <TabsTrigger value="payments">Staff Payments</TabsTrigger>
                      <TabsTrigger value="history">Approval History</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <div className="p-6">
                    <TabsContent value="details" className="m-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-blue-500" />
                              Batch Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <dl className="space-y-3 text-sm">
                              <div className="grid grid-cols-3 gap-1">
                                <dt className="font-medium text-slate-500 dark:text-slate-400">Batch ID</dt>
                                <dd className="col-span-2 font-mono text-xs break-all">{selectedBatch.id}</dd>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <dt className="font-medium text-slate-500 dark:text-slate-400">Reference</dt>
                                <dd className="col-span-2">{selectedBatch.batch_reference}</dd>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <dt className="font-medium text-slate-500 dark:text-slate-400">Created By</dt>
                                <dd className="col-span-2">{selectedBatch.created_by_name || 'Unknown'}</dd>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <dt className="font-medium text-slate-500 dark:text-slate-400">Created At</dt>
                                <dd className="col-span-2">
                                  {format(new Date(selectedBatch.created_at), 'PPp')}
                                </dd>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <dt className="font-medium text-slate-500 dark:text-slate-400">Status</dt>
                                <dd className="col-span-2">
                                  <StatusBadge status={selectedBatch.status} />
                                </dd>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <dt className="font-medium text-slate-500 dark:text-slate-400">Payment Date</dt>
                                <dd className="col-span-2">
                                  {format(new Date(selectedBatch.payment_date), 'PP')}
                                </dd>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <dt className="font-medium text-slate-500 dark:text-slate-400">Payment Method</dt>
                                <dd className="col-span-2 capitalize">{selectedBatch.payment_method}</dd>
                              </div>
                              
                              {selectedBatch.approved_by && (
                                <>
                                  <div className="grid grid-cols-3 gap-1">
                                    <dt className="font-medium text-slate-500 dark:text-slate-400">Approved By</dt>
                                    <dd className="col-span-2">{selectedBatch.approved_by_name || 'Unknown'}</dd>
                                  </div>
                                  <div className="grid grid-cols-3 gap-1">
                                    <dt className="font-medium text-slate-500 dark:text-slate-400">Approved At</dt>
                                    <dd className="col-span-2">
                                      {selectedBatch.approved_at ? 
                                        format(new Date(selectedBatch.approved_at), 'PPp') : 
                                        'N/A'}
                                    </dd>
                                  </div>
                                </>
                              )}
                              
                              {selectedBatch.exported_by && (
                                <>
                                  <div className="grid grid-cols-3 gap-1">
                                    <dt className="font-medium text-slate-500 dark:text-slate-400">Exported By</dt>
                                    <dd className="col-span-2">{selectedBatch.exported_by_name || 'Unknown'}</dd>
                                  </div>
                                  <div className="grid grid-cols-3 gap-1">
                                    <dt className="font-medium text-slate-500 dark:text-slate-400">Exported At</dt>
                                    <dd className="col-span-2">
                                      {selectedBatch.exported_at ? 
                                        format(new Date(selectedBatch.exported_at), 'PPp') : 
                                        'N/A'}
                                    </dd>
                                  </div>
                                </>
                              )}
                            </dl>
                          </CardContent>
                        </Card>
                        
                        <div className="space-y-6">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Building className="h-4 w-4 text-purple-500" />
                                Company Information
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <dl className="space-y-3 text-sm">
                                <div className="grid grid-cols-3 gap-1">
                                  <dt className="font-medium text-slate-500 dark:text-slate-400">Company Name</dt>
                                  <dd className="col-span-2">{selectedBatch.company_name || 'N/A'}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <dt className="font-medium text-slate-500 dark:text-slate-400">Reg. Number</dt>
                                  <dd className="col-span-2">{selectedBatch.company_registration_number || 'N/A'}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <dt className="font-medium text-slate-500 dark:text-slate-400">Bank Account</dt>
                                  <dd className="col-span-2">{selectedBatch.company_bank_account || 'N/A'}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <dt className="font-medium text-slate-500 dark:text-slate-400">Project</dt>
                                  <dd className="col-span-2">{selectedBatch.project_name || 'N/A'}</dd>
                                </div>
                              </dl>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-500" />
                                  Notes
                                </CardTitle>
                                {!editingNotes && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingNotes(true);
                                      setUpdatedNotes(selectedBatch.notes || '');
                                    }}
                                    className="h-8 px-2"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              {editingNotes ? (
                                <div className="space-y-3">
                                  <Textarea
                                    placeholder="Add notes about this payment batch"
                                    value={updatedNotes}
                                    onChange={(e) => setUpdatedNotes(e.target.value)}
                                    rows={3}
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingNotes(false)}
                                      disabled={isUpdatingNotes}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={handleUpdateNotes}
                                      disabled={isUpdatingNotes}
                                    >
                                      {isUpdatingNotes ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Saving...
                                        </>
                                      ) : (
                                        'Save Notes'
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-slate-700 dark:text-slate-300 min-h-[3rem]">
                                  {selectedBatch.notes || 'No notes provided for this batch.'}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Users className="h-4 w-4 text-green-500" />
                              Payment Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                                <dt className="text-sm font-medium text-green-800 dark:text-green-300">Total Amount</dt>
                                <dd className="text-xl font-bold text-green-700 dark:text-green-400">
                                  {formatCurrency(selectedBatch.total_amount)}
                                </dd>
                              </div>
                              
                              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                                <dt className="text-sm font-medium text-purple-800 dark:text-purple-300">Staff Count</dt>
                                <dd className="text-xl font-bold text-purple-700 dark:text-purple-400">
                                  {selectedBatch.payment_items?.length || 0}
                                </dd>
                              </div>
                              
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                <dt className="text-sm font-medium text-blue-800 dark:text-blue-300">Average Payment</dt>
                                <dd className="text-xl font-bold text-blue-700 dark:text-blue-400">
                                  {selectedBatch.payment_items?.length ?
                                    formatCurrency(selectedBatch.total_amount / selectedBatch.payment_items.length) :
                                    'N/A'}
                                </dd>
                              </div>
                              
                              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800">
                                <dt className="text-sm font-medium text-amber-800 dark:text-amber-300">Batch Age</dt>
                                <dd className="text-xl font-bold text-amber-700 dark:text-amber-400">
                                  {format(new Date(selectedBatch.created_at), 'PP')}
                                </dd>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Action Buttons */}
                      {selectedBatch.status === 'pending' && allowApproval && (
                        <Card className="mt-6">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-500" />
                              Payment Approval
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-2">
                            <div className="space-y-4">
                              <div>
                                <label htmlFor="approval-notes" className="text-sm font-medium">
                                  Approval/Rejection Notes
                                </label>
                                <Textarea
                                  id="approval-notes"
                                  placeholder="Add notes for approving or rejecting this payment batch"
                                  value={approvalNotes}
                                  onChange={(e) => setApprovalNotes(e.target.value)}
                                  rows={3}
                                  className="mt-1.5"
                                />
                              </div>
                              
                              <div className="flex justify-end gap-2">
                                {allowRejection && (
                                  <Button
                                    variant="destructive"
                                    onClick={handleRejectBatch}
                                    disabled={isRejecting || isApproving || !approvalNotes.trim()}
                                    className="flex items-center"
                                  >
                                    {isRejecting ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <X className="h-4 w-4 mr-2" />
                                    )}
                                    Reject Payment
                                  </Button>
                                )}
                                
                                {allowCancel && (
                                  <Button
                                    variant="outline"
                                    onClick={handleCancelBatch}
                                    disabled={isCancelling || isApproving || isRejecting}
                                    className="flex items-center"
                                  >
                                    {isCancelling ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Ban className="h-4 w-4 mr-2" />
                                    )}
                                    Cancel Batch
                                  </Button>
                                )}
                                
                                <Button
                                  variant="default"
                                  onClick={handleApproveBatch}
                                  disabled={isApproving || isRejecting || isCancelling}
                                  className="flex items-center bg-green-600 hover:bg-green-700"
                                >
                                  {isApproving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4 mr-2" />
                                  )}
                                  Approve Payment
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {selectedBatch.status === 'approved' && allowExport && (
                        <Card className="mt-6">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Download className="h-4 w-4 text-purple-500" />
                              Export Payment
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-2">
                            <div className="space-y-4">
                              <div>
                                <label htmlFor="export-notes" className="text-sm font-medium">
                                  Export Notes
                                </label>
                                <Textarea
                                  id="export-notes"
                                  placeholder="Add notes for exporting this payment batch"
                                  value={approvalNotes}
                                  onChange={(e) => setApprovalNotes(e.target.value)}
                                  rows={3}
                                  className="mt-1.5"
                                />
                              </div>
                              
                              <div className="flex justify-end space-x-3">
                                <Button
                                  variant="outline"
                                  onClick={handleExportCsv}
                                  className="flex items-center"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Download CSV
                                </Button>
                                
                                <Button
                                  variant="default"
                                  onClick={handleMarkExported}
                                  disabled={isExporting}
                                  className="flex items-center bg-purple-600 hover:bg-purple-700"
                                >
                                  {isExporting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                  )}
                                  Mark as Exported
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {selectedBatch.status === 'processing' && allowCompletion && (
                        <Card className="mt-6">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              Complete Payment
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-2">
                            <div className="space-y-4">
                              <div>
                                <label htmlFor="completion-notes" className="text-sm font-medium">
                                  Completion Notes
                                </label>
                                <Textarea
                                  id="completion-notes"
                                  placeholder="Add notes for completing this payment batch"
                                  value={approvalNotes}
                                  onChange={(e) => setApprovalNotes(e.target.value)}
                                  rows={3}
                                  className="mt-1.5"
                                />
                              </div>
                              
                              <div className="flex justify-end">
                                <Button
                                  variant="default"
                                  onClick={handleMarkCompleted}
                                  disabled={isCompleting}
                                  className="flex items-center bg-green-600 hover:bg-green-700"
                                >
                                  {isCompleting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                  )}
                                  Mark as Completed
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="payments" className="m-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-800">
                              <TableHead className="w-[250px]">Staff Name</TableHead>
                              <TableHead>Bank Details</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead>Reference</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedBatch.payment_items?.map(item => (
                              <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs">
                                        {item.staff_name.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{item.staff_name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {item.bank_code && item.bank_account_number ? (
                                    <div className="text-sm">
                                      <div className="font-medium">{item.bank_code}</div>
                                      <div className="text-slate-500 dark:text-slate-400">{item.bank_account_number}</div>
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                                      Missing bank details
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(item.amount)}
                                </TableCell>
                                <TableCell className="max-w-[180px] truncate">
                                  {item.reference || 'No reference'}
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={item.status} />
                                </TableCell>
                              </TableRow>
                            ))}
                            
                            {!selectedBatch.payment_items?.length && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-6">
                                  No payment items found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                          <tfoot className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                            <tr>
                              <td colSpan={2} className="px-4 py-2 text-sm font-medium">Total</td>
                              <td className="px-4 py-2 text-right font-bold">
                                {formatCurrency(selectedBatch.total_amount)}
                              </td>
                              <td colSpan={2}></td>
                            </tr>
                          </tfoot>
                        </Table>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="history" className="m-0">
                      <div className="space-y-4">
                        {/* Timeline of actions */}
                        <div className="space-y-8 relative before:absolute before:inset-0 before:left-9 before:border-l-2 before:border-slate-200 dark:before:border-slate-700 pl-10">
                          {batchHistory.length ? (
                            batchHistory.map((entry, index) => (
                              <div key={entry.id} className="relative">
                                <div className="absolute left-[-34px] rounded-full bg-white dark:bg-slate-800 p-1 shadow">
                                  {entry.action === 'created' && (
                                    <Clock className="h-5 w-5 text-blue-500" />
                                  )}
                                  {entry.action === 'approved' && (
                                    <Check className="h-5 w-5 text-green-500" />
                                  )}
                                  {entry.action === 'rejected' && (
                                    <X className="h-5 w-5 text-red-500" />
                                  )}
                                  {entry.action === 'exported' && (
                                    <Download className="h-5 w-5 text-purple-500" />
                                  )}
                                  {entry.action === 'completed' && (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  )}
                                  {entry.action === 'cancelled' && (
                                    <Ban className="h-5 w-5 text-slate-500" />
                                  )}
                                  {entry.action === 'edited' && (
                                    <Pencil className="h-5 w-5 text-amber-500" />
                                  )}
                                </div>
                                
                                <div className="mb-6">
                                  <h4 className="text-sm font-medium flex items-center">
                                    <span className="capitalize">{entry.action}</span>
                                    <span className="mx-2">by</span>
                                    <span className="text-blue-600 dark:text-blue-400">{entry.user_email || 'Unknown User'}</span>
                                    <Badge className="ml-3 text-xs" variant="outline">
                                      {format(new Date(entry.created_at), 'PP')}
                                    </Badge>
                                  </h4>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    <span className="text-xs text-slate-500 dark:text-slate-500">
                                      {format(new Date(entry.created_at), 'HH:mm:ss')}
                                    </span>
                                    {entry.notes && (
                                      <span className="ml-3">{entry.notes}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                              <History className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                              <p>No history available for this batch</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
              
              <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
                
                {selectedBatch.status === 'approved' && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleExportCsv}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <p>No batch selected</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PaymentApprovalWorkflow;