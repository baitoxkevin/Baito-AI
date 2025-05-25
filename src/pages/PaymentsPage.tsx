import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  FileSpreadsheet
} from 'lucide-react';
import { motion } from 'framer-motion';
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


// Dummy staff data for hover preview
const dummyStaffData = {
  'BATCH-001': [
    { id: 1, name: 'John Doe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
    { id: 2, name: 'Jane Smith', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' },
    { id: 3, name: 'Mike Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
    { id: 4, name: 'Lisa Wong', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' },
    { id: 5, name: 'David Lee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
    { id: 6, name: 'Sarah Tan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 7, name: 'Tom Wilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom' },
    { id: 8, name: 'Amy Zhang', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amy' }
  ],
  'BATCH-002': [
    { id: 9, name: 'Ryan Kumar', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan' },
    { id: 10, name: 'Emma Liu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
    { id: 11, name: 'James Park', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' },
    { id: 12, name: 'Sophia Kim', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia' },
    { id: 13, name: 'Alex Brown', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' }
  ],
  'BATCH-003': [
    { id: 14, name: 'Team Member 1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TM1' },
    { id: 15, name: 'Team Member 2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TM2' },
    { id: 16, name: 'Team Member 3', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TM3' },
    { id: 17, name: 'Team Member 4', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TM4' },
    { id: 18, name: 'Team Member 5', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TM5' },
    { id: 19, name: 'Team Member 6', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TM6' },
    { id: 20, name: 'Team Member 7', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TM7' },
    { id: 21, name: 'Team Member 8', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TM8' },
    { id: 22, name: 'Team Member 9', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TM9' },
    { id: 23, name: 'Team Member 10', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TM10' },
    { id: 24, name: 'Team Member 11', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TM11' },
    { id: 25, name: 'Team Member 12', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TM12' },
    { id: 26, name: 'Team Member 13', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TM13' },
    { id: 27, name: 'Team Member 14', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TM14' },
    { id: 28, name: 'Team Member 15', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TM15' }
  ]
};

// Dummy data for payment submissions
const dummyPaymentBatches = [
  {
    id: 'BATCH-001',
    batch_reference: 'PAY-2025-001',
    project_id: 'proj-1',
    project_name: 'Website Redesign Q1',
    created_by: 'user-1',
    created_by_name: 'Sarah Chen',
    created_at: new Date('2025-01-24T10:30:00'),
    payment_date: new Date('2025-01-31'),
    total_amount: 25500,
    status: 'pending',
    payment_method: 'duitnow',
    notes: 'Monthly payroll for 8 team members',
    staff_count: 8
  },
  {
    id: 'BATCH-002',
    batch_reference: 'PAY-2025-002',
    project_id: 'proj-2',
    project_name: 'Mobile App Development',
    created_by: 'user-2',
    created_by_name: 'Ahmad Ibrahim',
    created_at: new Date('2025-01-23T14:15:00'),
    payment_date: new Date('2025-01-30'),
    total_amount: 18750,
    status: 'approved',
    approved_by_name: 'Michael Tan',
    approved_at: new Date('2025-01-23T16:45:00'),
    payment_method: 'bank_transfer',
    notes: 'Development team payment + overtime',
    staff_count: 5
  },
  {
    id: 'BATCH-003',
    batch_reference: 'PAY-2025-003',
    project_id: 'proj-3',
    project_name: 'Annual Conference 2025',
    created_by: 'user-3',
    created_by_name: 'Fatimah Zahra',
    created_at: new Date('2025-01-22T09:00:00'),
    payment_date: new Date('2025-01-25'),
    total_amount: 42300,
    status: 'pending',
    payment_method: 'duitnow',
    notes: 'Event crew payment - 3 day conference',
    staff_count: 15
  },
  {
    id: 'BATCH-004',
    batch_reference: 'PAY-2025-004',
    project_id: 'proj-4',
    project_name: 'Digital Marketing Campaign',
    created_by: 'user-4',
    created_by_name: 'Lim Wei Chen',
    created_at: new Date('2025-01-21T11:30:00'),
    payment_date: new Date('2025-01-28'),
    total_amount: 8900,
    status: 'rejected',
    approved_by_name: 'Michael Tan',
    approved_at: new Date('2025-01-21T15:00:00'),
    payment_method: 'cheque',
    notes: 'Creative team payment',
    rejection_reason: 'Missing bank details for 2 staff members',
    staff_count: 3
  },
  {
    id: 'BATCH-005',
    batch_reference: 'PAY-2025-005',
    project_id: 'proj-5',
    project_name: 'E-commerce Platform',
    created_by: 'user-1',
    created_by_name: 'Sarah Chen',
    created_at: new Date('2025-01-20T16:20:00'),
    payment_date: new Date('2025-01-27'),
    total_amount: 35600,
    status: 'completed',
    approved_by_name: 'Michael Tan',
    approved_at: new Date('2025-01-20T17:00:00'),
    exported_at: new Date('2025-01-21T09:00:00'),
    payment_method: 'duitnow',
    notes: 'Backend team monthly payment',
    staff_count: 6
  },
  {
    id: 'BATCH-006',
    batch_reference: 'PAY-2025-006',
    project_id: 'proj-6',
    project_name: 'Corporate Training Program',
    created_by: 'user-5',
    created_by_name: 'Kumar Rajesh',
    created_at: new Date('2025-01-19T13:45:00'),
    payment_date: new Date('2025-01-26'),
    total_amount: 15200,
    status: 'processing',
    approved_by_name: 'Jessica Wong',
    approved_at: new Date('2025-01-19T16:30:00'),
    payment_method: 'bank_transfer',
    notes: 'Trainer fees and support staff',
    staff_count: 4
  },
  {
    id: 'BATCH-007',
    batch_reference: 'PAY-2025-007',
    project_id: 'proj-7',
    project_name: 'Product Photography',
    created_by: 'user-6',
    created_by_name: 'Tan Mei Ling',
    created_at: new Date('2025-01-18T10:00:00'),
    payment_date: new Date('2025-01-24'),
    total_amount: 6800,
    status: 'completed',
    approved_by_name: 'Jessica Wong',
    approved_at: new Date('2025-01-18T11:30:00'),
    exported_at: new Date('2025-01-19T08:00:00'),
    payment_method: 'duitnow',
    notes: 'Photography team payment',
    staff_count: 2
  },
  {
    id: 'BATCH-008',
    batch_reference: 'PAY-2025-008',
    project_id: 'proj-8',
    project_name: 'Security Audit Q1',
    created_by: 'user-7',
    created_by_name: 'Hassan Ali',
    created_at: new Date('2025-01-17T15:30:00'),
    payment_date: new Date('2025-01-23'),
    total_amount: 12400,
    status: 'approved',
    approved_by_name: 'Michael Tan',
    approved_at: new Date('2025-01-17T17:00:00'),
    payment_method: 'bank_transfer',
    notes: 'Security team monthly payment',
    staff_count: 3
  },
  {
    id: 'BATCH-009',
    batch_reference: 'PAY-2025-009',
    project_id: 'proj-9',
    project_name: 'Content Creation Sprint',
    created_by: 'user-8',
    created_by_name: 'Rachel Ng',
    created_at: new Date('2025-01-16T09:15:00'),
    payment_date: new Date('2025-01-22'),
    total_amount: 9600,
    status: 'pending',
    payment_method: 'duitnow',
    notes: 'Content writers and editors payment',
    staff_count: 4
  },
  {
    id: 'BATCH-010',
    batch_reference: 'PAY-2025-010',
    project_id: 'proj-10',
    project_name: 'Infrastructure Migration',
    created_by: 'user-9',
    created_by_name: 'David Lee',
    created_at: new Date('2025-01-15T14:00:00'),
    payment_date: new Date('2025-01-21'),
    total_amount: 28900,
    status: 'approved',
    approved_by_name: 'Jessica Wong',
    approved_at: new Date('2025-01-15T16:00:00'),
    payment_method: 'bank_transfer',
    notes: 'DevOps team special project payment',
    staff_count: 5
  }
];

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentBatches, setPaymentBatches] = useState<any[]>(dummyPaymentBatches);
  const [loading, setLoading] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState(() => {
    const pending = dummyPaymentBatches.filter(b => b.status === 'pending').length;
    const approved = dummyPaymentBatches.filter(b => b.status === 'approved').length;
    const totalAmount = dummyPaymentBatches.reduce((sum, batch) => sum + (batch.total_amount || 0), 0);
    
    return {
      totalPayments: dummyPaymentBatches.length,
      pendingCount: pending,
      approvedCount: approved,
      totalAmount
    };
  });
  const [userRole, setUserRole] = useState<string>('admin');
  const [canApprove, setCanApprove] = useState(true);
  const { toast } = useToast();

  // Fetch user role (commented out for demo, using admin role by default)
  /*
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
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, []);
  */

  // Update stats when payment batches change
  const updateStats = () => {
    const pending = paymentBatches.filter(b => b.status === 'pending').length;
    const approved = paymentBatches.filter(b => b.status === 'approved').length;
    const totalAmount = paymentBatches.reduce((sum, batch) => sum + (batch.total_amount || 0), 0);
    
    setStats({
      totalPayments: paymentBatches.length,
      pendingCount: pending,
      approvedCount: approved,
      totalAmount
    });
  };

  const handleApprove = async (batchId: string) => {
    try {
      // Update local state to simulate approval
      setPaymentBatches(prev => prev.map(batch => 
        batch.id === batchId 
          ? { ...batch, status: 'approved', approved_by_name: 'Current User', approved_at: new Date() }
          : batch
      ));
      
      toast({
        title: "Payment Approved",
        description: "The payment batch has been approved successfully"
      });
      
      // Update stats
      setTimeout(updateStats, 100);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve payment",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (batchId: string) => {
    try {
      // Update local state to simulate rejection
      setPaymentBatches(prev => prev.map(batch => 
        batch.id === batchId 
          ? { ...batch, status: 'rejected', approved_by_name: 'Current User', approved_at: new Date() }
          : batch
      ));
      
      toast({
        title: "Payment Rejected",
        description: "The payment batch has been rejected"
      });
      
      // Update stats
      setTimeout(updateStats, 100);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject payment",
        variant: "destructive"
      });
    }
  };

  const filteredPayments = paymentBatches.filter(payment => 
    payment.batch_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.created_by_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
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
                        <TableHead>Project</TableHead>
                        <TableHead className="text-center">By</TableHead>
                        <TableHead className="text-center">Staff</TableHead>
                        <TableHead className="text-center">Date</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment, index) => (
                        <motion.tr
                          key={payment.id}
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
                            <span className="text-sm font-medium">{payment.project_name || 'N/A'}</span>
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
                                    {format(new Date(payment.created_at), 'MMM d, yyyy')}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors">
                                    {payment.staff_count || 0} Staff
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="p-0">
                                  <div className="p-3 max-w-sm">
                                    <p className="text-sm font-medium mb-2">Staff Members</p>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                      {(dummyStaffData[payment.id] || []).slice(0, payment.staff_count || 0).map((staff) => (
                                        <Tooltip key={staff.id}>
                                          <TooltipTrigger asChild>
                                            <Avatar className="h-8 w-8 cursor-pointer">
                                              <AvatarImage src={staff.avatar} />
                                              <AvatarFallback>
                                                {staff.name.split(' ').map(n => n[0]).join('')}
                                              </AvatarFallback>
                                            </Avatar>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-xs">{staff.name}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      ))}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-center">
                            <div>
                              <div className="text-sm">
                                {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(payment.payment_date), 'h:mm a')}
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
                                <p className="text-xs">{getStatusInfo(payment.status).tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            RM {(payment.total_amount || 0).toLocaleString()}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
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