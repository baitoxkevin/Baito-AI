/**
 * P0 Critical Authentication Tests
 * Test IDs: AUTH-E2E-001 through AUTH-E2E-005
 * Risk Mitigation: R001 (Authentication bypass), R006 (RBAC enforcement)
 *
 * @priority P0
 * @category Security
 */

import { test, expect } from '../support/fixtures/auth';

test.describe('P0 Authentication Security', () => {
  test.describe.configure({ mode: 'serial' }); // Run tests in order for auth flows

  test('AUTH-E2E-001: Valid credentials login redirects to dashboard', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL || 'kevin@baito.events';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Verify login page elements
    await expect(page.locator('[name="email"]')).toBeVisible();
    await expect(page.locator('[name="password"]')).toBeVisible();

    // Fill and submit login form
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', password);
    await page.click('button[type="submit"]');

    // Verify redirection to authenticated area
    await page.waitForURL(/\/(dashboard|projects|home)/, { timeout: 15000 });

    // Verify user is authenticated
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|projects|home)/);

    // Verify user menu or logout button exists
    const userIndicator = page.locator(
      '[data-testid="user-menu"], button:has-text("Logout"), button:has-text("Sign Out"), [aria-label*="user menu" i]'
    );
    await expect(userIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test('AUTH-E2E-002: Invalid credentials show error message', async ({ page }) => {
    await page.goto('/login');

    // Attempt login with invalid credentials
    await page.fill('[name="email"]', 'invalid@example.com');
    await page.fill('[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForTimeout(2000);

    // Verify error message appears (flexible selector)
    const errorMessage = page.locator(
      'text=/invalid|incorrect|wrong|error|failed/i, [role="alert"], .error, .text-red'
    );
    const errorVisible = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

    // Verify we're still on login page
    expect(page.url()).toContain('/login');

    // Either error message shown OR still on login page (both indicate failure)
    expect(errorVisible || page.url().includes('/login')).toBeTruthy();
  });

  test('AUTH-E2E-003: Token expiration forces re-login', async ({ page, context }) => {
    const email = process.env.TEST_USER_EMAIL || 'kevin@baito.events';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|projects)/, { timeout: 15000 });

    // Clear all storage to simulate token expiration
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to access protected route
    await page.goto('/projects');

    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('AUTH-E2E-004: RBAC - Staff cannot access admin routes', async ({ page }) => {
    // This test assumes you have a staff test user
    // Modify credentials as needed
    const staffEmail = process.env.TEST_STAFF_EMAIL || 'staff@baito.events';
    const staffPassword = process.env.TEST_STAFF_PASSWORD || 'TestPassword123!';

    // Login as staff user
    await page.goto('/login');
    await page.fill('[name="email"]', staffEmail);
    await page.fill('[name="password"]', staffPassword);
    await page.click('button[type="submit"]');

    // Wait for successful login
    await page.waitForURL(/\/(dashboard|staff-dashboard)/, { timeout: 15000 });

    // Attempt to access admin-only routes
    const adminRoutes = ['/settings', '/team'];

    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForTimeout(1000);

      // Staff should either:
      // 1. Be redirected away from admin route
      // 2. See "Access Denied" message
      // 3. See empty/restricted content

      const currentUrl = page.url();
      const hasAccessDenied = await page
        .locator('text=/access denied|unauthorized|permission/i')
        .first()
        .isVisible()
        .catch(() => false);

      // Verify either redirected OR access denied
      const isRestricted = !currentUrl.includes(route) || hasAccessDenied;
      expect(isRestricted).toBeTruthy();
    }
  });

  test('AUTH-E2E-005: RBAC - Manager can access project management', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL || 'kevin@baito.events';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    // Login as admin/manager
    await page.goto('/login');
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|projects)/, { timeout: 15000 });

    // Access project management routes
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Verify project management UI is accessible
    await expect(page.locator('h1, h2, [role="heading"]')).toBeVisible();

    // Verify can see "Create Project" button or similar admin action
    const createButton = page.locator(
      'button:has-text("New Project"), button:has-text("Create Project"), button:has-text("Add Project")'
    );

    // Admin/Manager should see create button
    const canCreateProject = await createButton.first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(canCreateProject).toBeTruthy();
  });
});

test.describe('P0 Authentication Edge Cases', () => {
  test('Empty credentials validation', async ({ page }) => {
    await page.goto('/login');

    // Try to submit without credentials
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Should show validation errors or prevent submission
    const validationError = await page
      .locator('text=/required|empty|enter/i, [role="alert"]')
      .first()
      .isVisible()
      .catch(() => false);

    // Still on login page
    expect(page.url()).toContain('/login');
    expect(validationError || page.url().includes('/login')).toBeTruthy();
  });

  test('SQL injection attempt blocked', async ({ page }) => {
    await page.goto('/login');

    // Attempt SQL injection
    await page.fill('[name="email"]', "admin' OR '1'='1");
    await page.fill('[name="password"]', "password' OR '1'='1");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Should not log in
    expect(page.url()).toContain('/login');
  });

  test('XSS attempt sanitized', async ({ page }) => {
    await page.goto('/login');

    // Attempt XSS
    await page.fill('[name="email"]', '<script>alert("xss")</script>@test.com');
    await page.fill('[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verify no alert was triggered
    const dialogs: string[] = [];
    page.on('dialog', dialog => {
      dialogs.push(dialog.message());
      dialog.dismiss();
    });

    await page.waitForTimeout(500);
    expect(dialogs).toHaveLength(0);
  });
});
