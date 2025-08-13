import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
// import { logger } from '../lib/logger';
import { 
  Loader2, Search, Edit2, Trash2, Shield, Mail, 
  User as UserIcon, CheckCircle, XCircle,
  Users, Building, PlusIcon,
  Briefcase, Phone
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NewCompanyDialog from '@/components/NewCompanyDialog';
import type { User, Company } from '@/lib/types';

interface UserWithCompany extends User {
  company?: {
    id: string;
    company_name: string;
  };
}

export default function UserConfigurationPage() {
  const { toast } = useToast();
  
  // States
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<UserWithCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  
  // Company states
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyEditId, setCompanyEditId] = useState<string | null>(null);
  const [companyFormOpen, setCompanyFormOpen] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  
  // Edit user dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithCompany | null>(null);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    role: 'staff',
    company_id: '',
    is_super_admin: false
  });
  const [saving, setSaving] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    superAdmins: 0,
    staff: 0,
    active: 0,
    inactive: 0
  });

  // Load users data
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch users with their company information
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          company:company_id(
            id,
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Calculate stats
      const userList = data || [];
      const newStats = {
        total: userList.length,
        admins: userList.filter(u => u.role === 'admin').length,
        superAdmins: userList.filter(u => u.is_super_admin).length,
        staff: userList.filter(u => u.role === 'staff').length,
        active: userList.filter(u => u.last_sign_in_at && 
          new Date(u.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length,
        inactive: 0
      };
      newStats.inactive = newStats.total - newStats.active;
      
      setUsers(userList);
      setStats(newStats);
    } catch (error) {
      // console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load companies data
  const loadCompaniesData = useCallback(async () => {
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
      // console.error('Error loading companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load companies. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCompanyLoading(false);
    }
  }, [toast]);

  // Handle company deletion
  const handleDeleteCompany = async (id: string) => {
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
      
      loadCompaniesData();
    } catch (error) {
      // console.error('Error deleting company:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete company. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Load data on mount and tab change
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'companies') {
      loadCompaniesData();
    }
  }, [activeTab, loadUsers, loadCompaniesData]);

  // Load companies for user form dropdown
  useEffect(() => {
    loadCompaniesData();
  }, [loadCompaniesData]);

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === "" ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'all' ||
      (selectedRole === 'admin' && user.role === 'admin') ||
      (selectedRole === 'staff' && user.role === 'staff') ||
      (selectedRole === 'super_admin' && user.is_super_admin);
    
    return matchesSearch && matchesRole;
  });

  // Handle edit user
  const handleEditUser = (user: UserWithCompany) => {
    setEditingUser(user);
    setEditFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role || 'staff',
      company_id: user.company_id || '',
      is_super_admin: user.is_super_admin || false
    });
    setEditDialogOpen(true);
  };

  // Handle save user
  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editFormData.full_name,
          email: editFormData.email,
          role: editFormData.role,
          company_id: editFormData.company_id || null,
          is_super_admin: editFormData.is_super_admin
        })
        .eq('id', editingUser.id);

      if (error) throw error;
      
      toast({
        title: 'User updated',
        description: 'User information has been updated successfully.',
      });
      
      setEditDialogOpen(false);
      loadUsers();
    } catch (error) {
      // console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', deleteUserId);

      if (error) throw error;
      
      toast({
        title: 'User deleted',
        description: 'The user has been deleted successfully.',
      });
      
      setDeleteUserId(null);
      loadUsers();
    } catch (error) {
      // console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Get role badge variant
  const getRoleBadge = (user: UserWithCompany) => {
    if (user.is_super_admin) {
      return <Badge variant="destructive" className="bg-purple-500">Super Admin</Badge>;
    }
    if (user.role === 'admin') {
      return <Badge variant="secondary">Admin</Badge>;
    }
    return <Badge variant="outline">Staff</Badge>;
  };

  // Get activity badge
  const getActivityBadge = (user: UserWithCompany) => {
    if (!user.last_sign_in_at) {
      return <Badge variant="outline" className="text-gray-500">Never</Badge>;
    }
    
    const lastSignIn = new Date(user.last_sign_in_at);
    const daysSince = Math.floor((Date.now() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince === 0) {
      return <Badge variant="success" className="bg-green-500">Today</Badge>;
    } else if (daysSince <= 7) {
      return <Badge variant="success" className="bg-green-500">Active</Badge>;
    } else if (daysSince <= 30) {
      return <Badge variant="secondary">Recent</Badge>;
    } else {
      return <Badge variant="outline" className="text-orange-500">Inactive</Badge>;
    }
  };

  // Filter companies based on search query
  const filteredCompanies = companies.filter(company =>
    companySearchQuery === "" ||
    company.company_name?.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
    company.pic_name?.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
    company.company_email?.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
    company.company_phone_no?.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Configuration</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage users, companies, roles, and permissions
          </p>
        </div>
      </div>

      {/* Tabs for Users and Companies */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{stats.total}</span>
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Administrators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold">{stats.admins}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({stats.superAdmins} super)
                    </span>
                  </div>
                  <Shield className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{stats.active}</span>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{stats.inactive}</span>
                  <XCircle className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="staff">Staff Only</SelectItem>
                <SelectItem value="admin">Admin Only</SelectItem>
                <SelectItem value="super_admin">Super Admin Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-1/4">User</TableHead>
                    <TableHead className="w-1/5">Company</TableHead>
                    <TableHead className="w-1/6">Role</TableHead>
                    <TableHead className="w-1/6">Last Activity</TableHead>
                    <TableHead className="w-1/6">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{user.full_name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.company ? (
                            <div className="flex items-center gap-1.5">
                              <Building className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{user.company.company_name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{getRoleBadge(user)}</TableCell>
                        <TableCell>{getActivityBadge(user)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit2 className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            {/* Prevent deleting super admins */}
                            {!user.is_super_admin && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => setDeleteUserId(user.id)}
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
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchQuery || selectedRole !== 'all' 
                          ? 'No users found matching your criteria.' 
                          : 'No users found.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">Companies Management</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Manage client companies and their contact information
              </p>
            </div>
            <Button onClick={() => {
              setCompanyEditId(null);
              setCompanyFormOpen(true);
            }} size="sm">
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Company
            </Button>
          </div>
          
          <div className="flex items-center w-full max-w-sm mb-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies, contacts..."
                value={companySearchQuery}
                onChange={(e) => setCompanySearchQuery(e.target.value)}
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {companySearchQuery ? 'No companies found matching your search criteria.' : 'No companies found. Add a new company to get started.'}
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
              onCompanyAdded={loadCompaniesData}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Select 
                value={editFormData.company_id} 
                onValueChange={(value) => setEditFormData({...editFormData, company_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Company</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={editFormData.role} 
                onValueChange={(value) => setEditFormData({...editFormData, role: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="super_admin">Super Admin</Label>
                <p className="text-sm text-muted-foreground">
                  Grant full system access
                </p>
              </div>
              <Switch
                id="super_admin"
                checked={editFormData.is_super_admin}
                onCheckedChange={(checked) => setEditFormData({...editFormData, is_super_admin: checked})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              and remove their access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}