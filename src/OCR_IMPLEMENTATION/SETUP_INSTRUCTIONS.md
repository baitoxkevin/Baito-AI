# Setting Up the OCR Implementation

This document provides instructions for setting up the OCR (Optical Character Recognition) implementation in your project once the React hooks issues have been resolved.

## Prerequisites

1. Install the Google Generative AI package:
   ```bash
   npm install @google/generative-ai
   ```

2. Get a Gemini API key from the Google AI Studio:
   - Visit [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key for use in the OCR service

## Integration Steps

### 1. Copy the Implementation Files

First, copy these files to their intended locations:

- Copy `receipt-ocr-service.ts` to `/src/lib/receipt-ocr-service.ts`
- Copy `ReceiptOCRTool.tsx` to `/src/components/ReceiptOCRTool/index.tsx`

### 2. Update the API Key

Open `src/lib/receipt-ocr-service.ts` and replace the placeholder API key:

```typescript
// Before
const API_KEY = 'YOUR_GEMINI_API_KEY';

// After
const API_KEY = 'abc123xyz456...'; // Your actual Gemini API key
```

For production, use an environment variable instead:

```typescript
const API_KEY = process.env.GEMINI_API_KEY || '';
```

### 3. Create a Test Page (Optional)

Create a simple test page to verify the OCR functionality:

```tsx
// src/pages/ReceiptOCRTestPage.tsx
import React from 'react';
import ReceiptOCRTool from '@/components/ReceiptOCRTool';

export default function ReceiptOCRTestPage() {
  const handleReceiptScanned = (data) => {
    console.log("Receipt data:", data);
    alert(`Receipt scanned successfully!\nVendor: ${data.vendor}\nAmount: $${data.amount}\nDate: ${data.date}`);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Receipt OCR Test</h1>
      <ReceiptOCRTool 
        onReceiptScanned={handleReceiptScanned}
        userId="test-user-123"
      />
    </div>
  );
}
```

### 4. Add the Route to App.tsx

Add a route for the test page in your App.tsx:

```tsx
// In your App.tsx routes
<Route path="/test-receipt" element={<ReceiptOCRTestPage />} />
```

### 5. Integrate with Forms

To integrate the OCR with your expense claim forms:

1. Import the ReceiptOCRTool in your form component:
   ```tsx
   import ReceiptOCRTool from '@/components/ReceiptOCRTool';
   ```

2. Add a handler for the scanned receipt data:
   ```tsx
   const handleReceiptScanned = (data) => {
     // Update your form state with the scanned data
     setFormData({
       ...formData,
       vendor: data.vendor || '',
       amount: data.amount || 0,
       date: data.date || '',
       description: data.description || ''
     });
   };
   ```

3. Add the component to your form:
   ```tsx
   <ReceiptOCRTool 
     onReceiptScanned={handleReceiptScanned}
     userId={currentUser.id}
   />
   ```

## Troubleshooting

### Error: "Failed to parse the AI response"

This typically happens when:
- The API key is invalid or has reached its quota
- The image format is not supported
- The image is too large or too small

Try:
- Verifying your API key is correct
- Using a clear, high-resolution image of a receipt
- Ensuring the receipt is well-lit and all text is visible

### Error: "Uncaught TypeError: Cannot read properties of null"

This indicates React hooks errors in your application. You need to fix these issues before the OCR implementation will work properly. See the HOOK_ISSUE_RESOLUTION.md file for guidance.

## Additional Resources

- [Google Generative AI Documentation](https://ai.google.dev/docs)
- [React Hook Rules](https://reactjs.org/docs/hooks-rules.html)
- [File to Base64 Conversion Guide](https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL)