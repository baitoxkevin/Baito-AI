/**
 * Receipt OCR using OpenRouter's FREE Grok-4-Fast model
 *
 * Pros:
 * - Completely FREE
 * - Multimodal (vision) support
 * - 2M context window
 *
 * Cons:
 * - Data may be used to train models (privacy concern)
 * - Rate limits (not specified)
 * - Requires OpenRouter API key
 */

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

/**
 * Convert File to Base64 data URL
 */
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Analyze receipt using OpenRouter's free Grok-4-Fast model
 */
export async function analyzeReceiptWithOpenRouter(imageFile: File): Promise<{
  success: boolean;
  data?: ReceiptData;
  error?: string;
}> {
  try {
    // Validate API key
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      logger.error('OpenRouter API key not configured');
      return {
        success: false,
        error: 'OCR service not configured. Please add VITE_OPENROUTER_API_KEY to your .env file.'
      };
    }

    // Validate image
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload JPEG, PNG, or WebP.'
      };
    }

    // Check file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      };
    }

    // Convert image to data URL
    const imageDataUrl = await fileToDataUrl(imageFile);

    // Prepare the API request
    const prompt = `Extract the following information from this receipt and return ONLY a valid JSON object (no markdown, no explanations):

{
  "vendor": "store or vendor name",
  "amount": total_amount_as_number,
  "date": "YYYY-MM-DD",
  "description": "brief description",
  "items": ["item1", "item2"],
  "category": "one of: transport, meals, accommodation, supplies, equipment, communication, training, other"
}

Important:
- Extract TOTAL amount (not subtotal)
- Date must be YYYY-MM-DD format
- Return ONLY valid JSON`;

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Baito AI Receipt OCR'
      },
      body: JSON.stringify({
        model: 'x-ai/grok-4-fast:free', // FREE model!
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1 // Low temperature for consistent extraction
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('OpenRouter API error:', errorData);

      return {
        success: false,
        error: errorData.error?.message || `API error: ${response.status}`
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: 'No response from API'
      };
    }

    logger.debug('OpenRouter response:', { data: content });

    // Parse the JSON response
    let receiptData: ReceiptData;
    try {
      // Clean markdown code blocks if present
      const cleanText = content
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
        text: content
      };
    } catch (parseError) {
      logger.error('Failed to parse response as JSON:', parseError);

      // Fallback
      receiptData = {
        vendor: 'Unknown Vendor',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        text: content,
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
    receipt_number: `RCP-${Date.now()}`
  };
}

/**
 * Batch process multiple receipts
 */
export async function analyzeMultipleReceipts(files: File[]): Promise<{
  success: boolean;
  results: Array<{ file: string; data?: ReceiptData; error?: string }>;
}> {
  const results = await Promise.all(
    files.map(async (file) => {
      const result = await analyzeReceiptWithOpenRouter(file);
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
