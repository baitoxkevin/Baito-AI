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
import { Badge } from '@/components/ui/badge';
import { PlusIcon, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import type { Invite } from '@/lib/types';

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  accepted: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  expired: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
} as const;

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const loadInvites = async () => {
    try {
      // First check if the invites table exists and what columns it has
      const { data: tableInfo, error: tableError } = await supabase
        .from('invites')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('Error checking invites table:', tableError);
        // Fall back to a simpler query
        const { data, error } = await supabase
          .from('invites')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setInvites(data || []);
        return;
      }
      
      // Check if we can get company information through the company_id foreign key
      // Use a simpler query approach that doesn't rely on foreign key relationships
      try {
        // Get the basic invites data first
        const { data: invitesData, error: invitesError } = await supabase
          .from('invites')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (invitesError) throw invitesError;
        
        // Create a formatted version of the data with empty placeholders for related data
        const formattedInvites = invitesData.map(invite => ({
          ...invite,
          company: { name: 'Loading...' },
          created_by_user: { full_name: 'Loading...' }
        }));
        
        // Set invites immediately so UI can show something
        setInvites(formattedInvites);
        
        // Then try to fetch related data for each invite if possible
        try {
          // For companies
          if (invitesData.length > 0) {
            const companyIds = invitesData
              .filter(invite => invite.company_id)
              .map(invite => invite.company_id);
              
            if (companyIds.length > 0) {
              const { data: companiesData } = await supabase
                .from('companies')
                .select('id, name')
                .in('id', [...new Set(companyIds)]);
                
              if (companiesData?.length) {
                const companyMap = Object.fromEntries(
                  companiesData.map(company => [company.id, company])
                );
                
                // Update invites with company data
                setInvites(prev => prev.map(invite => ({
                  ...invite,
                  company: { 
                    name: invite.company_id && companyMap[invite.company_id] 
                      ? companyMap[invite.company_id].name 
                      : 'Unknown Company' 
                  }
                })));
              }
            }
          }
        } catch (relatedDataError) {
          console.warn('Could not load related company data:', relatedDataError);
        }
      } catch (mainError) {
        console.warn('Error fetching invite data, using fallback:', mainError);
        
        // Fall back to a basic query
        const { data, error } = await supabase
          .from('invites')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setInvites(data || []);
      }
    } catch (error) {
      console.error('Error loading invites:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invites. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const filteredInvites = invites.filter(invite =>
    invite.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background rounded-lg border border-border h-full overflow-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Send Invite
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvites.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell className="font-medium">{invite.email}</TableCell>
                <TableCell className="capitalize">{invite.role}</TableCell>
                <TableCell>{invite.company?.name || invite.company_id || '-'}</TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={statusColors[invite.status as keyof typeof statusColors] || statusColors.pending}
                  >
                    {invite.status || 'pending'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {invite.expires_at ? format(new Date(invite.expires_at), 'MMM d, yyyy') : '-'}
                </TableCell>
                <TableCell>{invite.created_by_user?.full_name || invite.created_by || '-'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Resend
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredInvites.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No invites found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}