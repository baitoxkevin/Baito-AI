import { useEffect, useState } from 'react';
import { logger } from '../lib/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  // CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useExpenseClaims } from '@/hooks/use-expense-claims';
import { format } from 'date-fns';
import {
  AlertCircle, 
  Calendar, 
  Check, 
  CheckCircle2, 
  // CreditCard, 
  FileText, 
  Receipt, 
  User,
  X,
  XCircle,
  DollarSign,
  Clock,
  Building2,
  // MapPin
} from 'lucide-react';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { approveExpenseClaim, canApproveExpenseClaim } from '@/lib/claim-approval-service';
import { getUser } from '@/lib/auth';

interface ExpenseClaimDetailsDialogProps {
  claimId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
  onApprove?: (claimId: string) => Promise<void>;
  onReject?: (claimId: string, reason: string) => Promise<void>;
  localClaim?: unknown;
  projectTitle?: string;
}

export function ExpenseClaimDetailsDialog({
  claimId,
  open,
  onOpenChange,
  isAdmin = false,
  onApprove,
  onReject,
  localClaim: propLocalClaim,
  projectTitle,
}: ExpenseClaimDetailsDialogProps) {
  const {
    currentClaim,
    currentClaimReceipts,
    isLoading,
    loadClaim,
  } = useExpenseClaims({ autoFetch: false });
  
  const { toast } = useToast();

  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [localClaim, setLocalClaim] = useState<unknown>(null);
  const [canApprove, setCanApprove] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);

  useEffect(() => {
    if (open && claimId) {
      // Always try to load from database first
      loadClaim(claimId).catch(_err => {
        // logger.warn('Failed to load claim from database:', err);
        // If database fails, try using local claim if available
        if (propLocalClaim) {
          setLocalClaim(propLocalClaim);
        }
      });
    }
  }, [open, claimId, loadClaim, propLocalClaim]);

  // Prioritize database claim over local claim
  const claim = currentClaim || localClaim;
  // Prioritize database receipts over local receipts
  const receipts = currentClaimReceipts || (localClaim?.receipts || []);

  // Check if current user can approve this claim
  useEffect(() => {
    async function checkApprovalPermission() {
      if (!claim || claim.status !== 'pending') {
        setCanApprove(false);
        return;
      }
      
      setCheckingApproval(true);
      try {
        const currentUser = await getUser();
        if (!currentUser) {
          setCanApprove(false);
          return;
        }
        
        const allowed = await canApproveExpenseClaim(currentUser.id, claim.created_by);
        setCanApprove(allowed);
      } catch (error) {
        logger.error('Error checking approval permission:', error);
        setCanApprove(false);
      } finally {
        setCheckingApproval(false);
      }
    }
    
    checkApprovalPermission();
  }, [claim]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (_error) {
      // logger.warn('Invalid date format:', dateString);
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    
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

  const handleApprove = async () => {
    if (!claim?.id) return;
    
    try {
      await approveExpenseClaim(claim.id);
      toast({
        title: "Success",
        description: "Expense claim approved successfully",
      });
      
      // Call the parent's onApprove handler if provided
      if (onApprove) {
        await onApprove(claim.id);
      }
      
      onOpenChange(false);
      
      // Trigger a refresh of the expense claims and project data
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      logger.error('Error approving claim:', error);
      toast({
        title: "Error",
        description: "Failed to approve expense claim",
        variant: "destructive",
      });
    }
  };

  const handleShowRejectionForm = () => {
    setShowRejectionForm(true);
  };

  const handleReject = async () => {
    if (onReject && claim?.id && rejectionReason.trim()) {
      await onReject(claim.id, rejectionReason);
      setRejectionReason('');
      setShowRejectionForm(false);
      onOpenChange(false);
    }
  };

  const handleCancelReject = () => {
    setRejectionReason('');
    setShowRejectionForm(false);
  };
  
  if (!claim && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader className="border-b pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {claim?.title || 'Expense Claim Details'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {claim?.description || 'View expense claim details and receipts'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(claim?.status)}
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
              <p className="text-muted-foreground">Loading claim details...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Claim Header Info */}
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <DollarSign className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(claim?.amount || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted Date</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {formatDate(claim?.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <Receipt className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Receipts</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {receipts.length} attached
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800/50">
                <TabsTrigger value="details" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                  <FileText className="h-4 w-4 mr-2" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="receipts" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                  <Receipt className="h-4 w-4 mr-2" />
                  Receipts ({receipts.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                  <Clock className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>
            
            <TabsContent value="details" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="overflow-hidden border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      Claim Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Amount</span>
                        </div>
                        <span className="font-semibold text-lg">
                          {formatCurrency(claim?.total_amount || claim?.amount || 0)}
                        </span>
                      </div>
                      {claim?.receipt_number && (
                        <>
                          <Separator className="my-2" />
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Receipt #</span>
                            </div>
                            <span className="font-medium">{claim.receipt_number}</span>
                          </div>
                        </>
                      )}
                      <Separator className="my-2" />
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Submitted</span>
                        </div>
                        <span className="font-medium">
                          {formatDate(claim?.submitted_at || claim?.created_at || claim?.expense_date || claim?.date)}
                        </span>
                      </div>
                      {claim?.status === 'approved' && (
                        <>
                          <Separator className="my-2" />
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-muted-foreground">Approved</span>
                            </div>
                            <span className="font-medium text-green-600">
                              {formatDate(claim?.approved_at)}
                            </span>
                          </div>
                        </>
                      )}
                      {claim?.status === 'rejected' && (
                        <>
                          <Separator className="my-2" />
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-muted-foreground">Rejected</span>
                            </div>
                            <span className="font-medium text-red-600">
                              {formatDate(claim?.rejected_at)}
                            </span>
                          </div>
                          {claim?.rejection_reason && (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                Rejection Reason:
                              </p>
                              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                {claim.rejection_reason}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-purple-600" />
                      Project & Staff Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Project</span>
                      </div>
                      <span className="font-medium text-right max-w-[200px] text-ellipsis overflow-hidden">
                        {claim?.project_title || projectTitle || claim?.project_id || 'No project'}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Submitted By
                      </p>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                            {claim?.user_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {claim?.user_name || claim?.submitted_by || 'Unknown User'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {claim?.user_email || (claim?.created_by ? `ID: ${claim?.created_by.slice(0, 8)}...` : '')}
                          </p>
                        </div>
                      </div>
                    </div>
                    {claim?.description && (
                      <>
                        <Separator className="my-2" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Description
                          </p>
                          <p className="text-sm p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            {claim.description}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="receipts" className="mt-6">
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-indigo-600" />
                    Receipts
                  </CardTitle>
                  <CardDescription>
                    {receipts.length > 0 
                      ? `This claim includes ${receipts.length} receipt(s)`
                      : 'No receipts have been added to this claim'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {receipts.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <div className="p-6 space-y-4">
                        {receipts.map((receipt, index) => (
                          <div 
                            key={receipt.id || `receipt-${index}`} 
                            className="group border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-600"
                          >
                            <div className="flex gap-4">
                              <div className="flex-shrink-0">
                                <div className="h-12 w-12 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center shadow-inner">
                                  <Receipt className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                              </div>
                              <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                                      {receipt.vendor || receipt.filename || 'Receipt'}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {receipt.date 
                                        ? formatDate(receipt.date)
                                        : 'No date'
                                      }
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    {receipt.amount && (
                                      <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                                        {formatCurrency(receipt.amount)}
                                      </p>
                                    )}
                                    <Badge variant="secondary" className="mt-1">
                                      {receipt.category || receipt.url ? 'Document' : 'Uncategorized'}
                                    </Badge>
                                  </div>
                                </div>
                                {receipt.description && (
                                  <p className="text-sm mt-2 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                                    {receipt.description}
                                  </p>
                                )}
                                {receipt.url && (
                                  <div className="mt-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="group-hover:border-indigo-400 group-hover:text-indigo-600 dark:group-hover:border-indigo-400 dark:group-hover:text-indigo-400 transition-colors"
                                      onClick={() => {
                                        if (receipt.url.startsWith('http')) {
                                          window.open(receipt.url, '_blank');
                                        } else {
                                          toast({
                                            title: "Demo Receipt",
                                            description: "This is a demo receipt - actual file would open here",
                                          });
                                        }
                                      }}
                                    >
                                      <FileText className="w-3 h-3 mr-2" />
                                      View Receipt
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                        <Receipt className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No receipts found</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        This expense claim doesn't have any receipts attached
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    Claim History
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="relative">
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="relative">
                          <div className="w-4 h-4 bg-white dark:bg-slate-900 border-2 border-indigo-600 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-slate-100">Claim Created</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(claim?.created_at)} • {claim?.user_name || 'Unknown User'}
                          </p>
                        </div>
                      </div>
                      {claim?.status === 'approved' && (
                        <div className="flex gap-4">
                          <div className="relative">
                            <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-green-600">Approved</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(claim?.approved_at)} • By Manager
                            </p>
                          </div>
                        </div>
                      )}
                      {claim?.status === 'rejected' && (
                        <div className="flex gap-4">
                          <div className="relative">
                            <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-red-600">Rejected</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(claim?.rejected_at)} • By Manager
                            </p>
                            {claim?.rejection_reason && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Reason: {claim.rejection_reason}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            </Tabs>
          </div>
        )}
        
        <DialogFooter className="border-t pt-6 mt-6">
          {showRejectionForm ? (
            <div className="w-full space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-medium text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Rejection Reason
                </h4>
                <Textarea
                  placeholder="Please provide a reason for rejecting this claim..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px] border-red-200 dark:border-red-800 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={handleCancelReject}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleReject} 
                  disabled={!rejectionReason.trim()}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 border-0 shadow-md"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirm Rejection
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 w-full justify-between">
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </Button>
              {claim?.status === 'pending' && (
                <div className="flex gap-3">
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      onClick={handleShowRejectionForm}
                      className="hover:border-red-300 hover:text-red-600 dark:hover:border-red-700 dark:hover:text-red-400"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  )}
                  {(canApprove || isAdmin) && (
                    <Button 
                      variant="default" 
                      onClick={handleApprove}
                      disabled={checkingApproval}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0 shadow-md"
                    >
                      {checkingApproval ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve Claim
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}