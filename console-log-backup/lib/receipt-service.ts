// Stub file for receipt-service.ts
export const uploadReceipt = async () => {
  console.warn("receipt-service.ts was removed - uploadReceipt is a stub");
  return { url: "", path: "" };
};

export const generateReceiptFileName = (userId: string, extension: string = 'jpg') => {
  console.warn("receipt-service.ts was removed - generateReceiptFileName is a stub");
  return `stub-receipt-${userId}-${Date.now()}.${extension}`;
};

export const simulateOcrProcessing = async () => {
  console.warn("receipt-service.ts was removed - simulateOcrProcessing is a stub");
  return {
    id: "stub-id",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    vendor: "Stub Vendor",
    category: "Other",
    description: "Stub receipt (receipt service removed)",
    imageUrl: "",
    user_id: "",
    created_at: new Date().toISOString()
  };
};

export const validateReceipt = async () => {
  console.warn("receipt-service.ts was removed - validateReceipt is a stub");
  return { valid: false, errors: ["Receipt service has been removed"] };
};

export const validateImage = (file: File) => {
  console.warn("receipt-service.ts was removed - validateImage is a stub");
  return true;
};

export const getFileExtension = (file: File) => {
  console.warn("receipt-service.ts was removed - getFileExtension is a stub");
  const filename = file.name;
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
};

// Added for ExpenseClaimForm.tsx
export const fetchUserReceipts = async () => {
  console.warn("receipt-service.ts was removed - fetchUserReceipts is a stub");
  return [];
};

export const addReceipt = async () => {
  console.warn("receipt-service.ts was removed - addReceipt is a stub");
  return {
    id: "stub-receipt-id",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    vendor: "Stub Vendor",
    category: "Other",
    description: "Stub receipt (receipt service removed)",
    imageUrl: "",
    user_id: "stub-user-id",
    created_at: new Date().toISOString()
  };
};

// Type definition for ReceiptData
export interface ReceiptData {
  id?: string;
  amount: number;
  date: string;
  vendor?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  user_id?: string;
  created_at?: string;
}

// Type definition for Receipt
export interface Receipt {
  id: string;
  amount: number;
  date: string;
  vendor: string;
  category?: string;
  description?: string;
  image_url?: string;
  user_id: string;
  created_at: string;
}