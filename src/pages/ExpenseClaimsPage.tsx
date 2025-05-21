import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { PlusCircle, Receipt } from 'lucide-react';

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
        console.error('Failed to fetch data:', error);
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
      console.error('Failed to create expense claim:', error);
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
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Claims</h1>
          <p className="text-gray-500">Manage your expense claims and receipts</p>
        </div>
        <Button onClick={() => setIsFormDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Claim
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Approved
            </CardTitle>
            <Receipt className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM 8,450.00</div>
            <p className="text-xs text-gray-500">
              From 23 approved claims
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
            <Receipt className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM 2,370.00</div>
            <p className="text-xs text-gray-500">
              From 8 pending claims
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month
            </CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM 3,240.00</div>
            <p className="text-xs text-gray-500">
              From 12 claims
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rejection Rate
            </CardTitle>
            <Receipt className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.3%</div>
            <p className="text-xs text-gray-500">
              2 rejected out of 38 submitted
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All Claims</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
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
        </TabsContent>
      </Tabs>
      
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