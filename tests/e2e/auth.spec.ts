/**
 * Authentication E2E Tests
 *
 * Tests user authentication flows using fixtures.
 */

import { test, expect } from '../support/fixtures/auth';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.goto('/login');

    // Fill login form
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', password);

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirection to dashboard or home
    await page.waitForURL(/\/(dashboard|projects|home)/, { timeout: 15000 });

    // Verify user is logged in (check for logout button or user menu)
    const userMenu = page.locator('[data-testid="user-menu"], [aria-label*="user"], button:has-text("Logout")');
    await expect(userMenu.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'invalid@example.com');
    await page.fill('[name="password"]', 'WrongPassword');

    await page.click('button[type="submit"]');

    // Look for error message
    const errorMessage = page.locator('text=/invalid|incorrect|error/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Authenticated User Actions', () => {
  test('should access protected routes when authenticated', async ({ authenticatedPage }) => {
    // Using the authenticatedPage fixture - already logged in
    await authenticatedPage.goto('/dashboard');

    // Verify we can access the dashboard
    await expect(authenticatedPage).toHaveURL(/dashboard/);

    // Check for dashboard content
    const content = authenticatedPage.locator('main, [role="main"]');
    await expect(content).toBeVisible();
  });

  test('should logout successfully', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Find and click logout button
    const logoutButton = authenticatedPage.locator('button:has-text("Logout"), button:has-text("Sign Out")');
    await logoutButton.first().click();

    // Verify redirection to login page
    await authenticatedPage.waitForURL(/\/(login|signin)/, { timeout: 15000 });
  });
});
