import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  PlusIcon, Search, Loader2, Building, Edit2, 
  GitBranchPlus, ChevronRight, ChevronDown, Users, Phone, Mail,
  Trash2, ShieldAlert
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { Company, User } from '@/lib/types';
import { getUserProfile } from '@/lib/auth';
import NewCompanyDialog from '@/components/NewCompanyDialog';
import { Badge } from '@/components/ui/badge';

// Extended company interface with children for hierarchical display
interface HierarchicalCompany extends Company {
  children?: HierarchicalCompany[];
  level?: number;
  isExpanded?: boolean;
  hasChildren?: boolean;
  parent_id?: string | null;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<HierarchicalCompany[]>([]);
  const [flatCompanies, setFlatCompanies] = useState<HierarchicalCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined);
  const { toast } = useToast();
  
  // Current user state for permission checks
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  
  // Check if current user is a super admin
  const isSuperAdmin = currentUser?.is_super_admin === true;

  // Build hierarchical tree from flat list
  const buildCompanyTree = (
    companies: HierarchicalCompany[], 
    parentId: string | null = null, 
    level = 0
  ): HierarchicalCompany[] => {
    return companies
      .filter(company => company.parent_id === parentId)
      .map(company => {
        // Find children for this company
        const children = buildCompanyTree(companies, company.id, level + 1);
        return {
          ...company,
          children: children.length > 0 ? children : undefined,
          level,
          isExpanded: level < 1, // Auto-expand first level by default
          hasChildren: children.length > 0
        };
      });
  };

  // Flatten tree for display while respecting expansion state
  const flattenTree = (
    tree: HierarchicalCompany[], 
    result: HierarchicalCompany[] = []
  ): HierarchicalCompany[] => {
    tree.forEach(node => {
      result.push(node);
      if (node.children && node.isExpanded) {
        flattenTree(node.children, result);
      }
    });
    return result;
  };

  // Toggle expand/collapse of a company node
  const toggleExpand = (companyId: string) => {
    setCompanies(prevCompanies => {
      // Create a deep copy to avoid mutating state directly
      const newCompanies = JSON.parse(JSON.stringify(prevCompanies));
      
      // Helper function to find and toggle the node
      const toggleNode = (nodes: HierarchicalCompany[]): boolean => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === companyId) {
            nodes[i].isExpanded = !nodes[i].isExpanded;
            return true;
          }
          if (nodes[i].children) {
            if (toggleNode(nodes[i].children)) {
              return true;
            }
          }
        }
        return false;
      };
      
      toggleNode(newCompanies);
      
      // Update flat list for display
      setFlatCompanies(flattenTree(newCompanies));
      
      return newCompanies;
    });
  };

  const loadCompanies = async () => {
    try {
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
        contact_phone: company.company_phone_no,
        // Hierarchical relationship will be added when parent_id exists in schema
        parent_id: company.parent_id || null
      })) as HierarchicalCompany[] || [];
      
      // Build hierarchical tree
      const hierarchicalCompanies = buildCompanyTree(mappedCompanies);
      setCompanies(hierarchicalCompanies);
      
      // Flatten for initial display
      setFlatCompanies(flattenTree(hierarchicalCompanies));
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load companies. Please try again.',
        variant: 'destructive',
      });
      
      // Set empty arrays to avoid undefined errors
      setCompanies([]);
      setFlatCompanies([]);
    } finally {
      setIsLoading(false);
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

  useEffect(() => {
    loadCurrentUser();
    loadCompanies();
  }, []);

  // Filter companies and maintain hierarchy
  const getFilteredCompanies = () => {
    if (!searchQuery) return flatCompanies;
    
    return flatCompanies.filter(company => 
      company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.company_email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
  
  const filteredCompanies = getFilteredCompanies();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 p-2 sm:p-4 rounded-none md:rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => {
          setSelectedCompany(undefined);
          setIsDialogOpen(true);
        }}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>
      
      <NewCompanyDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        company={selectedCompany}
        onCompanyAdded={loadCompanies}
      />

      <div className="flex-1 mt-4 rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>Company Name</span>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>Email</span>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>Phone</span>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Contacts</span>
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.map((company) => (
              <TableRow key={company.id} className={company.level && company.level > 0 ? 'bg-muted/20' : ''}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {/* Indentation based on level */}
                    {company.level && company.level > 0 && (
                      <div style={{ width: `${company.level * 20}px` }} className="flex-shrink-0"></div>
                    )}
                    
                    {/* Expand/collapse button for companies with children */}
                    {company.hasChildren ? (
                      <button 
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                        onClick={() => toggleExpand(company.id)}
                      >
                        {company.isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    ) : (
                      <div className="w-6"></div> 
                    )}
                    
                    {/* Company logo */}
                    {company.logo_url ? (
                      <div className="h-8 w-8 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0">
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
                      <div className="h-8 w-8 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <Building className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Company name with badge for parent/child indicators */}
                    <div className="flex flex-col">
                      <span>{company.name || company.company_name}</span>
                      {company.parent_id && (
                        <Badge variant="outline" className="text-xs mt-1 border-primary/30 text-primary">
                          <GitBranchPlus className="h-3 w-3 mr-1" />
                          Sub-company
                        </Badge>
                      )}
                      {company.hasChildren && (
                        <Badge variant="outline" className="text-xs mt-1 border-blue-500/30 text-blue-600 dark:text-blue-400">
                          <GitBranchPlus className="h-3 w-3 mr-1" />
                          Parent
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{company.contact_email || company.company_email || '-'}</TableCell>
                <TableCell>{company.contact_phone || company.company_phone_no || '-'}</TableCell>
                <TableCell>
                  {company.pic_name ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Users className="h-3 w-3" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm">{company.pic_name}</span>
                        {company.pic_designation && (
                          <span className="text-xs text-muted-foreground">{company.pic_designation}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No contacts</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedCompany(company);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    {/* Only super admins can delete companies */}
                    {isSuperAdmin && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => handleDeleteCompany(company.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredCompanies.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No companies found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}