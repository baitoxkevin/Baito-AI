import { useState, useEffect, useCallback } from 'react';
import { fetchUserReceipts, fetchProjectReceipts, addReceipt, updateReceipt, deleteReceipt, calculateReceiptTotals, getReceiptStatistics } from '@/lib/receipt-service';
import type { Receipt } from '@/lib/receipt-service';
import { useToast } from './use-toast';

export function useReceipts(projectId?: string) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    monthly: Array<{month: string, total: number}>,
    categories: Array<{category: string, total: number}>,
    total: number
  } | null>(null);
  
  const { toast } = useToast();

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      if (projectId) {
        data = await fetchProjectReceipts(projectId);
      } else {
        data = await fetchUserReceipts();
      }
      
      setReceipts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load receipts');
      toast({
        title: 'Error',
        description: 'Failed to load receipts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await getReceiptStatistics();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load receipt statistics:', err);
      // Don't show toast for stats loading failures
    }
  }, []);

  useEffect(() => {
    loadReceipts();
    loadStats();
  }, [loadReceipts, loadStats]);

  const createReceipt = async (receipt: Receipt) => {
    try {
      const newReceipt = await addReceipt(receipt);
      setReceipts(prev => [newReceipt, ...prev]);
      loadStats();
      toast({
        title: 'Success',
        description: 'Receipt added successfully.',
      });
      return newReceipt;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to add receipt. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const editReceipt = async (id: string, updates: Partial<Receipt>) => {
    try {
      const updatedReceipt = await updateReceipt(id, updates);
      setReceipts(prev => prev.map(receipt => 
        receipt.id === id ? updatedReceipt : receipt
      ));
      loadStats();
      toast({
        title: 'Success',
        description: 'Receipt updated successfully.',
      });
      return updatedReceipt;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update receipt. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const removeReceipt = async (id: string) => {
    try {
      await deleteReceipt(id);
      setReceipts(prev => prev.filter(receipt => receipt.id !== id));
      loadStats();
      toast({
        title: 'Success',
        description: 'Receipt deleted successfully.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete receipt. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const getTotals = async (startDate?: string, endDate?: string) => {
    try {
      return await calculateReceiptTotals(startDate, endDate);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to calculate totals. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    receipts,
    loading,
    error,
    stats,
    createReceipt,
    editReceipt,
    removeReceipt,
    refreshReceipts: loadReceipts,
    refreshStats: loadStats,
    getTotals,
  };
}