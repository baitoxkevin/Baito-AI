import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { logger } from '../lib/logger';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DollarSign, 
  Search,
  Filter,
  Download,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Users,
  Building2,
  CreditCard,
  Banknote,
  Eye,
  Loader2,
  FileSpreadsheet,
  Check,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { getPaymentBatches, approvePaymentBatch, rejectPaymentBatch, getPaymentBatchDetails } from '@/lib/payment-queue-service';
import { supabase } from '@/lib/supabase';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const getStatusInfo = (status: string) => {
  const statusConfig = {
    completed: { color: 'bg-green-500 text-white', letter: 'C', tooltip: 'Completed' },
    pending: { color: 'bg-yellow-500 text-white', letter: 'P', tooltip: 'Pending' },
    processing: { color: 'bg-blue-500 text-white', letter: 'R', tooltip: 'Processing' },
    approved: { color: 'bg-emerald-500 text-white', letter: 'A', tooltip: 'Approved' },
    rejected: { color: 'bg-red-500 text-white', letter: 'X', tooltip: 'Rejected' },
    cancelled: { color: 'bg-gray-500 text-white', letter: 'N', tooltip: 'Cancelled' }
  };

  return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
};



export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentBatches, setPaymentBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [paymentItems, setPaymentItems] = useState<Record<string, any[]>>({});
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [selectedStaffPayments, setSelectedStaffPayments] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalPayments: 0,
    pendingCount: 0,
    approvedCount: 0,
    totalAmount: 0
  });
  const [userRole, setUserRole] = useState<string>('admin');
  const [canApprove, setCanApprove] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: 'project' | 'by' | 'staff' | 'date' | 'status' | 'amount';
    direction: 'asc' | 'desc' | null;
  }>({ key: 'date', direction: 'desc' });
  const { toast } = useToast();

  // Fetch payment batches
  useEffect(() => {
    const fetchPaymentBatches = async () => {
      try {
        setLoading(true);
        
        // Fetch payment batches from the payment_queue system
        const { data: batches, error } = await supabase
          .from('payment_batches')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Fetch related data separately to avoid foreign key issues
        const projectIds = [...new Set(batches?.map(b => b.project_id).filter(Boolean) || [])];
        const userIds = [...new Set([
          ...(batches?.map(b => b.created_by).filter(Boolean) || []),
          ...(batches?.map(b => b.approved_by).filter(Boolean) || [])
        ])];
        
        // Fetch projects
        const { data: projects } = projectIds.length > 0 ? await supabase
          .from('projects')
          .select('id, title')
          .in('id', projectIds)
          : { data: [] };
          
        // Fetch users
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', userIds);
          
        // Create lookup maps
        const projectMap = new Map(projects?.map(p => [p.id, p]) || []);
        const userMap = new Map(users?.map(u => [u.id, u]) || []);
          
        // Transform the data to match our expected format
        const transformedBatches = (batches || []).map(batch => {
          const project = projectMap.get(batch.project_id);
          const createdByUser = userMap.get(batch.created_by);
          const approvedByUser = batch.approved_by ? userMap.get(batch.approved_by) : null;
          
          // Calculate total amount from payments array if total_amount doesn't exist
          let totalAmount = batch.total_amount || 0;
          let staffCount = batch.staff_count || 0;
          
          if (batch.payments && Array.isArray(batch.payments)) {
            totalAmount = batch.payments.reduce((sum: number, payment: unknown) => sum + (payment.amount || 0), 0);
            staffCount = batch.payments.length;
          }
          
          return {
            id: batch.id,
            batch_reference: batch.batch_reference,
            project_id: batch.project_id,
            project_name: project?.title || 'Unknown Project',
            created_by: batch.created_by,
            created_by_name: createdByUser?.full_name || 'Unknown',
            created_at: new Date(batch.created_at),
            payment_date: new Date(batch.payment_date),
            total_amount: totalAmount,
            status: batch.status,
            payment_method: batch.payment_method,
            notes: batch.notes,
            batch_details: batch.batch_details,
            payments: batch.payments,
            staff_count: staffCount,
            approved_by_name: approvedByUser?.full_name,
            approved_at: batch.approved_at ? new Date(batch.approved_at) : null,
            rejection_reason: batch.rejection_reason,
            exported_at: batch.exported_at ? new Date(batch.exported_at) : null
          };
        });
        
        setPaymentBatches(transformedBatches);
      } catch (error) {
        logger.error('Error fetching payment batches:', error);
        toast({
          title: "Error",
          description: "Failed to fetch payment batches",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentBatches();
  }, []);

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('role, is_super_admin')
            .eq('id', user.id)
            .single();
          
          if (userData) {
            setUserRole(userData.role || 'staff');
            // Only admin or super admin can approve payments
            setCanApprove(userData.role === 'admin' || userData.is_super_admin);
          }
        }
      } catch (error) {
        logger.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, []);

  // Update stats when payment batches change
  useEffect(() => {
    const pending = paymentBatches.filter(b => b.status === 'pending').length;
    const approved = paymentBatches.filter(b => b.status === 'approved').length;
    const totalAmount = paymentBatches.reduce((sum, batch) => sum + (batch.total_amount || 0), 0);
    
    setStats({
      totalPayments: paymentBatches.length,
      pendingCount: pending,
      approvedCount: approved,
      totalAmount
    });
  }, [paymentBatches]);

  const handleApprove = async (batchId: string) => {
    try {
      const result = await approvePaymentBatch(batchId);
      
      if (result.success) {
        // Update local state
        setPaymentBatches(prev => prev.map(batch => 
          batch.id === batchId 
            ? { ...batch, status: 'approved', approved_at: new Date() }
            : batch
        ));
        
        toast({
          title: "Payment Approved",
          description: "The payment batch has been approved successfully"
        });
      } else {
        throw new Error(result.error || 'Failed to approve payment');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve payment",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (batchId: string, reason?: string) => {
    try {
      const result = await rejectPaymentBatch(batchId, reason);
      
      if (result.success) {
        // Update local state
        setPaymentBatches(prev => prev.map(batch => 
          batch.id === batchId 
            ? { ...batch, status: 'rejected', approved_at: new Date(), rejection_reason: reason }
            : batch
        ));
        
        toast({
          title: "Payment Rejected",
          description: "The payment batch has been rejected"
        });
      } else {
        throw new Error(result.error || 'Failed to reject payment');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject payment",
        variant: "destructive"
      });
    }
  };

  // Sorting function
  const handleSort = (key: typeof sortConfig.key) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  // Sort data
  const sortedPayments = [...paymentBatches].sort((a, b) => {
    if (sortConfig.direction === null) return 0;
    
    let aValue: unknown;
    let bValue: unknown;
    
    switch (sortConfig.key) {
      case 'project':
        aValue = a.project_name || '';
        bValue = b.project_name || '';
        break;
      case 'by':
        aValue = a.created_by_name || '';
        bValue = b.created_by_name || '';
        break;
      case 'staff':
        aValue = a.staff_count || 0;
        bValue = b.staff_count || 0;
        break;
      case 'date':
        aValue = a.created_at.getTime();
        bValue = b.created_at.getTime();
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'amount':
        aValue = a.total_amount || 0;
        bValue = b.total_amount || 0;
        break;
      default:
        return 0;
    }
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Filter by tab
  const tabFilteredPayments = sortedPayments.filter(payment => {
    if (activeTab === 'pending') {
      return payment.status === 'pending';
    } else if (activeTab === 'completed') {
      return ['approved', 'completed', 'exported'].includes(payment.status);
    }
    return true; // 'all' tab shows everything
  });

  const filteredPayments = tabFilteredPayments.filter(payment => 
    payment.batch_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.created_by_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, sortConfig]);

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBatches(new Set(filteredPayments.map(p => p.id)));
    } else {
      setSelectedBatches(new Set());
    }
  };

  // Handle individual selection
  const handleSelectBatch = (batchId: string, checked: boolean) => {
    const newSelected = new Set(selectedBatches);
    if (checked) {
      newSelected.add(batchId);
    } else {
      newSelected.delete(batchId);
    }
    setSelectedBatches(newSelected);
  };

  // Handle staff payment selection
  const handleSelectStaffPayment = (paymentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStaffPayments);
    if (checked) {
      newSelected.add(paymentId);
    } else {
      newSelected.delete(paymentId);
    }
    setSelectedStaffPayments(newSelected);
  };

  // Toggle project dropdown
  const toggleProjectDropdown = async (batchId: string) => {
    const newExpanded = new Set(expandedProjects);
    
    if (newExpanded.has(batchId)) {
      newExpanded.delete(batchId);
    } else {
      newExpanded.add(batchId);
      
      // Fetch payment items if not already loaded
      if (!paymentItems[batchId] && !loadingItems.has(batchId)) {
        const newLoadingItems = new Set(loadingItems);
        newLoadingItems.add(batchId);
        setLoadingItems(newLoadingItems);
        
        try {
          // First try to fetch from payment_items table
          const { data: items, error } = await supabase
            .from('payment_items')
            .select('*')
            .eq('batch_id', batchId)
            .order('staff_name');
            
          if (error) {
            // If payment_items table doesn't exist, try to get data from payments column
            logger.debug('payment_items table not found, { data: checking payments column' });
            const batch = paymentBatches.find(b => b.id === batchId);
            
            if (batch?.payments && Array.isArray(batch.payments)) {
              // Convert payments data to payment items format
              setPaymentItems(prev => ({
                ...prev,
                [batchId]: batch.payments.map((p: unknown, idx: number) => ({
                  id: `${batchId}-${idx}`,
                  staff_id: p.staff_id,
                  staff_name: p.staff_name,
                  bank_code: p.bank_code || '',
                  bank_account_number: p.bank_account_number || '',
                  amount: p.amount || 0,
                  reference: p.reference || '',
                  description: p.description || '',
                  status: batch.status || 'pending'
                }))
              }));
            } else {
              // No payment details available
              setPaymentItems(prev => ({
                ...prev,
                [batchId]: []
              }));
            }
          } else {
            setPaymentItems(prev => ({
              ...prev,
              [batchId]: items || []
            }));
          }
        } catch (error) {
          logger.error('Error fetching payment items:', error);
          // Don't show error toast, just set empty array
          setPaymentItems(prev => ({
            ...prev,
            [batchId]: []
          }));
        } finally {
          const newLoadingItems = new Set(loadingItems);
          newLoadingItems.delete(batchId);
          setLoadingItems(newLoadingItems);
        }
      }
    }
    
    setExpandedProjects(newExpanded);
  };

  // Export to Excel
  const handleExportToExcel = () => {
    const selectedData = paymentBatches.filter(batch => selectedBatches.has(batch.id));
    
    if (selectedData.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one payment to export",
        variant: "destructive"
      });
      return;
    }

    // Create CSV content
    const headers = ['Project', 'Submitted By', 'Staff Count', 'Payment Date', 'Status', 'Amount (RM)', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...selectedData.map(batch => [
        `"${batch.project_name}"`,
        `"${batch.created_by_name}"`,
        batch.staff_count || 0,
        format(new Date(batch.payment_date), 'yyyy-MM-dd'),
        batch.status,
        batch.total_amount,
        `"${batch.notes || ''}"`
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${selectedData.length} payment${selectedData.length > 1 ? 's' : ''} to CSV`
    });
  };

  // Render sort icon
  const SortIcon = ({ column }: { column: typeof sortConfig.key }) => {
    if (sortConfig.key !== column) {
      return <ChevronsUpDown className="h-3 w-3 opacity-50" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="h-3 w-3" />;
    }
    if (sortConfig.direction === 'desc') {
      return <ArrowDown className="h-3 w-3" />;
    }
    return <ChevronsUpDown className="h-3 w-3 opacity-50" />;
  };

  // Sortable header component
  const SortableHeader = ({ column, children, className = "" }: { 
    column: typeof sortConfig.key; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead className={className}>
      <button
        className={cn(
          "flex items-center gap-1 font-medium transition-colors hover:text-foreground",
          sortConfig.key === column && sortConfig.direction ? "text-foreground" : "text-muted-foreground",
          className?.includes("text-center") ? "justify-center w-full" : ""
        )}
        onClick={() => handleSort(column)}
      >
        {children}
        <SortIcon column={column} />
      </button>
    </TableHead>
  );

  return (
    <TooltipProvider>
      <div className="flex-1 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-auto">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <AnimatedGradientText
              className="text-3xl font-bold mb-2"
              colorFrom="#3B82F6"
              colorTo="#8B5CF6"
              speed={3}
            >
              Payment Management
            </AnimatedGradientText>
            <p className="text-muted-foreground">
              {canApprove ? 'Review and approve payment submissions' : 'Track payment submissions'}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedBatches.size > 0 && (
              <>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => {
                    if (confirm(`Approve ${selectedBatches.size} payment(s)?`)) {
                      selectedBatches.forEach(batchId => {
                        const batch = paymentBatches.find(b => b.id === batchId);
                        if (batch?.status === 'pending') {
                          handleApprove(batchId);
                        }
                      });
                      setSelectedBatches(new Set());
                    }
                  }}
                  disabled={!canApprove || !Array.from(selectedBatches).some(id => 
                    paymentBatches.find(b => b.id === id)?.status === 'pending'
                  )}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve ({selectedBatches.size})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportToExcel}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export ({selectedBatches.size})
                </Button>
              </>
            )}
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Payments
                </CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">RM {stats.totalAmount.toLocaleString()}</div>
                <div className="flex items-center text-xs mt-2">
                  <span className="text-muted-foreground">{stats.totalPayments} transactions</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-yellow-600 opacity-5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Approval
                </CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingCount}</div>
                <div className="flex items-center text-xs mt-2">
                  <span className="text-muted-foreground">Awaiting review</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Approved
                </CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approvedCount}</div>
                <div className="flex items-center text-xs mt-2">
                  <span className="text-muted-foreground">Ready for processing</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Success Rate
                </CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalPayments > 0 
                    ? Math.round((stats.approvedCount / stats.totalPayments) * 100) + '%'
                    : '0%'
                  }
                </div>
                <div className="flex items-center text-xs mt-2">
                  <span className="text-muted-foreground">Approval rate</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Payment Submissions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Payment Submissions</CardTitle>
                  <CardDescription>
                    All payment batches submitted for approval
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-full md:w-[300px]"
                  />
                </div>
              </div>
              
              {/* Tabs */}
              <div className="mt-4">
                <div className="flex space-x-1 border-b">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-colors relative",
                      activeTab === 'all'
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All Payments
                    <Badge variant="secondary" className="ml-2">
                      {paymentBatches.length}
                    </Badge>
                  </button>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-colors relative",
                      activeTab === 'pending'
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Pending Approval
                    <Badge variant="secondary" className="ml-2">
                      {paymentBatches.filter(p => p.status === 'pending').length}
                    </Badge>
                  </button>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-colors relative",
                      activeTab === 'completed'
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Completed
                    <Badge variant="secondary" className="ml-2">
                      {paymentBatches.filter(p => ['approved', 'completed', 'exported'].includes(p.status)).length}
                    </Badge>
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No payment submissions found
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox 
                            checked={filteredPayments.length > 0 && filteredPayments.every(p => selectedBatches.has(p.id))}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <SortableHeader column="project">Project</SortableHeader>
                        <TableHead className="text-center">Reference</TableHead>
                        <SortableHeader column="by" className="text-center">By</SortableHeader>
                        <SortableHeader column="staff" className="text-center">Staff</SortableHeader>
                        <SortableHeader column="date" className="text-center">Date</SortableHeader>
                        <SortableHeader column="status" className="text-center">Status</SortableHeader>
                        <SortableHeader column="amount" className="text-center">Amount</SortableHeader>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPayments.map((payment, index) => (
                        <React.Fragment key={payment.id}>
                          <motion.tr
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group hover:bg-muted/50 transition-colors"
                          >
                            <TableCell>
                              <Checkbox 
                                checked={selectedBatches.has(payment.id)}
                                onCheckedChange={(checked) => handleSelectBatch(payment.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="text-left">
                              <button
                                onClick={() => toggleProjectDropdown(payment.id)}
                                className="flex items-center gap-2 text-left hover:text-primary transition-colors group"
                              >
                                <div className={cn(
                                  "transition-transform duration-200",
                                  expandedProjects.has(payment.id) ? "rotate-90" : ""
                                )}>
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium group-hover:underline">
                                  {payment.project_name || 'N/A'}
                                </span>
                              </button>
                            </TableCell>
                            <TableCell className="text-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs font-mono cursor-help">
                                    {payment.batch_reference?.slice(-8) || 'N/A'}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-mono text-xs">{payment.batch_reference}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-8 w-8 cursor-pointer">
                                      <AvatarFallback>
                                        {payment.created_by_name?.split(' ').map(n => n[0]).join('') || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium">{payment.created_by_name || 'Unknown'}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(payment.created_at), 'MMM d, yyyy h:mm:ss a')}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="text-sm text-gray-600">
                                {payment.staff_count || 0} Staff
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div>
                                <div className="text-sm">
                                  {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Payment Date
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex justify-center">
                                    <div className={cn(
                                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                      getStatusInfo(payment.status).color
                                    )}>
                                      {getStatusInfo(payment.status).letter}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div>
                                    <p className="text-xs font-medium">{getStatusInfo(payment.status).tooltip}</p>
                                    {payment.status === 'approved' && payment.approved_by_name && (
                                      <>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          By: {payment.approved_by_name}
                                        </p>
                                        {payment.approved_at && (
                                          <p className="text-xs text-muted-foreground">
                                            {format(new Date(payment.approved_at), 'MMM d, h:mm a')}
                                          </p>
                                        )}
                                      </>
                                    )}
                                    {payment.status === 'rejected' && payment.rejection_reason && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Reason: {payment.rejection_reason}
                                      </p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              RM {(payment.total_amount || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-1">
                                {payment.status === 'pending' && canApprove && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                          onClick={() => handleApprove(payment.id)}
                                        >
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">Approve</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                          onClick={() => {
                                            const reason = prompt('Rejection reason:');
                                            if (reason) handleReject(payment.id, reason);
                                          }}
                                        >
                                          <XCircle className="h-4 w-4 text-red-600" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">Reject</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => toggleProjectDropdown(payment.id)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                                      Export Batch
                                    </DropdownMenuItem>
                                    {payment.status === 'pending' && (
                                      <DropdownMenuItem 
                                        className="text-red-600"
                                        onClick={async () => {
                                          if (confirm('Are you sure you want to cancel this payment? It will be moved back to the project payroll.')) {
                                            try {
                                              // Get current user for audit trail
                                              const { data: { user } } = await supabase.auth.getUser();
                                              
                                              // Update the payment batch status to cancelled
                                              const { error: batchError } = await supabase
                                                .from('payment_batches')
                                                .update({ 
                                                  status: 'cancelled',
                                                  updated_at: new Date().toISOString()
                                                })
                                                .eq('id', payment.id);
                                                
                                              if (batchError) throw batchError;
                                              
                                              // Create audit trail entry
                                              try {
                                                await supabase
                                                  .from('payment_approval_history')
                                                  .insert({
                                                    batch_id: payment.id,
                                                    user_id: user?.id,
                                                    action: 'cancelled',
                                                    notes: 'Payment cancelled and moved back to project payroll'
                                                  });
                                              } catch (historyError) {
                                                logger.debug('Could not log cancellation history:', { data: historyError });
                                              }
                                              
                                              // Update the project's confirmed_staff to remove paymentStatus
                                              const { data: project, error: projectError } = await supabase
                                                .from('projects')
                                                .select('confirmed_staff')
                                                .eq('id', payment.project_id)
                                                .single();
                                                
                                              if (projectError) throw projectError;
                                              
                                              if (project?.confirmed_staff) {
                                                const updatedStaff = project.confirmed_staff.map((staff: unknown) => {
                                                  // Remove payment-related fields if this was their payment batch
                                                  if (staff.paymentBatchId === payment.id) {
                                                    const { paymentStatus, paymentDate, paymentBatchId, ...cleanStaff } = staff;
                                                    return cleanStaff;
                                                  }
                                                  return staff;
                                                });
                                                
                                                const { error: updateError } = await supabase
                                                  .from('projects')
                                                  .update({ confirmed_staff: updatedStaff })
                                                  .eq('id', payment.project_id);
                                                  
                                                if (updateError) throw updateError;
                                              }
                                              
                                              // Update local state
                                              setPaymentBatches(prev => prev.map(batch => 
                                                batch.id === payment.id 
                                                  ? { ...batch, status: 'cancelled' }
                                                  : batch
                                              ));
                                              
                                              // Log the cancellation action
                                              try {
                                                const { logUtils } = await import('@/lib/activity-logger');
                                                await logUtils.action('cancel_payment', true, {
                                                  batch_id: payment.id,
                                                  batch_reference: payment.batch_reference,
                                                  project_id: payment.project_id,
                                                  total_amount: payment.total_amount,
                                                  staff_count: payment.items_count,
                                                  reason: 'Payment cancelled by user'
                                                });
                                              } catch (logError) {
                                                logger.debug('Could not log cancellation:', { data: logError });
                                              }
                                              
                                              toast({
                                                title: "Payment Cancelled",
                                                description: "The payment has been cancelled and moved back to project payroll"
                                              });
                                            } catch (error) {
                                              logger.error('Error cancelling payment:', error);
                                              toast({
                                                title: "Error",
                                                description: "Failed to cancel payment",
                                                variant: "destructive"
                                              });
                                            }
                                          }
                                        }}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancel Payment
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </motion.tr>
                          <AnimatePresence>
                            {expandedProjects.has(payment.id) && (
                              <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="bg-gray-50 dark:bg-gray-900/50"
                              >
                                <TableCell colSpan={9} className="p-0">
                                  <div className="p-6 bg-blue-50/50 dark:bg-blue-950/20">
                                    {loadingItems.has(payment.id) ? (
                                      <div className="flex items-center gap-2 py-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span className="text-xs text-muted-foreground">Loading payment details...</span>
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      {paymentItems[payment.id]?.length > 0 ? (
                                        <>
                                          <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-semibold">Payment Details ({paymentItems[payment.id]?.length || 0} staff)</h4>
                                            <div className="flex items-center gap-4">
                                              <div className="text-xs text-muted-foreground">
                                                Batch Reference: <span className="font-mono">{payment.batch_reference}</span>
                                              </div>
                                              {Array.from(selectedStaffPayments).some(id => id.startsWith(payment.id)) && (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="text-xs"
                                                  onClick={() => {
                                                    // Filter selected payments for this batch
                                                    const selectedForThisBatch = paymentItems[payment.id]?.filter(item => 
                                                      selectedStaffPayments.has(`${payment.id}-${item.id}`)
                                                    ) || [];
                                                    
                                                    if (selectedForThisBatch.length > 0) {
                                                      // TODO: Implement DuitNow export
                                                      toast({
                                                        title: "Export to DuitNow",
                                                        description: `Exporting ${selectedForThisBatch.length} selected payment(s) to DuitNow template`,
                                                      });
                                                    }
                                                  }}
                                                >
                                                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                                                  Export Selected ({Array.from(selectedStaffPayments).filter(id => id.startsWith(payment.id)).length})
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                          <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
                                            <table className="w-full">
                                              <thead>
                                                <tr className="text-xs text-muted-foreground border-b border-gray-200 dark:border-gray-700">
                                                  <th className="text-left pb-2 font-medium w-2/5">
                                                    <div className="flex items-center gap-2">
                                                      <Checkbox
                                                        checked={paymentItems[payment.id]?.every(item => 
                                                          selectedStaffPayments.has(`${payment.id}-${item.id}`)
                                                        )}
                                                        onCheckedChange={(checked) => {
                                                          const newSelected = new Set(selectedStaffPayments);
                                                          paymentItems[payment.id]?.forEach(item => {
                                                            const paymentKey = `${payment.id}-${item.id}`;
                                                            if (checked) {
                                                              newSelected.add(paymentKey);
                                                            } else {
                                                              newSelected.delete(paymentKey);
                                                            }
                                                          });
                                                          setSelectedStaffPayments(newSelected);
                                                        }}
                                                      />
                                                      <span>Staff</span>
                                                    </div>
                                                  </th>
                                                  <th className="text-center pb-2 font-medium">Days</th>
                                                  <th className="text-center pb-2 font-medium">Basic Salary</th>
                                                  <th className="text-center pb-2 font-medium">Claims</th>
                                                  <th className="text-center pb-2 font-medium">Commission</th>
                                                  <th className="text-right pb-2 font-medium">Total Amount</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {paymentItems[payment.id]?.map((item, idx) => {
                                                  // Parse payment details from the original data
                                                  const paymentData = payment.payments?.find((p: unknown) => p.staff_id === item.staff_id);
                                                  const workingDays = paymentData?.total_days || paymentData?.working_dates?.length || 0;
                                                  const payrollDetails = paymentData?.payroll_details || {};
                                                  const basicSalary = payrollDetails.basicSalary || 0;
                                                  const claims = payrollDetails.claims || 0;
                                                  const commission = payrollDetails.commission || 0;
                                                  
                                                  return (
                                                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                      <td className="py-3 text-left">
                                                        <div className="flex items-center gap-3">
                                                          <Checkbox
                                                            checked={selectedStaffPayments.has(`${payment.id}-${item.id}`)}
                                                            onCheckedChange={(checked) => 
                                                              handleSelectStaffPayment(`${payment.id}-${item.id}`, checked as boolean)
                                                            }
                                                            className="flex-shrink-0"
                                                          />
                                                          <TooltipProvider>
                                                            <Tooltip>
                                                              <TooltipTrigger asChild>
                                                                <div className="relative group cursor-pointer">
                                                                  <Avatar className="h-8 w-8">
                                                                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                                      {item.staff_name?.split(' ').map(n => n[0]).join('') || '?'}
                                                                    </AvatarFallback>
                                                                  </Avatar>
                                                                </div>
                                                              </TooltipTrigger>
                                                              <TooltipContent side="right">
                                                                <div className="p-2">
                                                                  <p className="font-medium">{item.staff_name}</p>
                                                                  {payrollDetails.email && (
                                                                    <p className="text-xs text-muted-foreground">{payrollDetails.email}</p>
                                                                  )}
                                                                  {payrollDetails.phone && (
                                                                    <p className="text-xs text-muted-foreground">{payrollDetails.phone}</p>
                                                                  )}
                                                                </div>
                                                              </TooltipContent>
                                                            </Tooltip>
                                                          </TooltipProvider>
                                                          <div className="text-left">
                                                            <p className="font-medium text-sm text-left">{item.staff_name}</p>
                                                            <p className="text-xs text-muted-foreground text-left">
                                                              {item.bank_code} - {item.bank_account_number}
                                                            </p>
                                                          </div>
                                                        </div>
                                                      </td>
                                                      <td className="text-center text-sm">{workingDays}</td>
                                                      <td className="text-center text-sm">RM {basicSalary.toLocaleString()}</td>
                                                      <td className="text-center text-sm">RM {claims.toLocaleString()}</td>
                                                      <td className="text-center text-sm">RM {commission.toLocaleString()}</td>
                                                      <td className="text-right font-bold text-sm">RM {item.amount.toLocaleString()}</td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="space-y-2 text-xs">
                                          <div className="flex items-center justify-between py-1">
                                            <span className="text-muted-foreground">Payment Method:</span>
                                            <span className="font-medium capitalize">{payment.payment_method || 'Bank Transfer'}</span>
                                          </div>
                                          <div className="flex items-center justify-between py-1">
                                            <span className="text-muted-foreground">Total Amount:</span>
                                            <span className="font-medium">RM {payment.total_amount?.toLocaleString() || '0'}</span>
                                          </div>
                                          <div className="flex items-center justify-between py-1">
                                            <span className="text-muted-foreground">Staff Count:</span>
                                            <span className="font-medium">{payment.staff_count || 0} staff</span>
                                          </div>
                                          <div className="flex items-center justify-between py-1">
                                            <span className="text-muted-foreground">Reference:</span>
                                            <span className="font-mono text-[10px]">{payment.batch_reference}</span>
                                          </div>
                                        </div>
                                      )}
                                      {payment.notes && (
                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                          <p className="text-xs text-muted-foreground">
                                            <span className="font-medium">Notes:</span> {payment.notes}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  </div>
                                </TableCell>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first page, last page, current page, and pages around current
                          return page === 1 || 
                                 page === totalPages || 
                                 Math.abs(page - currentPage) <= 1;
                        })
                        .map((page, index, array) => (
                          <React.Fragment key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-1">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-9"
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
    </TooltipProvider>
  );
}