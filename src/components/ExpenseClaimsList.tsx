import { useState } from 'react';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useExpenseClaims } from '@/hooks/use-expense-claims';
import { ExpenseClaim } from '@/lib/expense-claim-service';
import { format } from 'date-fns';
import { AlertCircle, Check, ChevronDown, CreditCard, FileText, MoreHorizontal, X } from 'lucide-react';
import { ExpenseClaimDetailsDialog } from './ExpenseClaimDetailsDialog';
import { HoverPreview } from '@/components/ui/hover-preview';
import { DocumentTextPreview } from '@/components/DocumentTextPreview';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExpenseClaimsListProps {
  title?: string;
  description?: string;
  filterByStatus?: ExpenseClaim['status'];
  projectId?: string;
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  isAdmin?: boolean;
  onApprove?: (claimId: string) => Promise<void>;
  onReject?: (claimId: string, reason: string) => Promise<void>;
}

export function ExpenseClaimsList({
  title = 'Expense Claims',
  description = 'Manage your expense claims',
  filterByStatus,
  projectId,
  maxItems = 10,
  showViewAll = true,
  onViewAll,
  isAdmin = false,
  onApprove,
  onReject,
}: ExpenseClaimsListProps) {
  const {
    claims,
    isLoading,
    fetchClaims,
    loadClaim,
    approveClaim,
    rejectClaim,
  } = useExpenseClaims({
    filterByStatus,
    projectId,
  });

  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [claimReceipts, setClaimReceipts] = useState<Record<string, any[]>>({});
  const [loadingReceipts, setLoadingReceipts] = useState<Record<string, boolean>>({});

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };
  
  // Safe date formatting
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return 'Invalid Date';
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: ExpenseClaim['status']) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            <FileText className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
  };

  // Handle view claim details
  const handleViewDetails = async (claimId: string) => {
    setSelectedClaimId(claimId);
    setIsDetailsOpen(true);
    await loadClaim(claimId);
  };

  // Handle load receipts on hover
  const handleLoadReceipts = async (claimId: string) => {
    // If receipts already loaded, skip
    if (claimReceipts[claimId] || loadingReceipts[claimId]) {
      return;
    }

    setLoadingReceipts(prev => ({ ...prev, [claimId]: true }));
    try {
      const { receipts } = await loadClaim(claimId);
      setClaimReceipts(prev => ({ ...prev, [claimId]: receipts || [] }));
    } catch (error) {
      console.error('Failed to load receipts:', error);
      setClaimReceipts(prev => ({ ...prev, [claimId]: [] }));
    } finally {
      setLoadingReceipts(prev => ({ ...prev, [claimId]: false }));
    }
  };

  // Handle approve claim
  const handleApproveClaim = async (claimId: string) => {
    try {
      // Use the passed onApprove function if provided, otherwise use default approveClaim
      if (onApprove) {
        await onApprove(claimId);
      } else {
        await approveClaim(claimId);
      }
      fetchClaims();
    } catch (error) {
      console.error('Failed to approve claim:', error);
      throw error; // Re-throw to let the dialog handle it
    }
  };

  // Handle reject claim
  const handleRejectClaim = async (claimId: string, reason: string) => {
    try {
      // Use the passed onReject function if provided, otherwise use default rejectClaim
      if (onReject) {
        await onReject(claimId, reason);
      } else {
        await rejectClaim(claimId, reason);
      }
      fetchClaims();
    } catch (error) {
      console.error('Failed to reject claim:', error);
      throw error; // Re-throw to let the dialog handle it
    }
  };

  // Render loading state
  if (isLoading && claims.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (claims.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No expense claims found</h3>
            <p className="text-sm text-gray-500 mt-1">
              {filterByStatus 
                ? `You don't have any ${filterByStatus} expense claims.`
                : 'You haven\'t created any expense claims yet.'}
            </p>
            <Button className="mt-4">Create New Claim</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter claims if maxItems is provided
  const displayedClaims = maxItems ? claims.slice(0, maxItems) : claims;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                {isAdmin && <TableHead>Submitted By</TableHead>}
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedClaims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">
                    <HoverPreview
                      previewType="expense"
                      data={{
                        ...claim,
                        receipts: claimReceipts[claim.id!] || [],
                        receipt_count: claimReceipts[claim.id!]?.length || 0
                      }}
                      align="start"
                      side="top"
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      onAction={(type, id) => {
                        if (type === 'viewDetails') handleViewDetails(id);
                      }}
                      onOpen={() => {
                        if (claim.id) {
                          handleLoadReceipts(claim.id);
                        }
                      }}
                    >
                      <span className="hover:underline">{claim.title}</span>
                    </HoverPreview>
                  </TableCell>
                  <TableCell>{getStatusBadge(claim.status)}</TableCell>
                  <TableCell>{formatCurrency(claim.total_amount)}</TableCell>
                  <TableCell>
                    {claim.submitted_at
                      ? formatDate(claim.submitted_at)
                      : claim.expense_date 
                        ? formatDate(claim.expense_date)
                        : claim.date
                          ? formatDate(claim.date)
                          : claim.created_at
                            ? formatDate(claim.created_at)
                            : 'Not submitted'}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>{claim.user_email || 'Unknown'}</TableCell>
                  )}
                  <TableCell>
                    {claim.project_title || 'No project'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(claim.id!)}>
                          View Details
                        </DropdownMenuItem>
                        
                        {isAdmin && claim.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => handleApproveClaim(claim.id!)}>
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRejectClaim(claim.id!)}>
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        {showViewAll && claims.length > maxItems && (
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={onViewAll}
            >
              View All <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        )}
      </Card>

      {selectedClaimId && (
        <ExpenseClaimDetailsDialog
          claimId={selectedClaimId}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          isAdmin={isAdmin}
          onApprove={handleApproveClaim}
          onReject={handleRejectClaim}
        />
      )}
    </>
  );
}