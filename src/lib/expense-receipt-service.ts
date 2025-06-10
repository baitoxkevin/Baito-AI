import { supabase } from './supabase';
import { getUser } from './auth';

import { logger } from './logger';
// The bucket name where expense receipts are stored
const RECEIPTS_BUCKET = 'expense-receipts';

export interface ReceiptUpload {
  id?: string;
  expense_claim_id: string;
  url: string;
  filename: string;
  file_size?: number;
  content_type?: string;
  description?: string;
  amount?: number;
  date?: string;
  vendor?: string;
  category?: string;
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Generates a unique file name for a receipt upload
 * @param claimId The ID of the expense claim
 * @param fileName The original file name
 * @param userId The ID of the user uploading
 */
export function generateReceiptFileName(claimId: string, fileName: string, userId: string): string {
  const timestamp = Date.now();
  const fileExt = fileName.split('.').pop() || '';
  const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  const sanitizedName = baseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  // Include user ID in path for RLS policies
  return `${userId}/${claimId}/${sanitizedName}_${timestamp}.${fileExt}`;
}

/**
 * Upload a receipt for an expense claim
 * @param claimId The ID of the expense claim
 * @param file The receipt file to upload
 * @param metadata Optional metadata for the receipt
 */
export async function uploadExpenseReceipt(
  claimId: string,
  file: File,
  metadata?: {
    description?: string;
    amount?: number;
    date?: string;
    vendor?: string;
    category?: string;
  }
): Promise<ReceiptUpload> {
  try {
    // Validate file size (10MB limit for receipts)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Receipt must be less than 10MB');
    }

    // Get the current user
    const currentUser = await getUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Generate a file path with user ID
    const filePath = generateReceiptFileName(claimId, file.name, currentUser.id);

    // Check if bucket exists and create it if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === RECEIPTS_BUCKET)) {
      const { error: bucketError } = await supabase.storage.createBucket(RECEIPTS_BUCKET, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });
      if (bucketError && bucketError.message !== 'The resource already exists') {
        throw bucketError;
      }
    }

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get the public URL for the now-public bucket
    const { data: urlData } = supabase.storage
      .from(RECEIPTS_BUCKET)
      .getPublicUrl(filePath);

    // Create a record in the receipts table
    const receiptData: Partial<ReceiptUpload> = {
      expense_claim_id: claimId,
      url: urlData.publicUrl,
      filename: file.name,
      file_size: file.size,
      content_type: file.type,
      ...(metadata || {})
    };

    const { data, error } = await supabase
      .from('receipts')
      .insert([receiptData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error uploading expense receipt:', error);
    throw error;
  }
}

/**
 * Upload multiple receipts for an expense claim
 * @param claimId The ID of the expense claim
 * @param files Array of receipt files to upload
 */
export async function uploadMultipleReceipts(
  claimId: string,
  files: File[]
): Promise<ReceiptUpload[]> {
  try {
    const uploadPromises = files.map(file => uploadExpenseReceipt(claimId, file));
    return await Promise.all(uploadPromises);
  } catch (error) {
    logger.error('Error uploading multiple receipts:', error);
    throw error;
  }
}

/**
 * Delete a receipt from storage and database
 * @param receiptId The ID of the receipt to delete
 * @param filePath The storage path of the receipt file
 */
export async function deleteExpenseReceipt(
  receiptId: string,
  filePath: string
): Promise<void> {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .remove([filePath]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from('receipts')
      .delete()
      .eq('id', receiptId);

    if (dbError) throw dbError;
  } catch (error) {
    logger.error('Error deleting expense receipt:', error);
    throw error;
  }
}

/**
 * Get all receipts for an expense claim
 * @param claimId The ID of the expense claim
 */
export async function getExpenseReceipts(claimId: string): Promise<ReceiptUpload[]> {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('expense_claim_id', claimId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching expense receipts:', error);
    throw error;
  }
}