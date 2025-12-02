/**
 * Environment Variable Validation using Zod
 *
 * This module validates all environment variables at application startup
 * to catch configuration errors early.
 */

import { z } from 'zod';

// Define the schema for all environment variables
const envSchema = z.object({
  // Supabase Configuration (Required)
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),

  // Optional: Service Role Key (for server-side operations)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // AI Services (Optional)
  VITE_OPENROUTER_API_KEY: z.string().optional(),
  VITE_GEMINI_API_KEY: z.string().optional(),

  // Redis/Caching (Optional)
  REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),

  // Application Settings
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_APP_VERSION: z.string().default('0.0.1'),
  VITE_ENABLE_DEBUG: z.string().transform(v => v === 'true').default('false'),

  // Feature Flags
  VITE_ENABLE_AI_CHAT: z.string().transform(v => v === 'true').default('true'),
  VITE_ENABLE_RECEIPT_SCANNER: z.string().transform(v => v === 'true').default('true'),
  VITE_ENABLE_SOCIAL_SHARING: z.string().transform(v => v === 'true').default('false'),

  // Social Media APIs (for automation feature)
  VITE_WHATSAPP_BUSINESS_API_KEY: z.string().optional(),
  VITE_FACEBOOK_APP_ID: z.string().optional(),
  VITE_FACEBOOK_APP_SECRET: z.string().optional(),
});

// Type for validated environment
export type Env = z.infer<typeof envSchema>;

// Validate environment variables
function validateEnv(): Env {
  // In Vite, environment variables are on import.meta.env
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    VITE_OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY,
    VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
    REDIS_URL: import.meta.env.REDIS_URL,
    UPSTASH_REDIS_URL: import.meta.env.UPSTASH_REDIS_URL,
    UPSTASH_REDIS_TOKEN: import.meta.env.UPSTASH_REDIS_TOKEN,
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
    VITE_ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG,
    VITE_ENABLE_AI_CHAT: import.meta.env.VITE_ENABLE_AI_CHAT,
    VITE_ENABLE_RECEIPT_SCANNER: import.meta.env.VITE_ENABLE_RECEIPT_SCANNER,
    VITE_ENABLE_SOCIAL_SHARING: import.meta.env.VITE_ENABLE_SOCIAL_SHARING,
    VITE_WHATSAPP_BUSINESS_API_KEY: import.meta.env.VITE_WHATSAPP_BUSINESS_API_KEY,
    VITE_FACEBOOK_APP_ID: import.meta.env.VITE_FACEBOOK_APP_ID,
    VITE_FACEBOOK_APP_SECRET: import.meta.env.VITE_FACEBOOK_APP_SECRET,
  };

  const result = envSchema.safeParse(envVars);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, messages]) => `  ${key}: ${messages?.join(', ')}`)
      .join('\n');

    console.error('❌ Environment validation failed:\n' + errorMessages);

    // In development, show a helpful message
    if (import.meta.env.DEV) {
      console.warn('\n📝 Create a .env file with the required variables. See .env.example for reference.');
    }

    // Don't throw in production to allow graceful degradation
    // But log the error for debugging
    if (import.meta.env.PROD) {
      console.error('Running with potentially invalid environment configuration');
    }
  }

  return result.success ? result.data : (envVars as unknown as Env);
}

// Export validated environment
export const env = validateEnv();

// Helper functions for common checks
export const isDevelopment = () => env.VITE_APP_ENV === 'development';
export const isProduction = () => env.VITE_APP_ENV === 'production';
export const isStaging = () => env.VITE_APP_ENV === 'staging';
export const isDebugEnabled = () => env.VITE_ENABLE_DEBUG;

// Feature flag helpers
export const isAIChatEnabled = () => env.VITE_ENABLE_AI_CHAT;
export const isReceiptScannerEnabled = () => env.VITE_ENABLE_RECEIPT_SCANNER;
export const isSocialSharingEnabled = () => env.VITE_ENABLE_SOCIAL_SHARING;

// Check if social media APIs are configured
export const hasWhatsAppAPI = () => !!env.VITE_WHATSAPP_BUSINESS_API_KEY;
export const hasFacebookAPI = () => !!env.VITE_FACEBOOK_APP_ID && !!env.VITE_FACEBOOK_APP_SECRET;
