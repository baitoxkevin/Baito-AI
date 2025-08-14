import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '../lib/logger';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { ExpenseClaimsList } from '@/components/ExpenseClaimsList';
import { ExpenseClaimForm } from '@/components/ExpenseClaimForm';
import { useExpenseClaims } from '@/hooks/use-expense-claims';
import { ExpenseClaim } from '@/lib/expense-claim-service';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Receipt, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Project {
  id: string;
  title: string;
}

interface Approver {
  id: string;
  name: string;
  email: string;
}

export default function ExpenseClaimsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const { createClaim, fetchClaims } = useExpenseClaims();
  const { toast } = useToast();

  // Fetch projects, approvers, and check if user is admin
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, you would fetch these from your API
        setProjects([
          { id: '1', title: 'Marketing Campaign' },
          { id: '2', title: 'Product Launch' },
          { id: '3', title: 'Team Building Event' },
        ]);
        
        setApprovers([
          { id: '101', name: 'John Smith', email: 'john@example.com' },
          { id: '102', name: 'Sarah Johnson', email: 'sarah@example.com' },
          { id: '103', name: 'Ahmed Khan', email: 'ahmed@example.com' },
        ]);
        
        // Check if user is admin - in a real app this would be based on auth state
        setIsAdmin(true);
      } catch (error) {
        logger.error('Failed to fetch data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load page data',
          variant: 'destructive',
        });
      }
    };

    fetchData();
  }, [toast]);

  // Handle creating a new expense claim
  const handleCreateClaim = async (formData: Partial<ExpenseClaim>) => {
    try {
      // In a real app, you would collect the user ID from auth state
      const userId = 'current-user-id';
      
      await createClaim({
        ...formData,
        user_id: userId,
      });
      
      setIsFormDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Expense claim created successfully',
      });
      
      // Refresh the claims list
      fetchClaims();
    } catch (error) {
      logger.error('Failed to create expense claim:', error);
      toast({
        title: 'Error',
        description: 'Failed to create expense claim',
        variant: 'destructive',
      });
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Get filter by status based on active tab
  const getFilterByStatus = (): ExpenseClaim['status'] | undefined => {
    switch (activeTab) {
      case 'draft':
        return 'draft';
      case 'pending':
        return 'pending';
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      default:
        return undefined;
    }
  };

  return (
    <div className="container mx-auto px-6 py-6 max-w-7xl">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-between items-center mb-6"
      >
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Expense Claims
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your expense claims and receipts</p>
        </div>
        <Button 
          onClick={() => setIsFormDialogOpen(true)}
          variant="outline"
          className="border-gray-200 hover:bg-gray-50 text-gray-700"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Claim
        </Button>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6"
      >
        <Card className="border border-gray-200 bg-white hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Total Approved
            </CardTitle>
            <div className="p-1.5 rounded-md bg-gray-50">
              <TrendingUp className="h-3.5 w-3.5 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-gray-900">
              RM 8,450.00
            </div>
            <p className="text-xs text-gray-500 mt-1">
              From 23 approved claims
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200 bg-white hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Pending Approval
            </CardTitle>
            <div className="p-1.5 rounded-md bg-gray-50">
              <AlertCircle className="h-3.5 w-3.5 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-gray-900">
              RM 2,370.00
            </div>
            <p className="text-xs text-gray-500 mt-1">
              From 8 pending claims
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200 bg-white hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              This Month
            </CardTitle>
            <div className="p-1.5 rounded-md bg-gray-50">
              <DollarSign className="h-3.5 w-3.5 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-gray-900">
              RM 3,240.00
            </div>
            <p className="text-xs text-gray-500 mt-1">
              From 12 claims
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200 bg-white hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Rejection Rate
            </CardTitle>
            <div className="p-1.5 rounded-md bg-gray-50">
              <TrendingDown className="h-3.5 w-3.5 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-gray-900">
              5.3%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              2 rejected out of 38 submitted
            </p>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="bg-gray-50 border border-gray-200 p-0.5">
            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-600">All Claims</TabsTrigger>
            <TabsTrigger value="draft" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-600">Drafts</TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-600">Pending</TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-600">Approved</TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-600">Rejected</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
          <ExpenseClaimsList
            title={`${activeTab === 'all' ? 'All' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Expense Claims`}
            description={
              activeTab === 'all'
                ? 'View all your expense claims'
                : activeTab === 'draft'
                ? 'Claims that are not yet submitted for approval'
                : activeTab === 'pending'
                ? 'Claims waiting for approval'
                : activeTab === 'approved'
                ? 'Claims that have been approved'
                : 'Claims that have been rejected'
            }
            filterByStatus={getFilterByStatus()}
            maxItems={50}
            showViewAll={false}
              isAdmin={isAdmin}
            />
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
      
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Create New Expense Claim</DialogTitle>
            <DialogDescription>
              Fill in the details and add receipts to create a new expense claim.
            </DialogDescription>
          </DialogHeader>
          
          <ExpenseClaimForm
            projects={projects}
            approvers={approvers}
            onSubmit={handleCreateClaim}
            onCancel={() => setIsFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}