/**
 * Example E2E Test
 *
 * Demonstrates basic Playwright test structure and best practices.
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for main content to be visible
    await expect(page.locator('body')).toBeVisible();

    // Check for basic page elements
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');

    // Look for common navigation patterns
    // Adjust selectors based on your actual app structure
    const nav = page.locator('nav, header');
    await expect(nav).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });
});
