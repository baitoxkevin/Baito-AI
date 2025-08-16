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
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                  Total Approved
                </CardTitle>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl font-bold text-slate-800">
                    RM 8,450.00
                  </div>
                  <div className="flex items-center text-emerald-600 text-sm font-medium">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    +12.5%
                  </div>
                </div>
                <p className="text-sm text-emerald-600 font-medium mb-3">
                  From 23 approved claims
                </p>
                <div className="w-full bg-emerald-100 rounded-full h-2">
                  <motion.div 
                    className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '85%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
                <p className="text-xs text-emerald-600/80 mt-2">85% of target reached</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Pending Approval
                </CardTitle>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-4 w-4 text-white animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl font-bold text-slate-800">
                    RM 2,370.00
                  </div>
                  <div className="flex items-center text-amber-600 text-sm font-medium">
                    <Clock className="h-4 w-4 mr-1" />
                    8 claims
                  </div>
                </div>
                <p className="text-sm text-amber-600 font-medium mb-3">
                  Average wait: 2.3 days
                </p>
                <div className="flex space-x-1">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 h-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 + (i * 0.1) }}
                    />
                  ))}
                </div>
                <p className="text-xs text-amber-600/80 mt-2">8 claims awaiting review</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  This Month
                </CardTitle>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl font-bold text-slate-800">
                    RM 3,240.00
                  </div>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    <Target className="h-4 w-4 mr-1" />
                    67%
                  </div>
                </div>
                <p className="text-sm text-blue-600 font-medium mb-3">
                  From 12 claims this month
                </p>
                <div className="relative">
                  <svg className="w-full h-2" viewBox="0 0 100 8">
                    <defs>
                      <linearGradient id="monthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="100" height="8" rx="4" fill="#E0E7FF" />
                    <motion.rect
                      x="0" y="0" height="8" rx="4"
                      fill="url(#monthGradient)"
                      initial={{ width: 0 }}
                      animate={{ width: 67 }}
                      transition={{ duration: 1, delay: 0.7 }}
                    />
                  </svg>
                </div>
                <p className="text-xs text-blue-600/80 mt-2">67% of monthly budget used</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="group relative overflow-hidden bg-gradient-to-br from-violet-50 to-purple-50 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
                  Success Rate
                </CardTitle>
                <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-4 w-4 text-white" />
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl font-bold text-slate-800">
                    94.7%
                  </div>
                  <div className="flex items-center text-violet-600 text-sm font-medium">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +2.1%
                  </div>
                </div>
                <p className="text-sm text-violet-600 font-medium mb-3">
                  36 approved out of 38 submitted
                </p>
                <div className="relative w-full">
                  <svg className="w-16 h-16 mx-auto" viewBox="0 0 36 36">
                    <path
                      className="text-violet-200"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <motion.path
                      className="text-violet-500"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      initial={{ strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: "94.7, 100" }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />
                  </svg>
                </div>
                <p className="text-xs text-violet-600/80 mt-2">Excellent approval rate</p>
              </CardContent>
            </Card>
          </motion.div>
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