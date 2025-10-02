# OCR Implementation

This directory contains the core implementation files for the OCR (Optical Character Recognition) functionality we've developed. Even though they might not be integrated into the application due to React hooks errors, these files contain the complete implementation.

## Implementation Files

1. **Receipt OCR Service** (`/src/lib/receipt-ocr-service.ts`)
   - Core service using Google's Generative AI (Gemini Pro Vision)
   - Image validation and base64 conversion
   - AI prompt engineering for receipt data extraction
   - Error handling and fallback mechanisms

2. **OCR UI Component** (`/src/components/ReceiptOCRTool/index.tsx`)
   - User interface for uploading receipt images
   - Integration with OCR service
   - Displaying extracted data
   - Form controls for verification

3. **Receipt Validator Component** (`/src/components/ReceiptValidator.tsx`)
   - Step-by-step wizard for receipt validation
   - Visual feedback during OCR processing
   - Verification interface for extracted data

## How to Use

To use this implementation in your application once the React hooks issues are fixed:

1. Import the ReceiptOCRTool component:
   ```jsx
   import ReceiptOCRTool from '@/components/ReceiptOCRTool';
   ```

2. Add it to your component:
   ```jsx
   function YourComponent() {
     const handleReceiptScanned = (data) => {
       console.log("Receipt data:", data);
       // Do something with the data
     };

     return (
       <ReceiptOCRTool 
         onReceiptScanned={handleReceiptScanned}
         userId="your-user-id"
       />
     );
   }
   ```

3. Make sure you have the Google Generative AI package installed:
   ```bash
   npm install @google/generative-ai
   ```

4. Update the API key in `receipt-ocr-service.ts` with your own key.

## API Response

The OCR service extracts the following information from receipt images:

```typescript
interface ReceiptData {
  isReceipt?: boolean;       // Whether the image is a valid receipt
  message?: string;          // Error message if not a receipt
  vendor?: string;           // Merchant name
  date?: string;             // Receipt date (YYYY-MM-DD)
  amount?: number;           // Total amount
  description?: string;      // Brief description
  category?: string;         // Expense category
  items?: Array<{           // Line items
    description: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
  tax?: number;              // Tax amount
  paymentMethod?: string;    // Payment method
  location?: string;         // Location/address
  receiptNumber?: string;    // Receipt ID
  confidence?: Record<string, number>; // AI confidence levels
}
```

## Integration Example

Here's how to integrate the OCR with a form:

```jsx
import { useState } from 'react';
import ReceiptOCRTool, { ReceiptData } from '@/components/ReceiptOCRTool';

function ExpenseForm() {
  const [formData, setFormData] = useState({
    vendor: '',
    amount: '',
    date: '',
    description: ''
  });

  const handleReceiptScanned = (data: ReceiptData) => {
    setFormData({
      vendor: data.vendor || '',
      amount: data.amount?.toString() || '',
      date: data.date || '',
      description: data.description || ''
    });
  };

  return (
    <div>
      <h1>Expense Form</h1>
      
      <ReceiptOCRTool 
        onReceiptScanned={handleReceiptScanned}
        userId="user123"
      />
      
      <form>
        <label>
          Vendor:
          <input 
            type="text" 
            value={formData.vendor} 
            onChange={(e) => setFormData({...formData, vendor: e.target.value})}
          />
        </label>
        
        <label>
          Amount:
          <input 
            type="text" 
            value={formData.amount} 
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
          />
        </label>
        
        <label>
          Date:
          <input 
            type="date" 
            value={formData.date} 
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />
        </label>
        
        <label>
          Description:
          <textarea 
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </label>
        
        <button type="submit">Submit Expense</button>
      </form>
    </div>
  );
}
```