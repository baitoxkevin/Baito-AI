import { logger } from './logger';

// Stub file for receipt-processor.ts
export const processReceipt = async () => {
  logger.warn("receipt-processor.ts was removed - processReceipt is a stub");
  return { success: false, error: "Receipt processor has been removed" };
};

export const extractReceiptData = async () => {
  logger.warn("receipt-processor.ts was removed - extractReceiptData is a stub");
  return { 
    amount: 0,
    date: new Date().toISOString(),
    vendor: "",
    items: []
  };
};