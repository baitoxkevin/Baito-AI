/**
 * AI-Powered Job Ad Parser
 *
 * This service uses AI reasoning to intelligently extract project information
 * from unstructured job ad text and convert it to structured project data.
 */

export interface FieldExtraction {
  value: string | number | string[];
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  sourceText?: string;
}

export interface AIProjectExtractionResult {
  fields: {
    title?: FieldExtraction;
    event_type?: FieldExtraction;
    description?: FieldExtraction;
    venue_address?: FieldExtraction;
    venue_details?: FieldExtraction;
    start_date?: FieldExtraction;
    end_date?: FieldExtraction;
    working_hours_start?: FieldExtraction;
    working_hours_end?: FieldExtraction;
    crew_count?: FieldExtraction;
    hourly_rate?: FieldExtraction;
    requirements?: FieldExtraction;
  };
  overallConfidence: number; // 0-100
  suggestions: string[];
  warnings: string[];
}

/**
 * System prompt for the AI to understand job ad extraction
 */
const SYSTEM_PROMPT = `You are an expert job posting analyzer. Your job is to analyze job advertisements for event staffing and extract structured project information.

You must extract the following fields from the job ad:
- title: Project/event title or name
- event_type: Type of event (e.g., "Conference", "Exhibition", "Workshop", "Product Launch", "Roadshow", "Trade Show", "Concert", "Wedding", "Corporate Event")
- description: Full job/project description including duties and responsibilities
- venue_address: Venue location or address
- venue_details: Additional venue information (floor, room, etc.)
- start_date: Event start date (YYYY-MM-DD format)
- end_date: Event end date (YYYY-MM-DD format, null if single day)
- working_hours_start: Start time (HH:MM format, 24-hour)
- working_hours_end: End time (HH:MM format, 24-hour)
- crew_count: Number of staff needed
- hourly_rate: Hourly pay rate (number only, no currency symbol)
- requirements: Array of job requirements/qualifications

EXTRACTION RULES:
1. **Date Parsing**: Convert dates to YYYY-MM-DD format
   - "15 Dec 2024" → "2024-12-15"
   - "15/12/2024" → "2024-12-15"
   - "December 15" → Use current year if not specified

2. **Time Parsing**: Convert times to 24-hour HH:MM format
   - "9am" → "09:00"
   - "2:30pm" → "14:30"
   - "6.30PM" → "18:30"

3. **Requirements Extraction**: Extract as array of strings
   - "Must speak Mandarin" → ["Speak Mandarin"]
   - "Age 18-35, own transport" → ["Age 18-35", "Own transport"]
   - "Experience in sales preferred" → ["Experience in sales"]

4. **Crew Count**: Extract number only
   - "Looking for 10 promoters" → 10
   - "Need 5-7 staff" → 6 (take average)
   - "Multiple positions" → Leave blank if not specific

5. **Pay Rate**: Extract hourly rate as number
   - "RM15/hour" → 15
   - "RM100/day (8 hours)" → 12.5
   - "$20 per hour" → 20

6. **Event Type Detection**: Identify from context
   - Keywords: "launching", "launch" → "Product Launch"
   - Keywords: "roadshow", "activation" → "Roadshow"
   - Keywords: "conference", "summit" → "Conference"
   - Keywords: "exhibition", "expo" → "Exhibition"

For each field you extract:
1. Provide the extracted value
2. Rate your confidence (high/medium/low)
3. Explain your reasoning
4. Include source text snippet if relevant

IMPORTANT RULES:
- If a field is not found, set value to empty string "" or null
- For arrays (requirements), return empty array [] if not found
- Be conservative with confidence - only "high" when very certain
- Always use 24-hour time format
- Always use YYYY-MM-DD date format
- Extract hourly rate as a number without currency symbols

Return your response as a valid JSON object with this structure:
{
  "fields": {
    "fieldName": {
      "value": "extracted value",
      "confidence": "high|medium|low",
      "reasoning": "why you extracted this",
      "sourceText": "relevant text snippet"
    }
  },
  "overallConfidence": 85,
  "suggestions": ["suggestion 1", "suggestion 2"],
  "warnings": ["warning 1", "warning 2"]
}`;

/**
 * Extract project information from job ad text using AI
 */
export async function extractProjectFromJobAd(
  jobAdText: string,
  apiKey?: string,
  model: string = 'google/gemini-2.5-flash-preview-09-2025'
): Promise<AIProjectExtractionResult> {
  try {
    const effectiveApiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!effectiveApiKey) {
      throw new Error('OpenRouter API key not found. Please set VITE_OPENROUTER_API_KEY in your .env file.');
    }

    const userPrompt = `Please analyze the following job advertisement and extract all project/event information:\n\n${jobAdText}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveApiKey}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://baitoai.netlify.app',
        'X-Title': 'Baito AI Project Extractor'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });

      if (response.status === 401) {
        throw new Error('OpenRouter API key is invalid or expired.');
      }
      if (response.status === 402) {
        throw new Error('Insufficient credits. Please add credits to your OpenRouter account.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }

      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in API response');
    }

    console.log('AI Project Extraction Result:', content);
    const result: AIProjectExtractionResult = JSON.parse(content);

    // Validate and sanitize
    if (!result.fields) result.fields = {};
    if (typeof result.overallConfidence !== 'number') result.overallConfidence = 50;
    if (!Array.isArray(result.suggestions)) result.suggestions = [];
    if (!Array.isArray(result.warnings)) result.warnings = [];

    return result;

  } catch (error) {
    console.error('AI project extraction error:', error);
    throw new Error(`Failed to extract project from job ad: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert AI extraction result to form data format
 */
export function aiResultToProjectFormData(result: AIProjectExtractionResult): Partial<{
  title: string;
  event_type: string;
  description: string;
  venue_address: string;
  venue_details: string;
  start_date: Date | null;
  end_date: Date | null;
  working_hours_start: string;
  working_hours_end: string;
  crew_count: number;
  hourly_rate: number;
}> {
  const fields = result.fields;

  return {
    title: fields.title?.value as string || '',
    event_type: fields.event_type?.value as string || '',
    description: fields.description?.value as string || '',
    venue_address: fields.venue_address?.value as string || '',
    venue_details: fields.venue_details?.value as string || '',
    start_date: fields.start_date?.value ? parseDate(fields.start_date.value as string) : null,
    end_date: fields.end_date?.value ? parseDate(fields.end_date.value as string) : null,
    working_hours_start: fields.working_hours_start?.value as string || '09:00',
    working_hours_end: fields.working_hours_end?.value as string || '17:00',
    crew_count: fields.crew_count?.value as number || 1,
    hourly_rate: fields.hourly_rate?.value as number || 0,
  };
}

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  try {
    // Assuming format is YYYY-MM-DD from AI
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Get confidence color for UI display
 */
export function getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get confidence badge text
 */
export function getConfidenceBadge(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return '✓ High Confidence';
    case 'medium':
      return '⚠ Medium Confidence';
    case 'low':
      return '⚠ Low Confidence';
    default:
      return 'Unknown';
  }
}
