import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { useExpenseClaims } from "@/hooks/use-expense-claims";
import { ExpenseClaim } from "@/lib/expense-claim-service";
import { format } from "date-fns";
import {
  AlertCircle,
  Check,
  CreditCard,
  Download,
  FilePlus,
  FileText,
  MoreHorizontal,
  Plus,
  User,
  X
} from "lucide-react";
import { ExpenseClaimFormWithDragDrop } from "../ExpenseClaimFormWithDragDrop";
import { ExpenseClaimDetailsDialog } from "@/components/ExpenseClaimDetailsDialog";
// import { getDummyClaimsForProject, getClaimsSummary } from "@/lib/dummy-expense-claims";

// Inline dummy functions
const getDummyClaimsForProject = (projectId: string): ExpenseClaim[] => {
  return [];
};

const getClaimsSummary = (claims: ExpenseClaim[]) => {
  const totalAmount = claims.reduce((acc, claim) => acc + claim.amount, 0);
  const approvedClaims = claims.filter(claim => claim.status === 'approved');
  const pendingClaims = claims.filter(claim => claim.status === 'pending');
  
  return {
    totalAmount,
    approvedAmount: approvedClaims.reduce((acc, claim) => acc + claim.amount, 0),
    pendingAmount: pendingClaims.reduce((acc, claim) => acc + claim.amount, 0),
    count: claims.length,
    approvedCount: approvedClaims.length,
    pendingCount: pendingClaims.length
  };
};

interface ProjectExpenseClaimsProps {
  projectId: string;
  isAdmin?: boolean;
}

export function ProjectExpenseClaims({
  projectId,
  isAdmin = false
}: ProjectExpenseClaimsProps) {
  // Use dummy data when no API data is available
  const [dummyClaims, setDummyClaims] = useState<ExpenseClaim[]>(getDummyClaimsForProject(projectId));
  
  const {
    claims: apiClaims,
    isLoading,
    fetchClaims,
    createClaim,
    approveClaim,
    rejectClaim,
    loadClaim,
  } = useExpenseClaims({
    projectId,
    autoFetch: false // Don't auto-fetch for demo
  });

  // Use dummy data if no API claims available
  const claims = apiClaims.length > 0 ? apiClaims : dummyClaims;
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };
  
  // Safe date formatting
  const formatSafeDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      // console.warn('Invalid date format:', dateString);
      return 'Invalid Date';
    }
  };

  // Get status badge
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate totals
  const summary = getClaimsSummary(claims);
  const totals = {
    all: summary.totalAmount,
    approved: summary.approvedAmount,
    pending: summary.pendingAmount,
  };

  // Handle view claim details
  const handleViewDetails = async (claimId: string) => {
    setSelectedClaimId(claimId);
    setIsDetailsOpen(true);
    await loadClaim(claimId);
  };

  // Handle create new claim
  const handleCreateClaim = async (formData: unknown) => {
    try {
      // Create a new dummy claim for demo
      const newClaim: ExpenseClaim = {
        id: `claim-${Date.now()}`,
        title: formData.title,
        description: formData.description || '',
        amount: parseFloat(formData.amount),
        user_id: 'current-user',
        user_email: 'current.user@company.com',
        project_id: projectId,
        status: 'pending',
        expense_date: formData.expense_date,
        category: formData.category,
        created_at: new Date(),
        updated_at: new Date(),
        receipts: formData.documents?.map((doc: string, index: number) => ({
          id: `rec-${Date.now()}-${index}`,
          url: doc,
          filename: `document-${index + 1}`
        })) || [],
      };
      
      // Add to dummy claims
      setDummyClaims([newClaim, ...dummyClaims]);
      
      setIsCreateDialogOpen(false);
      
      return true;
    } catch (error) {
      console.error('Failed to create expense claim:', error);
      return false;
    }
  };

  // Handle approve claim
  const handleApproveClaim = async (claimId: string) => {
    try {
      await approveClaim(claimId);
      fetchClaims();
    } catch (error) {
      console.error('Failed to approve claim:', error);
    }
  };

  // Handle reject claim
  const handleRejectClaim = async (claimId: string, reason: string) => {
    try {
      await rejectClaim(claimId, reason);
      fetchClaims();
    } catch (error) {
      console.error('Failed to reject claim:', error);
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Expense Claims</CardTitle>
              <CardDescription>
                Project-related expense claims and reimbursements
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
              )}
              <Button 
                size="sm" 
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                <span>New Claim</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse space-y-2">
                <div className="h-4 w-48 bg-gray-200 rounded"></div>
                <div className="h-4 w-64 bg-gray-200 rounded"></div>
                <div className="h-4 w-56 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : claims.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border rounded-md bg-gray-50">
              <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No expense claims found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                No expense claims have been created for this project yet. Create a new claim to get started.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <FilePlus className="h-4 w-4 mr-2" />
                Create New Expense Claim
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 flex flex-col">
                  <span className="text-xs text-blue-600 font-medium">Total Claims</span>
                  <span className="text-xl font-bold mt-0.5">{formatCurrency(totals.all)}</span>
                  <span className="text-xs text-blue-600 mt-0.5">{claims.length} claim(s)</span>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3 flex flex-col">
                  <span className="text-xs text-green-600 font-medium">Approved</span>
                  <span className="text-xl font-bold mt-0.5">{formatCurrency(totals.approved)}</span>
                  <span className="text-xs text-green-600 mt-0.5">
                    {summary.approved} claim(s)
                  </span>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-3 flex flex-col">
                  <span className="text-xs text-yellow-600 font-medium">Pending</span>
                  <span className="text-xl font-bold mt-0.5">{formatCurrency(totals.pending)}</span>
                  <span className="text-xs text-yellow-600 mt-0.5">
                    {summary.pending} claim(s)
                  </span>
                </div>
              </div>
              
              <ScrollArea className="h-[300px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((claim) => (
                      <TableRow key={claim.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleViewDetails(claim.id!)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <User className="h-4 w-4" />
                            </Avatar>
                            <span className="text-sm truncate max-w-[120px]">
                              {claim.user_email || 'Unknown User'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{claim.title}</TableCell>
                        <TableCell>{getStatusBadge(claim.status)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(claim.amount)}</TableCell>
                        <TableCell>
                          {claim.expense_date
                            ? formatSafeDate(claim.expense_date)
                            : claim.date
                              ? formatSafeDate(claim.date)
                              : claim.submitted_at
                                ? formatSafeDate(claim.submitted_at)
                                : claim.created_at
                                  ? formatSafeDate(claim.created_at)
                                  : 'Not submitted'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(claim.id!);
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}
        </CardContent>
        {claims.length > 0 && (
          <CardFooter className="flex justify-between pt-2 text-sm text-gray-500">
            <div>
              {claims.length} claim(s) • {formatCurrency(totals.all)}
            </div>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setIsCreateDialogOpen(true)}>
              Add New Claim
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Create Dialog - Now using form with drag and drop */}
      <ExpenseClaimFormWithDragDrop
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateClaim}
        projectId={projectId}
      />

      {/* Details Dialog */}
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