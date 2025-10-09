/**
 * AI-Powered Candidate Information Extractor
 *
 * This service uses AI reasoning to intelligently extract and map candidate information
 * from unstructured resume text to structured database fields.
 */

import { CandidateInfo } from './candidate-import-service';

export interface FieldExtraction {
  value: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  sourceText?: string; // The text snippet where this was found
}

export interface AIExtractionResult {
  fields: {
    [K in keyof CandidateInfo]?: FieldExtraction;
  };
  overallConfidence: number; // 0-100
  suggestions: string[]; // Suggestions for improving data quality
  warnings: string[]; // Warnings about missing or ambiguous data
}

/**
 * System prompt for the AI to understand its role
 */
const SYSTEM_PROMPT = `You are an expert HR data extraction assistant. Your job is to analyze resume/candidate text and extract structured information.

You must extract the following fields from the text:
- name: Full legal name
- email: Email address
- phone: Phone number (with country code if available)
- ic_number: Malaysian IC/NRIC number (format: XXXXXX-XX-XXXX)
- date_of_birth: Date of birth (YYYY-MM-DD format, can be derived from IC)
- age: Age in years
- race: Race/ethnicity
- location: Current address or location
- tshirt_size: T-shirt size (XS, S, M, L, XL, XXL, etc.)
- transportation: Transportation method (e.g., "Own car", "Motorcycle", "Public transport")
- spoken_languages: Languages spoken (comma-separated)
- height: Height (in cm or with unit)
- typhoid: Typhoid vaccination status (Yes/No)
- emergency_contact_name: Emergency contact person name
- emergency_contact_number: Emergency contact phone number
- skills: Array of skills or languages
- experience: Array of work experience entries (IMPORTANT: see experience rules below)
- education: Array of education entries
- experience_tags: Array of job role tags extracted from experience (for filtering candidates)

EXPERIENCE EXTRACTION RULES:
1. **Split multi-company experiences**: If one job role lists multiple companies (e.g., "Mystery Shopper at Celcom, Nando, Petrol Station"), create SEPARATE experience entries for each company:
   - "Mystery Shopper at Celcom"
   - "Mystery Shopper at Nando"
   - "Mystery Shopper at Petrol Station"

2. **Extract job role tags**: For each experience, identify the job role/category and add to experience_tags. Common tags include:
   - "Promoter" (for promotional work)
   - "Mystery Shopper" (for mystery shopping)
   - "Supervisor" or "Team Leader" (for supervisory roles)
   - "Runner" (for runner/assistant roles)
   - "Setup" or "Event Setup" (for setup work)
   - "Emcee" or "MC" (for hosting events)
   - "Sales" (for sales roles)
   - "Customer Service" (for service roles)

3. **Deduplicate tags**: Only include each tag once in the experience_tags array, even if the candidate has multiple experiences with that role.

EXAMPLE:
Input: "Related Mystery Shopper- Celcom, Nando, Petrol Station"
Output:
  experience: ["Mystery Shopper at Celcom", "Mystery Shopper at Nando", "Mystery Shopper at Petrol Station"]
  experience_tags: ["Mystery Shopper"]

For each field you extract:
1. Provide the extracted value
2. Rate your confidence (high/medium/low)
3. Explain your reasoning
4. Include the source text snippet if relevant

IMPORTANT RULES:
- If a field is not found, set value to empty string ""
- For arrays (skills, experience, education), return empty array [] if not found
- Always format IC numbers as XXXXXX-XX-XXXX
- Always format dates as YYYY-MM-DD
- For age, if not explicitly stated, calculate from IC number or date of birth
- Be conservative with confidence ratings - only use "high" when you're very certain

CAPITALIZATION RULES:
- Use proper title case for names (e.g., "Yap Jia Jian", not "yap jia jian")
- Capitalize first letter of race/ethnicity (e.g., "Chinese", not "chinese" or "Chi")
- Capitalize location names (e.g., "Old Klang Road", not "old klang road")
- Capitalize transportation method (e.g., "Car", "Motorcycle", "Public Transport")
- Use proper capitalization for languages (e.g., "Chinese, English, Malay, Cantonese")
- T-shirt sizes should be uppercase (e.g., "L", "XL", "XXL")
- Yes/No answers should be capitalized (e.g., "Yes", "No")
- Job titles and company names should use proper title case
- Emergency contact names should use proper title case

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
 * Extract candidate information using AI reasoning
 * Uses environment variable VITE_OPENROUTER_API_KEY if no API key provided
 */
export async function extractWithAI(
  text: string,
  apiKey?: string,
  model: string = 'google/gemini-2.5-flash-preview-09-2025' // Gemini - same as chatbot
): Promise<AIExtractionResult> {
  try {
    // Use environment variable if no API key provided
    const effectiveApiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!effectiveApiKey) {
      throw new Error('OpenRouter API key not found. Please set VITE_OPENROUTER_API_KEY in your .env file.');
    }

    // Prepare the user prompt
    const userPrompt = `Please analyze the following resume/candidate text and extract all relevant information:\n\n${text}`;

    // Use OpenRouter API (supports multiple models)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveApiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Baito AI Candidate Extractor'
      },
      body: JSON.stringify({
        model: model, // Use specified model (default: free DeepSeek)
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
        temperature: 0.1, // Low temperature for consistency
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific error cases with helpful messages
      if (response.status === 401) {
        throw new Error(
          'OpenRouter API key is invalid or expired. Please visit https://openrouter.ai/keys to get a new key and update your .env file.'
        );
      }

      if (response.status === 404 && errorData.error?.message?.includes('data policy')) {
        throw new Error(
          'Free models require privacy settings. Visit https://openrouter.ai/settings/privacy and enable "Allow free model publication", or use a paid model like Claude 3.5 Sonnet in Settings.'
        );
      }

      throw new Error(
        `API request failed: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    // Log the full response for debugging
    console.log('OpenRouter API Response:', JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in API response. Full response:', data);
      throw new Error(`No content in API response. Response structure: ${JSON.stringify(data).substring(0, 200)}`);
    }

    // Parse the JSON response
    console.log('AI Content received:', content);
    const result: AIExtractionResult = JSON.parse(content);

    // Validate and sanitize the result
    if (!result.fields) {
      result.fields = {};
    }
    if (typeof result.overallConfidence !== 'number') {
      result.overallConfidence = 50;
    }
    if (!Array.isArray(result.suggestions)) {
      result.suggestions = [];
    }
    if (!Array.isArray(result.warnings)) {
      result.warnings = [];
    }

    return result;

  } catch (error) {
    console.error('AI extraction error:', error);
    throw new Error(`Failed to extract with AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert AI extraction result to CandidateInfo format
 */
export function aiResultToCandidateInfo(
  result: AIExtractionResult,
  rawText: string
): CandidateInfo {
  const fields = result.fields;

  return {
    name: fields.name?.value || '',
    email: fields.email?.value || '',
    phone: fields.phone?.value || '',
    ic_number: fields.ic_number?.value || '',
    date_of_birth: fields.date_of_birth?.value || '',
    age: fields.age?.value || '',
    race: fields.race?.value || '',
    location: fields.location?.value || '',
    tshirt_size: fields.tshirt_size?.value || '',
    transportation: fields.transportation?.value || '',
    spoken_languages: fields.spoken_languages?.value || '',
    height: fields.height?.value || '',
    typhoid: fields.typhoid?.value || '',
    emergency_contact_name: fields.emergency_contact_name?.value || '',
    emergency_contact_number: fields.emergency_contact_number?.value || '',
    skills: parseArrayField(fields.skills?.value),
    experience: parseArrayField(fields.experience?.value),
    education: parseArrayField(fields.education?.value),
    experience_tags: parseArrayField(fields.experience_tags?.value),
    raw_resume: rawText
  };
}

/**
 * Helper to parse array fields from AI response
 * Handles both strings and objects (e.g., work experience/education entries)
 */
function parseArrayField(value: any): string[] {
  if (!value) return [];

  // If already an array, process each item
  if (Array.isArray(value)) {
    return value
      .map(item => {
        // Handle string items
        if (typeof item === 'string' && item.trim().length > 0) {
          return item.trim();
        }

        // Handle object items (e.g., {title, company, duration, description})
        if (typeof item === 'object' && item !== null) {
          // For work experience objects
          if (item.title) {
            const parts = [item.title];
            if (item.company) parts.push(`at ${item.company}`);
            if (item.duration) parts.push(`(${item.duration})`);
            return parts.join(' ');
          }

          // For education objects
          if (item.degree || item.institution) {
            const parts = [];
            if (item.degree) parts.push(item.degree);
            if (item.institution) parts.push(`at ${item.institution}`);
            if (item.year) parts.push(`(${item.year})`);
            return parts.join(' ');
          }

          // Fallback: convert object to JSON string
          return JSON.stringify(item);
        }

        return null;
      })
      .filter(item => item !== null && item.length > 0) as string[];
  }

  // If it's a string, try to parse it
  if (typeof value === 'string') {
    // Try to parse as JSON array first
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // Recursively call parseArrayField to handle the parsed array
        return parseArrayField(parsed);
      }
    } catch {
      // If not valid JSON, split by common delimiters
      return value
        .split(/[,;\n]+/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
  }

  return [];
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
