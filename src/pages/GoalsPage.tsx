import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Target, TrendingUp, Award, Calendar, DollarSign, Plus, Edit2, Trash2, CheckCircle2, FileText, Download, Search, Filter, Receipt, AlertCircle, ArrowUp, ArrowDown, Clock, Eye, EyeOff, ChevronRight, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, addDays, differenceInDays, parseISO } from 'date-fns';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Types
interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  quotation_number?: string;
  client_name: string;
  project_name: string;
  amount: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  payment_date?: string;
  due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  target_amount?: number;
  current_amount: number;
  goal_type: 'revenue' | 'collection' | 'project' | 'custom';
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface InvoicePayment {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

// Utility functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800 border-green-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'partial': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Invoice Dialog Component
const InvoiceDialog = ({ invoice, open, onOpenChange, onSave }: {
  invoice?: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    quotation_number: '',
    client_name: '',
    project_name: '',
    amount: '',
    payment_status: 'pending' as Invoice['payment_status'],
    payment_date: '',
    due_date: '',
    notes: ''
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        quotation_number: invoice.quotation_number || '',
        client_name: invoice.client_name,
        project_name: invoice.project_name,
        amount: invoice.amount.toString(),
        payment_status: invoice.payment_status,
        payment_date: invoice.payment_date || '',
        due_date: invoice.due_date || '',
        notes: invoice.notes || ''
      });
    } else {
      setFormData({
        invoice_number: '',
        invoice_date: format(new Date(), 'yyyy-MM-dd'),
        quotation_number: '',
        client_name: '',
        project_name: '',
        amount: '',
        payment_status: 'pending',
        payment_date: '',
        due_date: '',
        notes: ''
      });
    }
  }, [invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        quotation_number: formData.quotation_number || null,
        client_name: formData.client_name,
        project_name: formData.project_name,
        amount: parseFloat(formData.amount),
        payment_status: formData.payment_status,
        payment_date: formData.payment_date || null,
        due_date: formData.due_date || null,
        notes: formData.notes || null
      };

      if (invoice) {
        const { error } = await supabase
          .from('invoices')
          .update(payload)
          .eq('id', invoice.id);
        
        if (error) throw error;
        toast({ title: 'Invoice updated successfully' });
      } else {
        const { error } = await supabase
          .from('invoices')
          .insert(payload);
        
        if (error) throw error;
        toast({ title: 'Invoice created successfully' });
      }
      
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
          <DialogDescription>
            Enter the invoice details below
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="INV-000488"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Invoice Date</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quotation_number">Quotation Number</Label>
              <Input
                id="quotation_number"
                value={formData.quotation_number}
                onChange={(e) => setFormData({ ...formData, quotation_number: e.target.value })}
                placeholder="322"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="MR.DIY"
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="project_name">Project Name</Label>
              <Input
                id="project_name"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                placeholder="MrDIY CNY Yayasan Sunbeam Home"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (RM)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="683.10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value: Invoice['payment_status']) => 
                  setFormData({ ...formData, payment_status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {invoice ? 'Update' : 'Create'} Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Goal Dialog Component
const GoalDialog = ({ goal, open, onOpenChange, onSave }: {
  goal?: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    goal_type: 'revenue' as Goal['goal_type'],
    period_type: 'monthly' as Goal['period_type'],
    start_date: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end_date: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    status: 'active' as Goal['status']
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description || '',
        target_amount: goal.target_amount?.toString() || '',
        goal_type: goal.goal_type,
        period_type: goal.period_type,
        start_date: goal.start_date,
        end_date: goal.end_date,
        status: goal.status
      });
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        target_amount: formData.target_amount ? parseFloat(formData.target_amount) : null,
        goal_type: formData.goal_type,
        period_type: formData.period_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status
      };

      if (goal) {
        const { error } = await supabase
          .from('goals')
          .update(payload)
          .eq('id', goal.id);
        
        if (error) throw error;
        toast({ title: 'Goal updated successfully' });
      } else {
        const { error } = await supabase
          .from('goals')
          .insert(payload);
        
        if (error) throw error;
        toast({ title: 'Goal created successfully' });
      }
      
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          <DialogDescription>
            Set up your revenue and collection goals
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Q1 Revenue Target"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Achieve 25% growth compared to last year..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goal_type">Goal Type</Label>
                <Select
                  value={formData.goal_type}
                  onValueChange={(value: Goal['goal_type']) => 
                    setFormData({ ...formData, goal_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="collection">Collection</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="period_type">Period</Label>
                <Select
                  value={formData.period_type}
                  onValueChange={(value: Goal['period_type']) => 
                    setFormData({ ...formData, period_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_amount">Target Amount (RM)</Label>
              <Input
                id="target_amount"
                type="number"
                step="0.01"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                placeholder="100000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {goal ? 'Update' : 'Create'} Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Batch Upload Dialog Component
const BatchUploadDialog = ({ open, onOpenChange, onUpload }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: () => void;
}) => {
  const { toast } = useToast();
  const [batchData, setBatchData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const sampleData = `Invoice Number,Date,Quotation,Client,Project,Amount,Status
INV-000488,2025-01-06,322,MR.DIY,MrDIY CNY Yayasan Sunbeam Home,683.10,paid
INV-000489,2025-01-06,315,MR.DIY,MrDIY CNY Workshop Mid Valley,7847.81,paid
INV-000490,2025-01-09,,MR.DIY,MrDIY CNY Workshop IPC,6302.85,paid
INV-000491,2025-01-10,324,DEX,Mindshare - Maxis,3600.00,paid
INV-000492,2025-01-10,,Lee Frozen,Lee Fozen @ Fandbee Kampung Attap,194.40,paid`;

  const parseCSVData = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return {
        invoice_number: values[0],
        invoice_date: values[1],
        quotation_number: values[2] || null,
        client_name: values[3],
        project_name: values[4],
        amount: parseFloat(values[5]),
        payment_status: (values[6]?.toLowerCase() || 'pending') as Invoice['payment_status']
      };
    });
  };

  const handleBatchUpload = async () => {
    if (!batchData.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter invoice data',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const invoicesToUpload = parseCSVData(batchData);
      
      // Process each invoice
      for (const invoice of invoicesToUpload) {
        try {
          // Convert date format from DD/MM/YYYY or YYYY-MM-DD to YYYY-MM-DD
          let formattedDate = invoice.invoice_date;
          if (invoice.invoice_date.includes('/')) {
            const [day, month, year] = invoice.invoice_date.split('/');
            formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          } else if (invoice.invoice_date.includes('-')) {
            const parts = invoice.invoice_date.split('-');
            if (parts[0].length === 4) {
              // Already in YYYY-MM-DD format
              formattedDate = invoice.invoice_date;
            } else {
              // DD-MM-YYYY format
              const [day, month, year] = parts;
              formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          }

          const payload = {
            ...invoice,
            invoice_date: formattedDate,
            payment_date: invoice.payment_status === 'paid' ? formattedDate : null
          };

          const { error } = await supabase
            .from('invoices')
            .insert(payload);
          
          if (error && error.code !== '23505') { // Ignore duplicate key errors
            console.error('Error uploading invoice:', error);
          }
        } catch (err) {
          console.error('Error processing invoice:', invoice.invoice_number, err);
        }
      }

      toast({ 
        title: 'Success', 
        description: `Uploaded ${invoicesToUpload.length} invoices successfully` 
      });
      onUpload();
      onOpenChange(false);
      setBatchData('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to parse CSV data. Please check the format.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Upload Invoices</DialogTitle>
          <DialogDescription>
            Paste invoice data in CSV format below. Use the sample format as a guide.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Sample Format:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              {sampleData}
            </pre>
          </div>
          <div className="space-y-2">
            <Label htmlFor="batch-data">Invoice Data (CSV Format)</Label>
            <Textarea
              id="batch-data"
              value={batchData}
              onChange={(e) => setBatchData(e.target.value)}
              placeholder="Paste your invoice data here..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tips:</strong>
              <ul className="list-disc list-inside mt-1">
                <li>Date format: YYYY-MM-DD or DD/MM/YYYY</li>
                <li>Status options: pending, paid, partial, overdue, cancelled</li>
                <li>Amount should be numeric (e.g., 1234.56)</li>
                <li>Leave quotation empty if not available</li>
              </ul>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setBatchData('');
              onOpenChange(false);
            }}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBatchUpload}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Invoices
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const GoalsPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [batchUploadOpen, setBatchUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching invoices',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Fetch goals
  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching goals',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchInvoices(), fetchGoals()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Delete invoice
  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Invoice deleted successfully' });
      fetchInvoices();
    } catch (error: any) {
      toast({
        title: 'Error deleting invoice',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Delete goal
  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Goal deleted successfully' });
      fetchGoals();
    } catch (error: any) {
      toast({
        title: 'Error deleting goal',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Update payment status
  const handleUpdatePaymentStatus = async (id: string, status: Invoice['payment_status']) => {
    try {
      const updates: any = { payment_status: status };
      if (status === 'paid' && !invoices.find(inv => inv.id === id)?.payment_date) {
        updates.payment_date = format(new Date(), 'yyyy-MM-dd');
      }

      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Payment status updated' });
      fetchInvoices();
    } catch (error: any) {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedInvoices.size} invoices?`)) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('id', Array.from(selectedInvoices));

      if (error) throw error;
      toast({ title: `${selectedInvoices.size} invoices deleted successfully` });
      setSelectedInvoices(new Set());
      fetchInvoices();
    } catch (error: any) {
      toast({
        title: 'Error deleting invoices',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleBulkExport = () => {
    const selectedData = invoices.filter(inv => selectedInvoices.has(inv.id));
    const csv = [
      ['Invoice Number', 'Date', 'Client', 'Project', 'Amount', 'Status'],
      ...selectedData.map(inv => [
        inv.invoice_number,
        inv.invoice_date,
        inv.client_name,
        inv.project_name,
        inv.amount.toString(),
        inv.payment_status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.project_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || invoice.payment_status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Calculate statistics
  const stats = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paidAmount: invoices.filter(inv => inv.payment_status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    pendingAmount: invoices.filter(inv => inv.payment_status === 'pending').reduce((sum, inv) => sum + inv.amount, 0),
    overdueCount: invoices.filter(inv => inv.payment_status === 'overdue').length
  };

  // Monthly revenue data for chart
  const monthlyRevenue = React.useMemo(() => {
    const revenueByMonth: Record<string, number> = {};
    
    invoices.forEach(invoice => {
      if (invoice.payment_status === 'paid') {
        const month = format(parseISO(invoice.invoice_date), 'MMM yyyy');
        revenueByMonth[month] = (revenueByMonth[month] || 0) + invoice.amount;
      }
    });

    return Object.entries(revenueByMonth)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([month, amount]) => ({ month, amount }));
  }, [invoices]);

  // Client distribution data
  const clientDistribution = React.useMemo(() => {
    const clientTotals: Record<string, number> = {};
    
    invoices.forEach(invoice => {
      clientTotals[invoice.client_name] = (clientTotals[invoice.client_name] || 0) + invoice.amount;
    });

    return Object.entries(clientTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([client, amount]) => ({ 
        client, 
        amount,
        percentage: ((amount / stats.totalAmount) * 100).toFixed(1)
      }));
  }, [invoices, stats.totalAmount]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goals & Invoicing</h1>
          <p className="text-gray-600 mt-1">Track your revenue goals and manage invoices</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'invoices' && (
            <>
              {selectedInvoices.size > 0 && (
                <>
                  <Button variant="outline" onClick={handleBulkExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export ({selectedInvoices.size})
                  </Button>
                  <Button variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedInvoices.size})
                  </Button>
                </>
              )}
              <Button 
                variant="outline"
                onClick={() => setBatchUploadOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Batch Upload
              </Button>
              <Button onClick={() => {
                setSelectedInvoice(null);
                setInvoiceDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            </>
          )}
          {activeTab === 'goals' && (
            <Button onClick={() => {
              setSelectedGoal(null);
              setGoalDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overdueCount} overdue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              All invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.paidAmount)}</div>
            <p className="text-xs text-green-600">
              {stats.totalAmount > 0 ? ((stats.paidAmount / stats.totalAmount) * 100).toFixed(0) : 0}% collected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</div>
            <p className="text-xs text-yellow-600">
              To be collected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoices Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedInvoices(new Set(filteredInvoices.map(inv => inv.id)));
                          } else {
                            setSelectedInvoices(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedInvoices.has(invoice.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedInvoices);
                            if (checked) {
                              newSelected.add(invoice.id);
                            } else {
                              newSelected.delete(invoice.id);
                            }
                            setSelectedInvoices(newSelected);
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{format(parseISO(invoice.invoice_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{invoice.client_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={invoice.project_name}>
                        {invoice.project_name}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={invoice.payment_status}
                          onValueChange={(value: Invoice['payment_status']) => 
                            handleUpdatePaymentStatus(invoice.id, value)
                          }
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setInvoiceDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const progress = goal.target_amount 
                ? (goal.current_amount / goal.target_amount) * 100 
                : 0;

              return (
                <Card key={goal.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <CardDescription>{goal.description}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedGoal(goal);
                            setGoalDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Current</p>
                          <p className="font-medium">{formatCurrency(goal.current_amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Target</p>
                          <p className="font-medium">
                            {goal.target_amount ? formatCurrency(goal.target_amount) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <Badge variant="outline">{goal.goal_type}</Badge>
                        <Badge className={
                          goal.status === 'active' ? 'bg-green-100 text-green-800' :
                          goal.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          goal.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {goal.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Revenue from paid invoices by month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyRevenue}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `RM ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Client Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Top Clients</CardTitle>
                <CardDescription>Revenue distribution by client</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={clientDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {clientDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {clientDistribution.map((client, index) => (
                    <div key={client.client} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{client.client}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(client.amount)} ({client.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status Overview</CardTitle>
              <CardDescription>Distribution of invoices by payment status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['paid', 'pending', 'partial', 'overdue', 'cancelled'].map(status => {
                  const count = invoices.filter(inv => inv.payment_status === status).length;
                  const amount = invoices.filter(inv => inv.payment_status === status)
                    .reduce((sum, inv) => sum + inv.amount, 0);
                  const percentage = invoices.length > 0 ? (count / invoices.length) * 100 : 0;

                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge className={getPaymentStatusColor(status)}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {count} invoice{count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="font-medium">{formatCurrency(amount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            status === 'paid' ? 'bg-green-500' :
                            status === 'pending' ? 'bg-yellow-500' :
                            status === 'partial' ? 'bg-blue-500' :
                            status === 'overdue' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Reports</CardTitle>
              <CardDescription>Export your invoice and goal data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">Invoice Report</CardTitle>
                    <CardDescription>Export all invoice data to CSV</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        const csv = [
                          ['Invoice Number', 'Date', 'Client', 'Project', 'Amount', 'Status', 'Payment Date'],
                          ...invoices.map(inv => [
                            inv.invoice_number,
                            inv.invoice_date,
                            inv.client_name,
                            inv.project_name,
                            inv.amount.toString(),
                            inv.payment_status,
                            inv.payment_date || ''
                          ])
                        ].map(row => row.join(',')).join('\n');

                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `invoices_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                        a.click();
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Invoice Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">Revenue Summary</CardTitle>
                    <CardDescription>Monthly revenue breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        const csv = [
                          ['Month', 'Revenue', 'Invoice Count'],
                          ...monthlyRevenue.map(item => {
                            const monthInvoices = invoices.filter(inv => 
                              format(parseISO(inv.invoice_date), 'MMM yyyy') === item.month &&
                              inv.payment_status === 'paid'
                            );
                            return [
                              item.month,
                              item.amount.toString(),
                              monthInvoices.length.toString()
                            ];
                          })
                        ].map(row => row.join(',')).join('\n');

                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `revenue_summary_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                        a.click();
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Revenue Summary
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InvoiceDialog
        invoice={selectedInvoice}
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        onSave={() => {
          fetchInvoices();
          setSelectedInvoice(null);
        }}
      />

      <GoalDialog
        goal={selectedGoal}
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        onSave={() => {
          fetchGoals();
          setSelectedGoal(null);
        }}
      />

      <BatchUploadDialog
        open={batchUploadOpen}
        onOpenChange={setBatchUploadOpen}
        onUpload={() => {
          fetchInvoices();
        }}
      />
    </div>
  );
};

export default GoalsPage;