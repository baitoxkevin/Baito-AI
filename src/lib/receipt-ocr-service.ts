import { logger } from './logger';

// Stub file for receipt-ocr-service.ts
export interface ReceiptData {
  id?: string;
  amount: number;
  date: string;
  vendor: string;
  text?: string;
  category?: string;
  description?: string;
  image_url?: string;
  user_id?: string;
}

export const analyzeReceiptImage = async () => {
  logger.warn("receipt-ocr-service.ts was removed - analyzeReceiptImage is a stub");
  return { 
    success: true, 
    data: { 
      text: "Stub receipt text", 
      amount: 0, 
      date: new Date().toISOString().split('T')[0], 
      vendor: "Stub Vendor" 
    } 
  };
};

export const validateImage = async () => {
  logger.warn("receipt-ocr-service.ts was removed - validateImage is a stub");
  return { valid: true, reason: null };
};

export const mapReceiptDataToFormFields = (ocrData: unknown) => {
  logger.warn("receipt-ocr-service.ts was removed - mapReceiptDataToFormFields is a stub");
  return {
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    vendor: "Stub Vendor",
    category: "Other",
    description: "Stub receipt (OCR service removed)"
  };
};