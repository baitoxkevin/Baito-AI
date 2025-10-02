import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from './logger';

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
  items?: string[];
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

/**
 * Convert File to Base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (data:image/jpeg;base64,)
      resolve(base64.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Analyze receipt image using Google Gemini Vision API
 */
export async function analyzeReceiptImage(imageFile: File): Promise<{
  success: boolean;
  data?: ReceiptData;
  error?: string;
}> {
  try {
    // Validate API key
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      logger.error('Gemini API key not configured');
      return {
        success: false,
        error: 'OCR service not configured. Please add VITE_GEMINI_API_KEY to your .env file.'
      };
    }

    // Validate image
    const validation = await validateImage(imageFile);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.reason || 'Invalid image file'
      };
    }

    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite" // Lighter, faster variant (2025)
    });

    // Craft OCR prompt
    const prompt = `You are a receipt analyzer. Extract the following information from this receipt image and return ONLY a JSON object (no markdown, no code blocks, just raw JSON):

{
  "vendor": "store or vendor name",
  "amount": total_amount_as_number,
  "date": "YYYY-MM-DD format",
  "description": "brief description of purchase",
  "items": ["item1", "item2"],
  "category": "one of: transport, meals, accommodation, supplies, equipment, communication, training, other"
}

Important:
- Extract the TOTAL amount (not subtotal)
- Use the exact date format YYYY-MM-DD
- If any field is unclear, use best guess
- category must be one of the predefined values
- Return ONLY valid JSON, no additional text`;

    // Call Gemini API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: imageFile.type
        }
      }
    ]);

    const response = result.response;
    const text = response.text();

    logger.debug('Gemini OCR response:', { data: text });

    // Parse JSON response
    let receiptData: ReceiptData;
    try {
      // Remove markdown code blocks if present
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanText);

      receiptData = {
        vendor: parsed.vendor || 'Unknown Vendor',
        amount: parseFloat(parsed.amount) || 0,
        date: parsed.date || new Date().toISOString().split('T')[0],
        description: parsed.description || '',
        category: parsed.category || 'other',
        items: parsed.items || [],
        text: text
      };
    } catch (parseError) {
      logger.error('Failed to parse Gemini response as JSON:', parseError);

      // Fallback: try to extract basic info from text
      receiptData = {
        vendor: 'Unknown Vendor',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        text: text,
        description: 'Failed to parse receipt automatically'
      };
    }

    return {
      success: true,
      data: receiptData
    };

  } catch (error) {
    logger.error('Receipt OCR error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze receipt'
    };
  }
}

/**
 * Validate image file before processing
 */
export async function validateImage(file: File): Promise<{
  valid: boolean;
  reason?: string
}> {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      reason: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      reason: 'File too large. Maximum size is 5MB.'
    };
  }

  // Check minimum size (at least 1KB to avoid empty files)
  if (file.size < 1024) {
    return {
      valid: false,
      reason: 'File too small. Please upload a valid receipt image.'
    };
  }

  return { valid: true };
}

/**
 * Map OCR data to expense claim form fields
 */
export function mapReceiptDataToFormFields(ocrData: ReceiptData) {
  return {
    title: ocrData.vendor ? `${ocrData.vendor} - ${ocrData.description || 'Purchase'}` : 'Receipt',
    amount: ocrData.amount?.toString() || '0',
    expense_date: ocrData.date ? new Date(ocrData.date) : new Date(),
    category: ocrData.category || 'other',
    description: ocrData.items?.length
      ? `Items: ${ocrData.items.join(', ')}`
      : (ocrData.description || 'Receipt from ' + (ocrData.vendor || 'vendor')),
    receipt_number: `RCP-${Date.now()}` // Generate receipt number
  };
}

/**
 * Batch process multiple receipt images
 */
export async function analyzeMultipleReceipts(files: File[]): Promise<{
  success: boolean;
  results: Array<{ file: string; data?: ReceiptData; error?: string }>;
}> {
  const results = await Promise.all(
    files.map(async (file) => {
      const result = await analyzeReceiptImage(file);
      return {
        file: file.name,
        data: result.data,
        error: result.error
      };
    })
  );

  const successCount = results.filter(r => r.data).length;

  return {
    success: successCount > 0,
    results
  };
}
