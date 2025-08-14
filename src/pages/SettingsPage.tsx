import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, PlusIcon, Edit2, Trash2, Building, Image, AlertCircle,
  User as UserIcon, Briefcase, Mail, Phone, Search, ShieldAlert,
  RefreshCcw, Database, Users2, Shield, CheckCircle2, Settings,
  UserPlus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import NewCompanyDialog from '@/components/NewCompanyDialog';
import NewCandidateDialog from '@/components/NewCandidateDialog';
import NewUserDialog from '@/components/NewUserDialog';
import UserConfigurationPage from './UserConfigurationPage';
import type { Company, Candidate, User } from '@/lib/types';
import { getUserProfile } from '@/lib/auth';

export default function SettingsPage() {
  const { toast } = useToast();
  
  // States
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyEditId, setCompanyEditId] = useState<string | null>(null);
  const [companyFormOpen, setCompanyFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auth check state
  const [authStatus, setAuthStatus] = useState<unknown>({
    loading: true,
    user: null,
    session: null,
    error: null,
    canAccessExpenseClaims: false,
    testResult: null
  });

  // Admin states
  const [currentUserRole, setCurrentUserRole] = useState<string>('staff');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  
  // Secondary sections state
  const [activeTab, setActiveTab] = useState("candidates");
  
  // Candidate state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateLoading, setCandidateLoading] = useState(true);
  const [candidateFormOpen, setCandidateFormOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  
  // Users/Staff state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Current user state for permission checks
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // Load companies data
  const loadCompanies = async () => {
    try {
      setCompanyLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('company_name');

      if (error) throw error;
      
      // Map database fields to the expected interface fields for compatibility
      const mappedCompanies = data?.map(company => ({
        ...company,
        name: company.company_name,
        contact_email: company.company_email,
        contact_phone: company.company_phone_no
      })) || [];
      
      setCompanies(mappedCompanies);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load companies. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCompanyLoading(false);
    }
  };

  // Load candidates data
  const loadCandidates = async () => {
    try {
      setCandidateLoading(true);
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          *,
          performance_metrics (
            reliability_score,
            response_rate,
            avg_rating,
            total_gigs_completed
          ),
          language_proficiency (
            language,
            proficiency_level,
            is_primary
          ),
          loyalty_status (
            tier_level,
            current_points
          )
        `)
        .order('full_name');

      if (error) throw error;
      
      setCandidates(data || []);
    } catch (error) {
      console.error('Error loading candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidates. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCandidateLoading(false);
    }
  };

  // Load users/staff data
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('full_name');

      if (error) throw error;
      
      // Add avatar URLs
      const usersWithAvatars = (data || []).map(user => ({
        ...user,
        avatar_url: '' // Using initials instead
      }));
      
      setUsers(usersWithAvatars);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUsersLoading(false);
    }
  };

  // Load current user info to check permissions
  const loadCurrentUser = async () => {
    try {
      setIsUserLoading(true);
      const profile = await getUserProfile();
      setCurrentUser(profile as User);
    } catch (error) {
      console.error('Error loading current user:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify your permissions.',
        variant: 'destructive',
      });
    } finally {
      setIsUserLoading(false);
    }
  };

  // Load data on initial render
  useEffect(() => {
    loadCurrentUser();
    loadCompanies();
    loadCurrentUserRole(); // Load user role on mount to check super admin status
  }, []);
  
  // Load other sections data when tab changes
  useEffect(() => {
    if (activeTab === "candidates") {
      loadCandidates();
    } else if (activeTab === "staff") {
      loadUsers();
    } else if (activeTab === "auth") {
      checkAuth();
    } else if (activeTab === "admin") {
      loadCurrentUserRole();
    }
  }, [activeTab]);

  // Load current user role
  const loadCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role, is_super_admin')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          setCurrentUserRole(userData.role || 'staff');
          setIsSuperAdmin(userData.is_super_admin || false);
        }
      }
    } catch (error) {
      console.error('Error loading user role:', error);
      // Set defaults on error
      setCurrentUserRole('staff');
      setIsSuperAdmin(false);
    }
  };

  // Handle company deletion - restricted to super_admin only
  const handleDeleteCompany = async (id: string) => {
    // Check if user is a super admin
    if (!isSuperAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only super admins can delete companies.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Company deleted',
        description: 'The company has been deleted successfully',
      });
      
      loadCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete company. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle candidate deletion
  const handleDeleteCandidate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Candidate deleted',
        description: 'The candidate has been deleted successfully',
      });
      
      loadCandidates();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete candidate. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle user/staff deletion
  const handleDeleteUser = async (id: string) => {
    // Check if user is a super admin
    if (!isSuperAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only super admins can delete staff members.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'User deleted',
        description: 'The user has been deleted successfully',
      });
      
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    }
  };


  // Filter companies based on search query
  const filteredCompanies = companies.filter(company =>
    searchQuery === "" ||
    company.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.pic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.company_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.company_phone_no?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check authentication status
  const checkAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setAuthStatus({ loading: false, error: sessionError.message });
        return;
      }

      if (!session) {
        setAuthStatus({ loading: false, user: null, session: null });
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Test expense_claims access
      const { data: claims, error: claimsError } = await supabase
        .from('expense_claims')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);

      setAuthStatus({
        loading: false,
        user: user,
        session: session,
        error: userError?.message || claimsError?.message,
        canAccessExpenseClaims: !claimsError
      });
    } catch (error) {
      setAuthStatus({ loading: false, error: error.message });
    }
  };

  // Test insert to expense claims
  const testInsert = async () => {
    if (!authStatus.session) {
      toast({
        title: 'Not logged in',
        description: 'You must be logged in to test insert',
        variant: 'destructive'
      });
      return;
    }

    const testClaim = {
      title: 'Settings Auth Test',
      description: 'Testing from Settings page',
      receipt_number: 'SETTINGS-TEST-001',
      amount: 25.00,
      total_amount: 25.00,
      user_id: authStatus.session.user.id,
      expense_date: new Date().toISOString().split('T')[0],
      category: 'transport',
      status: 'pending',
      submitted_at: new Date().toISOString(),
      submitted_by: 'Settings Test'
    };

    const { data, error } = await supabase
      .from('expense_claims')
      .insert([testClaim])
      .select()
      .single();

    if (error) {
      setAuthStatus(prev => ({ 
        ...prev, 
        testResult: `Insert failed: ${error.message}` 
      }));
      toast({
        title: 'Test failed',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      // Clean up test record
      await supabase.from('expense_claims').delete().eq('id', data.id);
      setAuthStatus(prev => ({ 
        ...prev, 
        testResult: 'Insert test successful!' 
      }));
      toast({
        title: 'Test successful',
        description: 'Expense claim test completed successfully'
      });
    }
  };

  return (
    <div className="flex-1 p-4 space-y-8">
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Companies Management Section - Only visible to non-super admins */}
      {!isSuperAdmin && (
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">Companies</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Manage client companies and their contact information
              </p>
            </div>
            <Button onClick={() => {
              setCompanyEditId(null);
              setCompanyFormOpen(true);
            }} size="sm">
              <PlusIcon className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          
          <div className="flex items-center w-full max-w-sm mb-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies, contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>
          
          {companyLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-1/3">Company / Logo</TableHead>
                    <TableHead className="w-1/5">Contact Info</TableHead>
                    <TableHead className="w-1/3">Primary Contact Person</TableHead>
                    <TableHead className="text-right w-1/6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map((company) => (
                      <TableRow key={company.id} className="cursor-pointer hover:bg-muted/20" onClick={() => {
                        setCompanyEditId(company.id);
                        setCompanyFormOpen(true);
                      }}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {company.logo_url ? (
                              <div className="h-12 w-12 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0 bg-white">
                                <img 
                                  src={company.logo_url} 
                                  alt={`${company.name} logo`} 
                                  className="h-full w-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUtYnVpbGRpbmciPjxyZWN0IHg9IjQiIHk9IjIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIyMCIgcng9IjIiLz48cGF0aCBkPSJNOSAyMnYtNGg2djQiLz48cGF0aCBkPSJNOCA2aDQuMDEiLz48cGF0aCBkPSJNMTIgNmg0Ii8+PHBhdGggZD0iTTggMTBoNy45OSIvPjxwYXRoIGQ9Ik04IDE0aDgiLz48L3N2Zz4='
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="h-12 w-12 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                <Building className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium text-base">
                                {company.name?.replace(/ Sdn Bhd| Enterprise|Enterprise| Bhd| Company| LLC| Ltd| Inc\.|, Inc\.|, Inc| Limited| Corporation/gi, '')}
                              </span>
                              {company.parent_id && (
                                <Badge variant="outline" className="mt-1 w-fit text-xs">
                                  Sub-company
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{company.contact_email || '—'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{company.contact_phone || '—'}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {company.pic_name ? (
                            <div className="flex flex-col gap-1 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                  <UserIcon className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <span className="font-medium">{company.pic_name}</span>
                              </div>
                              {company.pic_designation && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-8">
                                  <Briefcase className="h-3 w-3" />
                                  <span>{company.pic_designation}</span>
                                </div>
                              )}
                              {company.pic_email && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-8">
                                  <Mail className="h-3 w-3" />
                                  <span>{company.pic_email}</span>
                                </div>
                              )}
                              {company.pic_phone && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-8">
                                  <Phone className="h-3 w-3" />
                                  <span>{company.pic_phone}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompanyEditId(company.id);
                                setCompanyFormOpen(true);
                              }}
                            >
                              <PlusIcon className="h-3 w-3 mr-1" />
                              Add Contact
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompanyEditId(company.id);
                                setCompanyFormOpen(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            {/* Only show delete button for super admins */}
                            {isSuperAdmin && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCompany(company.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No companies found matching your search criteria.' : 'No companies found. Add a new company to get started.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Company Form Dialog */}
          {companyFormOpen && (
            <NewCompanyDialog 
              open={companyFormOpen}
              onOpenChange={setCompanyFormOpen}
              company={companies.find(c => c.id === companyEditId)}
              onCompanyAdded={loadCompanies}
            />
          )}
        </div>
      </div>
      )}
      
      {/* User Configuration Section - Only visible to super_admin */}
      {isSuperAdmin && (
        <div className="mt-8">
          <UserConfigurationPage />
        </div>
      )}
      
      {/* Other Settings (Tabs) - Admin tab visible to all, others to super_admin */}
      <div className="mt-8 space-y-6">
        <div>
          <h3 className="text-2xl font-bold">Advanced Settings</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Additional configuration options and system tools
          </p>
        </div>
        
        <Card className="overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b bg-muted/50">
              <TabsList className={isSuperAdmin ? "grid w-full grid-cols-4 h-auto p-0 bg-transparent" : "grid w-full grid-cols-1 h-auto p-0 bg-transparent"}>
                {isSuperAdmin && (
                  <>
                    <TabsTrigger 
                      value="candidates" 
                      className="rounded-none border-r data-[state=active]:bg-background data-[state=active]:shadow-none h-16 flex flex-col gap-1"
                    >
                      <Users2 className="h-5 w-5" />
                      <span className="text-xs">Candidates</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="staff" 
                      className="rounded-none border-r data-[state=active]:bg-background data-[state=active]:shadow-none h-16 flex flex-col gap-1"
                    >
                      <Shield className="h-5 w-5" />
                      <span className="text-xs">Staff</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="auth" 
                      className="rounded-none border-r data-[state=active]:bg-background data-[state=active]:shadow-none h-16 flex flex-col gap-1"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-xs">Auth Check</span>
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger 
                  value="admin" 
                  className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none h-16 flex flex-col gap-1"
                >
                  <Settings className="h-5 w-5" />
                  <span className="text-xs">Admin</span>
                </TabsTrigger>
              </TabsList>
            </div>
          
            {/* Candidates Tab - Only for super admins */}
            {isSuperAdmin && (
            <TabsContent value="candidates" className="p-0 m-0">
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">Candidates Management</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage candidate profiles and information
                    </p>
                  </div>
                  <Button onClick={() => {
                    setEditingCandidate(null);
                    setCandidateFormOpen(true);
                  }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Candidate
                  </Button>
                </div>
          
                {candidateLoading ? (
                  <div className="flex justify-center p-12 bg-muted/20 rounded-lg">
                    <div className="text-center space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground">Loading candidates...</p>
                    </div>
                  </div>
                ) : (
                  <Card>
                    <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.length > 0 ? (
                    candidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <img
                              className="rounded-full"
                              src={''}  // Using initials instead
                              width={32}
                              height={32}
                              alt={candidate.full_name}
                            />
                            <span className="font-medium">{candidate.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{candidate.email}</TableCell>
                        <TableCell>{candidate.phone_number}</TableCell>
                        <TableCell>
                          <Badge
                            variant={candidate.is_banned ? "destructive" : "success"}
                            className="font-normal"
                          >
                            {candidate.is_banned ? "Banned" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingCandidate(candidate);
                                setCandidateFormOpen(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                              onClick={() => handleDeleteCandidate(candidate.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No candidates found. Add a new candidate to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
          
          {/* Candidate Form Dialog */}
          {candidateFormOpen && (
            <NewCandidateDialog 
              open={candidateFormOpen}
              onOpenChange={setCandidateFormOpen}
              candidate={editingCandidate}
              onCandidateAdded={loadCandidates}
            />
          )}
              </div>
            </TabsContent>
            )}
        
        {/* Staff Management Tab - Only for super admins */}
        {isSuperAdmin && (
        <TabsContent value="staff" className="p-0 m-0">
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Staff Management</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage system users and their permissions
                </p>
              </div>
            
              {/* All users can add new staff */}
              <Button onClick={() => {
                setEditingUser(null);
                setUserFormOpen(true);
              }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </div>
          
          {/* Show permission notice for non-admin users */}
          {!isSuperAdmin && (
            <Alert className="bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800 mb-4">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                You can add new staff members, but only super admins can edit or delete existing staff.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Add User Dialog - accessible to all users */}
          <NewUserDialog
            open={userFormOpen}
            onOpenChange={setUserFormOpen}
            user={editingUser || undefined}
            onUserAdded={loadUsers}
          />
          
            {usersLoading || isUserLoading ? (
              <div className="flex justify-center p-12 bg-muted/20 rounded-lg">
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading staff members...</p>
                </div>
              </div>
            ) : (
              <Card>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <img
                              className="rounded-full"
                              src={user.avatar_url}
                              width={32}
                              height={32}
                              alt={user.full_name}
                            />
                            <span className="font-medium">{user.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.is_super_admin ? (
                            <Badge variant="secondary">Super Admin</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isSuperAdmin ? (
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingUser(user);
                                  setUserFormOpen(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              {/* Only show delete for non-super admin users */}
                              {!user.is_super_admin && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No actions available</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No staff users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </Card>
            )}
              </div>
            </TabsContent>
            )}
        
        {/* Auth Check Tab - Only for super admins */}
        {isSuperAdmin && (
        <TabsContent value="auth" className="p-0 m-0">
          <div className="p-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <CardTitle>Authentication Status Check</CardTitle>
                </div>
                <CardDescription>
                  Check your authentication status and test database access
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              {authStatus.loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <strong>Logged In:</strong> 
                      {authStatus.user ? (
                        <Badge variant="success">✅ Yes</Badge>
                      ) : (
                        <Badge variant="destructive">❌ No</Badge>
                      )}
                    </div>
                    {authStatus.user && (
                      <>
                        <div>
                          <strong>User ID:</strong> <code className="text-sm bg-gray-100 dark:bg-gray-800 p-1 rounded">{authStatus.user.id}</code>
                        </div>
                        <div>
                          <strong>Email:</strong> {authStatus.user.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <strong>Can Access Expense Claims:</strong> 
                          {authStatus.canAccessExpenseClaims ? (
                            <Badge variant="success">✅ Yes</Badge>
                          ) : (
                            <Badge variant="destructive">❌ No</Badge>
                          )}
                        </div>
                      </>
                    )}
                    {authStatus.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Error:</strong> {authStatus.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <div className="space-x-2">
                    <Button onClick={checkAuth} variant="outline">
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Refresh Status
                    </Button>
                    <Button 
                      onClick={testInsert} 
                      disabled={!authStatus.user}
                      variant="default"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Test Database Insert
                    </Button>
                  </div>
                  
                  {authStatus.testResult && (
                    <Alert className={authStatus.testResult.includes('successful') ? 'border-green-500' : 'border-red-500'}>
                      <AlertDescription>
                        <strong>Test Result:</strong> {authStatus.testResult}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          </div>
        </TabsContent>
        )}

        {/* Admin Tab - Available to all users */}
        <TabsContent value="admin" className="p-0 m-0">
          <div className="p-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Admin Controls</CardTitle>
                </div>
                <CardDescription>
                  Manage admin permissions and roles for your account
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="admin-role" className="text-base font-medium">Admin Role</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Grant admin privileges to access the Payments page
                      </p>
                    </div>
                    <Switch
                  id="admin-role"
                  checked={currentUserRole === 'admin'}
                  onCheckedChange={async (checked) => {
                    setAdminLoading(true);
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        const { error } = await supabase
                          .from('users')
                          .update({ role: checked ? 'admin' : 'staff' })
                          .eq('id', user.id);
                        
                        if (error) throw error;
                        
                        setCurrentUserRole(checked ? 'admin' : 'staff');
                        
                        toast({
                          title: 'Role Updated',
                          description: `User role changed to ${checked ? 'admin' : 'staff'}. Please refresh the page to see sidebar changes.`,
                        });
                      }
                    } catch (error) {
                      console.error('Error updating role:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to update user role',
                        variant: 'destructive'
                      });
                    } finally {
                      setAdminLoading(false);
                    }
                  }}
                  disabled={adminLoading}
                />
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="super-admin" className="text-base font-medium">Super Admin</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Grant full system access and configuration privileges
                      </p>
                    </div>
                    <Switch
                  id="super-admin"
                  checked={isSuperAdmin}
                  onCheckedChange={async (checked) => {
                    setAdminLoading(true);
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        const { error } = await supabase
                          .from('users')
                          .update({ is_super_admin: checked })
                          .eq('id', user.id);
                        
                        if (error) throw error;
                        
                        setIsSuperAdmin(checked);
                        
                        toast({
                          title: 'Super Admin Updated',
                          description: `Super admin status ${checked ? 'granted' : 'revoked'}. Please refresh the page to see changes.`,
                        });
                      }
                    } catch (error) {
                      console.error('Error updating super admin:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to update super admin status',
                        variant: 'destructive'
                      });
                    } finally {
                      setAdminLoading(false);
                    }
                  }}
                  disabled={adminLoading}
                />
                  </div>
                </div>
              </div>
              
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Current role: <span className="font-medium">{currentUserRole}</span>
                  {isSuperAdmin && <span className="text-blue-600 ml-2">(Super Admin)</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  Admin users can access the Payments page to view and export payment submissions from projects.
                </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
          </div>
        </TabsContent>
      </Tabs>
      </Card>
      </div>
    </div>
  );
}

// Add missing React import for hooks
const { useState, useEffect } = React;