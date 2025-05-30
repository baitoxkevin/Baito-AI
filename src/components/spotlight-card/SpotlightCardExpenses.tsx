import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CandidateAvatar } from "@/components/ui/candidate-avatar";
import { cn } from "@/lib/utils";
import { formatDate } from '@/lib/utils';
import { HoverPreview } from "@/components/ui/hover-preview";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { Project } from '@/lib/types';
import { categoryColors } from './constants';
import {
  Receipt,
  Plus,
  Eye,
  CheckCircle,
  X,
  Loader2,
  Calendar,
  DollarSign,
  FileText,
  User,
  Clock,
  Package
} from "lucide-react";

// Helper function to get initials from a name
const getInitials = (name: string): string => {
  if (!name) return '??';
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
};

interface SpotlightCardExpensesProps {
  project: Project;
  expenseClaims: any[];
  onShowExpenseClaimForm: () => void;
  onShowClaimDetails: (claimId: string) => void;
  onRemoveClaim?: (claimId: string) => void;
  isRemovingClaim?: boolean;
  onRefresh?: () => Promise<any[]>;
}

// Helper function to render category icon with appropriate styling
const renderCategoryIcon = (category: string) => {
  const categoryConfig = categoryColors[category] || categoryColors.other;
  const CategoryIcon = categoryConfig.icon;
  
  return (
    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", categoryConfig.bg)}>
      <CategoryIcon className={cn("h-4 w-4", categoryConfig.text)} />
    </div>
  );
};

export function SpotlightCardExpenses({
  project,
  expenseClaims,
  onShowExpenseClaimForm,
  onShowClaimDetails,
  onRemoveClaim,
  isRemovingClaim = false,
  onRefresh
}: SpotlightCardExpensesProps) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-indigo-600" />
          <span>Expense Claims</span>
          <Badge className="bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs font-normal">
            {expenseClaims.length}
          </Badge>
        </h3>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                // console.log('=== MANUAL EXPENSE CLAIMS DEBUG ===');
                // console.log('Project ID:', project.id);
                
                // Import required modules
                const { supabase } = await import('@/lib/supabase');
                const { fetchProjectExpenseClaimsWithFallback } = await import('@/lib/expense-claim-service-fallback');
                
                // Test 1: Direct query
                // console.log('Test 1: Direct query to expense_claims table...');
                const { data: directData, error: directError } = await supabase
                  .from('expense_claims')
                  .select('*')
                  .eq('project_id', project.id);
                
                // console.log('Direct query result:', {
                //   data: directData,
                //   error: directError,
                //   count: directData?.length || 0
                // });
                
                // Test 2: Using the service function
                // console.log('\nTest 2: Using fetchProjectExpenseClaimsWithFallback...');
                const claims = await fetchProjectExpenseClaimsWithFallback(project.id);
                // console.log('Service function result:', {
                //   claims: claims,
                //   count: claims.length
                // });
                
                // Test 3: Check all expense claims (no project filter)
                // console.log('\nTest 3: Query all expense claims (no project filter)...');
                const { data: allClaims, error: allError } = await supabase
                  .from('expense_claims')
                  .select('*')
                  .limit(10);
                
                // console.log('All claims result:', {
                //   data: allClaims,
                //   error: allError,
                //   count: allClaims?.length || 0
                // });
                
                // Test 4: If onRefresh is provided, call it
                if (onRefresh) {
                  // console.log('\nTest 4: Calling onRefresh callback...');
                  const refreshedClaims = await onRefresh();
                  // console.log('onRefresh result:', {
                  //   claims: refreshedClaims,
                  //   count: refreshedClaims.length
                  // });
                }
                
                // console.log('=== END DEBUG ===');
              } catch (error) {
                console.error('Manual refresh error:', error);
              }
            }}
            title="Debug: Test expense claims query"
          >
            <Loader2 className="h-4 w-4" />
          </Button>
          <Button
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-semibold rounded-md px-4 py-2 hover:opacity-90 transition"
            onClick={onShowExpenseClaimForm}
          >
            <Plus className="h-4 w-4" />
            <span>Add Claim</span>
          </Button>
        </div>
      </div>
      
      {/* Claims Table */}
      {expenseClaims.length === 0 ? (
        <div className="text-center p-10 border rounded-lg bg-gray-50 dark:bg-gray-800/50 flex-grow flex flex-col items-center justify-center">
          <Receipt className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No expense claims</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1 mb-4">
            Add your first expense claim to get started.
          </p>
          <Button 
            variant="outline"
            onClick={onShowExpenseClaimForm}
            className="mx-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense Claim
          </Button>
        </div>
      ) : (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex-grow">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="text-center font-semibold">Date</TableHead>
                    <TableHead className="text-center font-semibold">Category</TableHead>
                    <TableHead className="text-center font-semibold">Submitter</TableHead>
                    <TableHead className="text-center font-semibold">Amount</TableHead>
                    <TableHead className="text-center font-semibold">Status</TableHead>
                    <TableHead className="text-center font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseClaims.map((claim) => {
                    const category = categoryColors[claim.category] || categoryColors.other;
                    const CategoryIcon = category.icon;
                    
                    return (
                      <TableRow key={claim.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell className="font-medium">
                          <HoverPreview
                            previewType="expense"
                            data={{
                              ...claim,
                              receipt_count: claim.receipts?.length || 0 // Include receipt count for display
                            }}
                            align="start"
                            side="right"
                            formatCurrency={(amount) => `RM ${amount.toFixed(2)}`}
                            formatDate={(date) => formatDate(date)}
                            onAction={(type, id) => {
                              if (type === 'viewDetails') onShowClaimDetails(id);
                            }}
                          >
                            <div className="flex items-center gap-2 group">
                              <span className="group-hover:text-indigo-600 transition-colors">{claim.title}</span>
                              <span className="text-gray-500">#{claim.reference_number}</span>
                            </div>
                          </HoverPreview>
                        </TableCell>
                        <TableCell className="text-center">{formatDate(claim.date || claim.created_at)}</TableCell>
                        <TableCell className="text-center">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mx-auto", category.bg)}>
                            <CategoryIcon className={cn("h-5 w-5", category.text)} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <CandidateAvatar 
                              candidateId={claim.submitted_by || claim.user_id} 
                              fallback={getInitials(claim.submitted_by_name || 'Unknown')}
                              size="sm" 
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          RM {claim.amount?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="secondary"
                            className={cn(
                              claim.status === 'pending' && "bg-yellow-100 text-yellow-800",
                              claim.status === 'approved' && "bg-green-100 text-green-800",
                              claim.status === 'rejected' && "bg-red-100 text-red-800"
                            )}
                          >
                            {claim.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => onShowClaimDetails(claim.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {claim.status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:bg-green-50 hover:text-green-700"
                                title="Approve claim"
                                disabled
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-700"
                              onClick={() => onRemoveClaim?.(claim.id)}
                              disabled={isRemovingClaim || claim.status === 'approved'}
                              title={claim.status === 'approved' ? "Cannot delete approved claims" : "Delete claim"}
                            >
                              {isRemovingClaim ? (
                                <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
                              ) : (
                                <X className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
    </div>
  );
}