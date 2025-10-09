/**
 * Authentication Fixture
 *
 * Provides authenticated page context for tests requiring login.
 * Follows pure function → fixture pattern for testability.
 */

import { test as base, Page } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';

type AuthFixtures = {
  authenticatedPage: Page;
  supabaseClient: SupabaseClient;
};

/**
 * Pure helper function for authentication
 * Can be tested independently of Playwright
 */
export async function loginUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL(/\/(dashboard|projects|home)/, { timeout: 15000 });
}

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Provides a page that's already authenticated
   * Usage: test('my test', async ({ authenticatedPage }) => { ... })
   */
  authenticatedPage: async ({ page }, use) => {
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await loginUser(page, email, password);

    // Provide the authenticated page to the test
    await use(page);
  },

  /**
   * Provides Supabase client for API-level operations
   */
  supabaseClient: async ({}, use) => {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Check .env file.');
    }

    const client = createClient(supabaseUrl, supabaseKey);

    await use(client);

    // Cleanup: sign out after test
    await client.auth.signOut();
  },
});

export { expect } from '@playwright/test';
