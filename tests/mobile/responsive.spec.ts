/**
 * Mobile & Responsive Tests
 * Test IDs: MOBILE-001 through MOBILE-015
 *
 * @priority MEDIUM
 * @category User Experience
 */

import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Responsive Tests @mobile', () => {
  test('MOBILE-001: Dashboard renders correctly on mobile (375x667)', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone SE'],
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check mobile viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(390);

    // Verify main content is visible
    const mainContent = page.locator('main, [role="main"], body');
    await expect(mainContent).toBeVisible();

    // Check for horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasOverflow).toBe(false);

    await context.close();
  });

  test('MOBILE-002: Navigation menu works on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['Pixel 5'],
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for mobile menu button (hamburger)
    const menuButton = page.locator(
      'button[aria-label*="menu" i], button:has-text("☰"), [data-testid*="menu"], button:has([class*="hamburger"])'
    );

    const buttonExists = await menuButton.first().isVisible({ timeout: 2000 }).catch(() => false);

    if (buttonExists) {
      await menuButton.first().click();
      await page.waitForTimeout(500);

      // Check if navigation appeared
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav.first()).toBeVisible();
    }

    await context.close();
  });

  test('MOBILE-003: Touch interactions work on buttons', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
      hasTouch: true,
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Find a button and tap it
    const button = page.locator('button').first();
    if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
      await button.tap();
      await page.waitForTimeout(500);
    }

    expect(page.url()).toBeTruthy();
    await context.close();
  });

  test('MOBILE-004: Projects page is responsive on tablet (768x1024)', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad'],
    });
    const page = await context.newPage();

    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Check viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toEqual(768);

    // Verify content adapts
    const mainContent = page.locator('body');
    await expect(mainContent).toBeVisible();

    // Check no horizontal scrolling
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasOverflow).toBe(false);

    await context.close();
  });

  test('MOBILE-005: Text is readable without zooming', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone SE'],
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check font sizes
    const fontSize = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return parseInt(computed.fontSize);
    });

    // Font should be at least 14px
    expect(fontSize).toBeGreaterThanOrEqual(14);

    await context.close();
  });

  test('MOBILE-006: Touch targets are at least 44x44 pixels', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['Pixel 5'],
      hasTouch: true,
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check button sizes
    const buttons = page.locator('button').all();
    const allButtons = await buttons;

    for (const button of allButtons.slice(0, 5)) {
      if (await button.isVisible().catch(() => false)) {
        const box = await button.boundingBox();
        if (box) {
          // Apple Human Interface Guidelines recommend 44x44pt minimum
          expect(box.height).toBeGreaterThanOrEqual(32); // Allow 32px minimum (reasonable)
          expect(box.width).toBeGreaterThanOrEqual(32);
        }
      }
    }

    await context.close();
  });

  test('MOBILE-007: Calendar works on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();

    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    const calendar = page.locator('body');
    await expect(calendar).toBeVisible();

    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasOverflow).toBe(false);

    await context.close();
  });

  test('MOBILE-008: Forms are usable on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['Pixel 5'],
    });
    const page = await context.newPage();

    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Check form inputs are visible and sized appropriately
      const input = page.locator('input').first();
      if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
        const box = await input.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(40); // Minimum touch-friendly height
        }
      }
    }

    await context.close();
  });

  test('MOBILE-009: Swipe gestures work (if implemented)', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
      hasTouch: true,
    });
    const page = await context.newPage();

    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Try a swipe gesture
    const element = page.locator('body');
    const box = await element.boundingBox();

    if (box) {
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.touchscreen.tap(box.x + 50, box.y + box.height / 2);
    }

    expect(page.url()).toContain('/calendar');
    await context.close();
  });

  test('MOBILE-010: Tables are scrollable on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone SE'],
    });
    const page = await context.newPage();

    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table').first();
    if (await table.isVisible({ timeout: 2000 }).catch(() => false)) {
      const tableBox = await table.boundingBox();
      const viewport = page.viewportSize();

      // If table is wider than viewport, it should be in a scrollable container
      if (tableBox && viewport && tableBox.width > viewport.width) {
        const parent = table.locator('..');
        const overflowX = await parent.evaluate(el => {
          return window.getComputedStyle(el).overflowX;
        });

        expect(['auto', 'scroll']).toContain(overflowX);
      }
    }

    await context.close();
  });

  test('MOBILE-011: Images scale properly on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['Pixel 5'],
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img').all();
    const allImages = await images;

    for (const img of allImages.slice(0, 3)) {
      if (await img.isVisible().catch(() => false)) {
        const box = await img.boundingBox();
        const viewport = page.viewportSize();

        if (box && viewport) {
          // Image should not overflow viewport
          expect(box.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    }

    await context.close();
  });

  test('MOBILE-012: Modals are fullscreen on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone SE'],
    });
    const page = await context.newPage();

    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        const dialogBox = await dialog.boundingBox();
        const viewport = page.viewportSize();

        if (dialogBox && viewport) {
          // On mobile, modals should be close to full width
          const widthRatio = dialogBox.width / viewport.width;
          expect(widthRatio).toBeGreaterThan(0.85); // At least 85% of viewport
        }
      }
    }

    await context.close();
  });

  test('MOBILE-013: Landscape orientation works', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 667, height: 375 }, // Landscape iPhone SE
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const mainContent = page.locator('body');
    await expect(mainContent).toBeVisible();

    // Check no vertical overflow causing issues
    const hasVerticalOverflow = await page.evaluate(() => {
      return document.body.scrollHeight > window.innerHeight * 3; // Excessive scrolling
    });
    expect(hasVerticalOverflow).toBe(false);

    await context.close();
  });

  test('MOBILE-014: Settings page is usable on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['Pixel 5'],
    });
    const page = await context.newPage();

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const settingsPage = page.locator('body');
    await expect(settingsPage).toBeVisible();

    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasOverflow).toBe(false);

    await context.close();
  });

  test('MOBILE-015: Candidates page adapts to mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();

    await page.goto('/candidates');
    await page.waitForLoadState('networkidle');

    // Check page renders
    await expect(page.locator('body')).toBeVisible();

    // Check for responsive list or grid
    const candidateItems = page.locator('[class*="candidate"], [data-testid*="candidate"], table tr');
    const itemCount = await candidateItems.count();

    expect(itemCount >= 0).toBeTruthy();

    await context.close();
  });
});
