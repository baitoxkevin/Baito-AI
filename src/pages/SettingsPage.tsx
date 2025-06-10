import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { logger } from '../lib/logger';
import { 
  Loader2, PlusIcon, Edit2, Trash2, Building, Image, AlertCircle,
  User as UserIcon, Briefcase, Mail, Phone, Search, ShieldAlert,
  RefreshCcw, Database, Users2, Shield, CheckCircle2, Settings,
  UserPlus, Sparkles, Building2, Users, ShieldCheck, Activity, Lock,
  ChevronDown, ChevronRight, Share2, Copy, Check
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import NewCompanyDialog from '@/components/NewCompanyDialog';
import NewCandidateDialog from '@/components/NewCandidateDialog';
import NewUserDialog from '@/components/NewUserDialog';
import UserConfigurationPage from './UserConfigurationPage';
import { NotificationSettings } from '@/components/NotificationSettings';
import type { Company, Candidate, User } from '@/lib/types';
import { getUserProfile } from '@/lib/auth';

// Import MagicUI components
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { BorderBeam } from '@/components/ui/border-beam';
import { MagicCard } from '@/components/ui/magic-card';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { Meteors } from '@/components/ui/meteors';
import { SparklesText } from '@/components/ui/sparkles-text';
import { DotPattern } from '@/components/ui/dot-pattern';
import { cn } from '@/lib/utils';

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

  // Candidates state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateLoading, setCandidateLoading] = useState(true);
  const [candidateFormOpen, setCandidateFormOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // New state for active tab
  const [activeTab, setActiveTab] = useState('companies');
  const [userRole, setUserRole] = useState<string>('staff');
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());



  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthStatus(prev => ({ ...prev, loading: true }));
        
        const { data: { user, session }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          setAuthStatus(prev => ({ 
            ...prev, 
            loading: false, 
            error: error?.message || 'Not authenticated',
            user: null,
            session: null 
          }));
          return;
        }

        // Try to access expense_claims table
        const { data: claims, error: claimsError } = await supabase
          .from('expense_claims')
          .select('id')
          .limit(1);

        const canAccessExpenseClaims = !claimsError;

        setAuthStatus({
          loading: false,
          user,
          session,
          error: null,
          canAccessExpenseClaims,
          testResult: canAccessExpenseClaims ? 'Success' : claimsError?.message
        });

      } catch (err) {
        logger.error('Auth check error:', err);
        setAuthStatus(prev => ({ 
          ...prev, 
          loading: false, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        }));
      }
    };

    checkAuth();
    // Get user role
    getUserProfile().then(profile => {
      setUserRole(profile.role || 'staff');
    }).catch(() => {
      setUserRole('staff');
    });
  }, []);

  const fetchCompanies = async () => {
    try {
      setCompanyLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          contacts:company_contacts(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      logger.error('Error fetching companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch companies',
        variant: 'destructive',
      });
    } finally {
      setCompanyLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      setCandidateLoading(true);
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      logger.error('Error fetching candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch candidates',
        variant: 'destructive',
      });
    } finally {
      setCandidateLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      logger.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchCandidates();
    fetchUsers();
  }, []);

  const handleDeleteCompany = async (id: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Company deleted successfully',
      });
      
      fetchCompanies();
    } catch (error) {
      logger.error('Error deleting company:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete company',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Candidate deleted successfully',
      });
      
      fetchCandidates();
    } catch (error) {
      logger.error('Error deleting candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete candidate',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      
      fetchUsers();
    } catch (error) {
      logger.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleSharePasswordLink = async (user: User) => {
    try {
      setCopiedUserId(user.id);
      
      // Generate a unique token for password setup
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry
      
      // Store the token in password_reset_tokens table
      const { error: tokenError } = await supabase
        .from("password_reset_tokens")
        .insert({
          user_id: user.id,
          token: token,
          email: user.email,
          expires_at: expiresAt.toISOString(),
          used: false
        });
        
      if (tokenError) {
        logger.error("Error creating password token:", tokenError);
        // Check if it's a table not found error
        if (tokenError.message?.includes('relation') && tokenError.message?.includes('does not exist')) {
          throw new Error("Password reset tokens table not found. Please run the migration script in Supabase SQL Editor.");
        }
        throw new Error(tokenError.message || "Failed to create password reset token");
      }
      
      // Generate the password setup link
      const baseUrl = window.location.origin;
      const setupLink = `${baseUrl}/set-password?token=${token}&email=${encodeURIComponent(user.email)}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(setupLink);
      
      toast({
        title: "Password Link Copied!",
        description: `Password setup link for ${user.full_name || user.email} has been copied to clipboard. Share this link with the user - they should open it in a private/incognito window to avoid conflicts.`,
      });
      
      // Reset copied state after 3 seconds
      setTimeout(() => {
        setCopiedUserId(null);
      }, 3000);
    } catch (error) {
      logger.error('Error generating password link:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate password setup link',
        variant: 'destructive',
      });
      setCopiedUserId(null);
    }
  };

  const filteredCompanies = companies.filter(company => 
    company.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.company_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.company_phone_no?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCandidates = candidates.filter(candidate => 
    candidate.full_name.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
    candidate.email?.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
    candidate.ic_number?.toLowerCase().includes(candidateSearchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const stats = [
    { 
      title: 'Total Companies', 
      value: companies.length, 
      icon: Building2,
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      title: 'Total Candidates', 
      value: candidates.length, 
      icon: Users,
      color: 'from-purple-500 to-pink-500'
    },
    { 
      title: 'Total Users', 
      value: users.length, 
      icon: UserIcon,
      color: 'from-green-500 to-emerald-500'
    },
    { 
      title: 'System Health', 
      value: '98%', 
      icon: Activity,
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      <div className="h-full p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <SparklesText
              text="Settings & Configuration"
              className="text-4xl md:text-5xl font-bold mb-2 text-gray-900 dark:text-white"
              sparklesCount={10}
            />
            <AnimatedGradientText className="text-lg">
              <span className={cn(
                "inline animate-gradient bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent"
              )}>
                Manage your workspace, users, and system preferences
              </span>
            </AnimatedGradientText>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <NeonGradientCard
                  className="relative overflow-hidden"
                  borderRadius={16}
                  borderSize={1.5}
                  neonColors={{ 
                    firstColor: stat.color.split(' ')[1].replace('to-', ''), 
                    secondColor: stat.color.split(' ')[0].replace('from-', '') 
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn(
                        "p-3 rounded-lg bg-gradient-to-r",
                        stat.color,
                        "bg-opacity-20"
                      )}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                      <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                  </div>
                  <BorderBeam size={60} duration={3} />
                </NeonGradientCard>
              </motion.div>
            ))}
          </div>

          {/* Main Content */}
          <MagicCard 
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            gradientColor="rgba(120, 119, 198, 0.1)"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <TabsTrigger 
                  value="companies" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                  disabled={userRole !== 'super_admin' && userRole !== 'admin'}
                >
                  {userRole !== 'super_admin' && userRole !== 'admin' && <Lock className="h-3 w-3 mr-1" />}
                  <Building2 className="h-4 w-4 mr-2" />
                  Companies
                </TabsTrigger>
                <TabsTrigger 
                  value="candidates"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                  disabled={userRole !== 'super_admin' && userRole !== 'admin' && userRole !== 'pm'}
                >
                  {userRole !== 'super_admin' && userRole !== 'admin' && userRole !== 'pm' && <Lock className="h-3 w-3 mr-1" />}
                  <Users className="h-4 w-4 mr-2" />
                  Candidates
                </TabsTrigger>
                <TabsTrigger 
                  value="users"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
                  disabled={userRole !== 'super_admin' && userRole !== 'admin'}
                >
                  {userRole !== 'super_admin' && userRole !== 'admin' && <Lock className="h-3 w-3 mr-1" />}
                  <UserIcon className="h-4 w-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="system"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
                  disabled={userRole !== 'super_admin'}
                >
                  {userRole !== 'super_admin' && <Lock className="h-3 w-3 mr-1" />}
                  <Settings className="h-4 w-4 mr-2" />
                  System
                </TabsTrigger>
              </TabsList>

              <TabsContent value="companies" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Company Management
                          </CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            Manage companies in your system
                          </CardDescription>
                        </div>
                        <ShimmerButton 
                          type="button"
                          className="relative z-10"
                          onClick={() => {
                            setCompanyEditId(null);
                            setCompanyFormOpen(true);
                          }}
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Company
                        </ShimmerButton>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Search companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                      </div>

                      {companyLoading ? (
                        <div className="flex justify-center items-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                      ) : filteredCompanies.length === 0 ? (
                        <div className="text-center py-12">
                          <Building className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 dark:text-gray-400">No companies found</p>
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                <TableHead className="text-gray-700 dark:text-gray-400 w-12"></TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-400">Name</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-400">Email</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-400">Phone</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-400 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredCompanies.map((company) => {
                                const isExpanded = expandedCompanies.has(company.id);
                                const hasContacts = company.contacts && company.contacts.length > 0;
                                
                                return (
                                  <React.Fragment key={company.id}>
                                    <TableRow 
                                      className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                      <TableCell className="w-12">
                                        {hasContacts && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => {
                                              const newExpanded = new Set(expandedCompanies);
                                              if (isExpanded) {
                                                newExpanded.delete(company.id);
                                              } else {
                                                newExpanded.add(company.id);
                                              }
                                              setExpandedCompanies(newExpanded);
                                            }}
                                          >
                                            {isExpanded ? (
                                              <ChevronDown className="h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4" />
                                            )}
                                          </Button>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center space-x-3">
                                          {company.logo_url ? (
                                            <img
                                              src={company.logo_url}
                                              alt={company.company_name}
                                              className="h-8 w-8 rounded-full object-cover"
                                            />
                                          ) : (
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                              <Building className="h-4 w-4 text-white" />
                                            </div>
                                          )}
                                          <div className="text-left">
                                            <p className="font-medium text-gray-900 dark:text-white">{company.company_name}</p>
                                            {hasContacts && (
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {company.contacts.length} contact{company.contacts.length > 1 ? 's' : ''}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-gray-700 dark:text-gray-300">{company.company_email || '-'}</TableCell>
                                      <TableCell className="text-gray-700 dark:text-gray-300">{company.company_phone_no || '-'}</TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setCompanyEditId(company.id);
                                              setCompanyFormOpen(true);
                                            }}
                                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                                          >
                                            <Edit2 className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteCompany(company.id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                    {isExpanded && hasContacts && company.contacts.map((contact, index) => (
                                      <TableRow 
                                        key={`${company.id}-contact-${contact.id || index}`}
                                        className="bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                                      >
                                        <TableCell></TableCell>
                                        <TableCell className="pl-14">
                                          <div className="flex items-center space-x-3">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                                              <UserIcon className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
                                                {contact.is_primary && (
                                                  <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">Primary</Badge>
                                                )}
                                              </div>
                                              {contact.designation && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{contact.designation}</p>
                                              )}
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-gray-700 dark:text-gray-300">{contact.email || '-'}</TableCell>
                                        <TableCell className="text-gray-700 dark:text-gray-300">{contact.phone || '-'}</TableCell>
                                        <TableCell></TableCell>
                                      </TableRow>
                                    ))}
                                  </React.Fragment>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="candidates" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Candidate Management
                          </CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            Manage candidates and crew members
                          </CardDescription>
                        </div>
                        <ShimmerButton 
                          type="button"
                          className="relative z-10"
                          onClick={() => {
                            setEditingCandidate(null);
                            setCandidateFormOpen(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Candidate
                        </ShimmerButton>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Search candidates..."
                            value={candidateSearchQuery}
                            onChange={(e) => setCandidateSearchQuery(e.target.value)}
                            className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                      </div>

                      {candidateLoading ? (
                        <div className="flex justify-center items-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                        </div>
                      ) : filteredCandidates.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 dark:text-gray-400">No candidates found</p>
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                <TableHead className="text-gray-700 dark:text-gray-400">Name</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-400">Email</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-400">Phone</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-400">IC Number</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-400">Status</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-400 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredCandidates.map((candidate) => (
                                <TableRow 
                                  key={candidate.id} 
                                  className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <TableCell>
                                    <div className="flex items-center space-x-3">
                                      {candidate.profile_photo ? (
                                        <img
                                          src={candidate.profile_photo}
                                          alt={candidate.full_name}
                                          className="h-8 w-8 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                          <UserIcon className="h-4 w-4 text-white" />
                                        </div>
                                      )}
                                      <p className="font-medium text-gray-900 dark:text-white">{candidate.full_name}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-gray-700 dark:text-gray-300">{candidate.email || '-'}</TableCell>
                                  <TableCell className="text-gray-700 dark:text-gray-300">{candidate.phone_number || '-'}</TableCell>
                                  <TableCell className="text-gray-700 dark:text-gray-300">{candidate.ic_number || '-'}</TableCell>
                                  <TableCell>
                                    <Badge 
                                      className={cn(
                                        "border-none",
                                        candidate.is_active 
                                          ? "bg-green-500/20 text-green-400" 
                                          : "bg-gray-500/20 text-gray-400"
                                      )}
                                    >
                                      {candidate.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingCandidate(candidate);
                                          setCandidateFormOpen(true);
                                        }}
                                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteCandidate(candidate.id)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            User Management
                          </CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            Manage system users and permissions
                          </CardDescription>
                        </div>
                        <ShimmerButton 
                          type="button"
                          className="relative z-10"
                          onClick={() => {
                            setEditingUser(null);
                            setUserFormOpen(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add User
                        </ShimmerButton>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Search users..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                      </div>

                      {usersLoading ? (
                        <div className="flex justify-center items-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 dark:text-gray-400">No users found</p>
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                <TableHead className="text-gray-700 dark:text-gray-400">Name</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-400">Email</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-400">Role</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-400">Company</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-400">Status</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-400 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredUsers.map((user) => (
                                <TableRow 
                                  key={user.id} 
                                  className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <TableCell>
                                    <div className="flex items-center space-x-3">
                                      {user.avatar_url ? (
                                        <img
                                          src={user.avatar_url}
                                          alt={user.full_name || ''}
                                          className="h-8 w-8 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                          <UserIcon className="h-4 w-4 text-white" />
                                        </div>
                                      )}
                                      <p className="font-medium text-gray-900 dark:text-white">{user.full_name || user.email}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-gray-700 dark:text-gray-300">{user.email}</TableCell>
                                  <TableCell>
                                    <Badge 
                                      className={cn(
                                        "border-none",
                                        user.role === 'super_admin' 
                                          ? "bg-red-500/20 text-red-400"
                                          : user.role === 'admin'
                                          ? "bg-orange-500/20 text-orange-400"
                                          : user.role === 'manager'
                                          ? "bg-blue-500/20 text-blue-400"
                                          : user.role === 'client'
                                          ? "bg-green-500/20 text-green-400"
                                          : "bg-gray-500/20 text-gray-400"
                                      )}
                                    >
                                      {user.role || 'User'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-gray-700 dark:text-gray-300">{user.company_name || '-'}</TableCell>
                                  <TableCell>
                                    <Badge 
                                      className={cn(
                                        "border-none",
                                        user.is_active !== false
                                          ? "bg-green-500/20 text-green-400" 
                                          : "bg-gray-500/20 text-gray-400"
                                      )}
                                    >
                                      {user.is_active !== false ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleSharePasswordLink(user)}
                                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                                              disabled={copiedUserId === user.id}
                                            >
                                              {copiedUserId === user.id ? (
                                                <Check className="h-4 w-4 text-green-400" />
                                              ) : (
                                                <Share2 className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Generate password setup link</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingUser(user);
                                          setUserFormOpen(true);
                                        }}
                                        className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="notifications" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <NotificationSettings />
                </motion.div>
              </TabsContent>

              <TabsContent value="system" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        System Configuration
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Configure system settings and preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <Settings className="h-12 w-12 text-gray-400 mx-auto mb-3 animate-pulse" />
                        <p className="text-gray-600 dark:text-gray-400">System configuration coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </MagicCard>
        </motion.div>
      </div>

      {/* Dialogs */}
      <NewCompanyDialog
        open={companyFormOpen}
        onOpenChange={setCompanyFormOpen}
        onCompanyAdded={() => {
          fetchCompanies();
          setCompanyFormOpen(false);
        }}
        company={companies.find(c => c.id === companyEditId)}
      />

      <NewCandidateDialog
        open={candidateFormOpen}
        onOpenChange={setCandidateFormOpen}
        onCandidateAdded={() => {
          fetchCandidates();
          setCandidateFormOpen(false);
        }}
        initialData={editingCandidate}
      />

      
      <NewUserDialog
        open={userFormOpen}
        onOpenChange={setUserFormOpen}
        onUserAdded={() => {
          fetchUsers();
          setUserFormOpen(false);
        }}
        user={editingUser}
      />
    </div>
  );
}