import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '../lib/logger';
import { supabase } from '@/lib/supabase';
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
import { PlusCircle, Receipt, TrendingUp, TrendingDown, DollarSign, AlertCircle, BarChart3, Calendar, Clock, ArrowUpRight, ArrowDownRight, Target, Zap } from 'lucide-react';
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
      // Get the current user ID from Supabase auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to create an expense claim',
          variant: 'destructive',
        });
        return;
      }

      await createClaim({
        ...formData,
        user_id: user.id,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Expense Claims
            </h1>
            <p className="text-slate-600 mt-2">Manage your expense claims and track spending patterns</p>
          </div>
          <Button 
            onClick={() => setIsFormDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Claim
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="bg-slate-100/70 backdrop-blur-sm border-0 p-1 rounded-xl shadow-inner">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-800 text-slate-600 rounded-lg font-medium transition-all duration-200"
                  >
                    All Claims
                  </TabsTrigger>
                  <TabsTrigger 
                    value="draft" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-800 text-slate-600 rounded-lg font-medium transition-all duration-200"
                  >
                    Drafts
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pending" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-800 text-slate-600 rounded-lg font-medium transition-all duration-200"
                  >
                    Pending
                  </TabsTrigger>
                  <TabsTrigger 
                    value="approved" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-800 text-slate-600 rounded-lg font-medium transition-all duration-200"
                  >
                    Approved
                  </TabsTrigger>
                  <TabsTrigger 
                    value="rejected" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-800 text-slate-600 rounded-lg font-medium transition-all duration-200"
                  >
                    Rejected
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab} className="mt-8">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
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
            </CardContent>
          </Card>
        </motion.div>
        
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="sm:max-w-[800px] bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Create New Expense Claim
              </DialogTitle>
              <DialogDescription className="text-slate-600">
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
    </div>
  );
}