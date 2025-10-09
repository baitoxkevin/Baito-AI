/**
 * Visual Regression Tests
 * Captures screenshots and compares against baselines
 *
 * @visual
 */

import { test, expect } from '../support/fixtures/auth';

test.describe('Visual Regression Tests @visual', () => {
  test('Dashboard visual snapshot', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Projects list visual snapshot', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/projects');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage).toHaveScreenshot('projects-list.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Calendar view visual snapshot', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/calendar');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage).toHaveScreenshot('calendar-view.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Settings page visual snapshot', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage).toHaveScreenshot('settings.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Candidates page visual snapshot', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/candidates');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage).toHaveScreenshot('candidates.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Expenses page visual snapshot', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage).toHaveScreenshot('expenses.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Warehouse page visual snapshot', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/warehouse');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage).toHaveScreenshot('warehouse.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Payments page visual snapshot', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/payments');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage).toHaveScreenshot('payments.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Goals page visual snapshot', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/goals');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage).toHaveScreenshot('goals.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Job Discovery page visual snapshot', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/job-discovery');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage).toHaveScreenshot('job-discovery.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('Sick Leave Report page visual snapshot', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/report-sick-leave');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage).toHaveScreenshot('sick-leave-report.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});
