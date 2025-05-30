import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import * as ExpenseClaimService from '@/lib/expense-claim-service';
import { ExpenseClaim, Receipt } from '@/lib/expense-claim-service';

interface UseExpenseClaimsOptions {
  filterByStatus?: ExpenseClaim['status'];
  projectId?: string;
  autoFetch?: boolean;
}

export function useExpenseClaims(options: UseExpenseClaimsOptions = {}) {
  const { filterByStatus, projectId, autoFetch = true } = options;
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentClaim, setCurrentClaim] = useState<ExpenseClaim | null>(null);
  const [currentClaimReceipts, setCurrentClaimReceipts] = useState<Receipt[]>([]);
  const { toast } = useToast();

  // Fetch expense claims
  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: ExpenseClaim[];
      
      if (projectId) {
        data = await ExpenseClaimService.fetchProjectExpenseClaims(projectId);
      } else if (filterByStatus) {
        data = await ExpenseClaimService.fetchExpenseClaimsByStatus(filterByStatus);
      } else {
        data = await ExpenseClaimService.fetchUserExpenseClaims();
      }
      
      setClaims(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch expense claims'));
      toast({
        title: 'Error',
        description: 'Failed to fetch expense claims',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, filterByStatus, toast]);

  // Create a new expense claim
  const createClaim = useCallback(async (data: Omit<ExpenseClaim, 'total_amount' | 'status' | 'receipt_number'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newClaim = await ExpenseClaimService.createExpenseClaim(data);
      setClaims(prev => [newClaim, ...prev]);
      setCurrentClaim(newClaim);
      toast({
        title: 'Success',
        description: 'Expense claim created successfully',
      });
      return newClaim;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create expense claim'));
      toast({
        title: 'Error',
        description: 'Failed to create expense claim',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Update an expense claim
  const updateClaim = useCallback(async (id: string, updates: Partial<Omit<ExpenseClaim, 'total_amount'>>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedClaim = await ExpenseClaimService.updateExpenseClaim(id, updates);
      setClaims(prev => prev.map(claim => claim.id === id ? updatedClaim : claim));
      if (currentClaim?.id === id) {
        setCurrentClaim(updatedClaim);
      }
      toast({
        title: 'Success',
        description: 'Expense claim updated successfully',
      });
      return updatedClaim;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update expense claim'));
      toast({
        title: 'Error',
        description: 'Failed to update expense claim',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentClaim, toast]);

  // Delete an expense claim
  const deleteClaim = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await ExpenseClaimService.deleteExpenseClaim(id);
      setClaims(prev => prev.filter(claim => claim.id !== id));
      if (currentClaim?.id === id) {
        setCurrentClaim(null);
        setCurrentClaimReceipts([]);
      }
      toast({
        title: 'Success',
        description: 'Expense claim deleted successfully',
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete expense claim'));
      toast({
        title: 'Error',
        description: 'Failed to delete expense claim',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentClaim, toast]);

  // Load a specific claim with receipts
  const loadClaim = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { claim, receipts } = await ExpenseClaimService.fetchExpenseClaimWithReceipts(id);
      
      // Handle case when claim is null (table doesn't exist)
      if (claim === null) {
        // console.warn('Using local data for expense claim');
        setCurrentClaim(null);
        setCurrentClaimReceipts([]);
        return { claim: null, receipts: [] };
      }
      
      setCurrentClaim(claim);
      setCurrentClaimReceipts(receipts);
      return { claim, receipts };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load expense claim'));
      // Only show toast if it's not a table not exist error
      if (err && typeof err === 'object' && 'code' in err && err.code !== '42P01') {
        toast({
          title: 'Error',
          description: 'Failed to load expense claim details',
          variant: 'destructive',
        });
      }
      // Don't re-throw if it's a table not exist error
      if (err && typeof err === 'object' && 'code' in err && err.code === '42P01') {
        setCurrentClaim(null);
        setCurrentClaimReceipts([]);
        return { claim: null, receipts: [] };
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Add a receipt to the current claim
  const addReceiptToClaim = useCallback(async (receiptId: string, amount: number, notes?: string) => {
    if (!currentClaim?.id) {
      toast({
        title: 'Error',
        description: 'No active expense claim',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await ExpenseClaimService.addReceiptToExpenseClaim(
        currentClaim.id,
        receiptId,
        amount,
        notes
      );
      
      // Reload the claim to get updated data
      await loadClaim(currentClaim.id);
      
      toast({
        title: 'Success',
        description: 'Receipt added to expense claim',
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add receipt'));
      toast({
        title: 'Error',
        description: 'Failed to add receipt to expense claim',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentClaim, loadClaim, toast]);

  // Remove a receipt from the current claim
  const removeReceiptFromClaim = useCallback(async (receiptId: string) => {
    if (!currentClaim?.id) {
      toast({
        title: 'Error',
        description: 'No active expense claim',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await ExpenseClaimService.removeReceiptFromExpenseClaim(
        currentClaim.id,
        receiptId
      );
      
      // Reload the claim to get updated data
      await loadClaim(currentClaim.id);
      
      toast({
        title: 'Success',
        description: 'Receipt removed from expense claim',
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove receipt'));
      toast({
        title: 'Error',
        description: 'Failed to remove receipt from expense claim',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentClaim, loadClaim, toast]);

  // Submit a claim for approval
  const submitClaim = useCallback(async (approverId: string) => {
    if (!currentClaim?.id) {
      toast({
        title: 'Error',
        description: 'No active expense claim',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await ExpenseClaimService.submitExpenseClaim(
        currentClaim.id,
        approverId
      );
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // Update the claims list
      await fetchClaims();
      
      // Reload the current claim
      if (result.data) {
        setCurrentClaim(result.data);
      } else {
        await loadClaim(currentClaim.id);
      }
      
      toast({
        title: 'Success',
        description: 'Expense claim submitted for approval',
      });
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit expense claim'));
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to submit expense claim',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentClaim, fetchClaims, loadClaim, toast]);

  // Approve a claim
  const approveClaim = useCallback(async (claimId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ExpenseClaimService.approveExpenseClaim(claimId);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // Update the claims list
      await fetchClaims();
      
      // Update current claim if it's the approved one
      if (currentClaim?.id === claimId && result.data) {
        setCurrentClaim(result.data);
      }
      
      toast({
        title: 'Success',
        description: 'Expense claim approved',
      });
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to approve expense claim'));
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve expense claim',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentClaim, fetchClaims, toast]);

  // Reject a claim
  const rejectClaim = useCallback(async (claimId: string, reason: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ExpenseClaimService.rejectExpenseClaim(claimId, reason);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // Update the claims list
      await fetchClaims();
      
      // Update current claim if it's the rejected one
      if (currentClaim?.id === claimId && result.data) {
        setCurrentClaim(result.data);
      }
      
      toast({
        title: 'Success',
        description: 'Expense claim rejected',
      });
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reject expense claim'));
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject expense claim',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentClaim, fetchClaims, toast]);

  // Clear the current claim
  const clearCurrentClaim = useCallback(() => {
    setCurrentClaim(null);
    setCurrentClaimReceipts([]);
  }, []);

  // Fetch claims on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch) {
      fetchClaims();
    }
  }, [autoFetch, fetchClaims]);

  return {
    claims,
    currentClaim,
    currentClaimReceipts,
    isLoading,
    error,
    fetchClaims,
    createClaim,
    updateClaim,
    deleteClaim,
    loadClaim,
    addReceiptToClaim,
    removeReceiptFromClaim,
    submitClaim,
    approveClaim,
    rejectClaim,
    clearCurrentClaim,
  };
}