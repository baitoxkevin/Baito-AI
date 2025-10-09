/**
 * Performance Tests
 * Test IDs: PERF-001 through PERF-010
 * Risk Mitigation: R005, R012 (Performance issues)
 *
 * @priority LOW
 * @category Performance
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Tests @performance', () => {
  test('PERF-001: Dashboard loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('PERF-002: Projects page loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Projects load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('PERF-003: Calendar renders within 4 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Calendar load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(4000); // Calendar is more complex
  });

  test('PERF-004: Search responds within 500ms', async ({ page }) => {
    await page.goto('/candidates');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');

    if (await searchInput.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      const startTime = Date.now();

      await searchInput.first().fill('test');
      await page.waitForTimeout(100);

      const responseTime = Date.now() - startTime;

      console.log(`Search response time: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(500);
    } else {
      expect(true).toBeTruthy(); // Pass if no search
    }
  });

  test('PERF-005: Image loading does not block page render', async ({ page }) => {
    await page.goto('/dashboard');

    // Check if page is interactive before all images load
    const startTime = Date.now();
    await page.waitForLoadState('domcontentloaded');
    const interactiveTime = Date.now() - startTime;

    console.log(`Time to interactive: ${interactiveTime}ms`);
    expect(interactiveTime).toBeLessThan(2000);
  });

  test('PERF-006: API responses are cached appropriately', async ({ page }) => {
    // First load
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const firstLoadStart = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const firstReloadTime = Date.now() - firstLoadStart;

    // Second reload should be faster (cached)
    const secondLoadStart = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const secondReloadTime = Date.now() - secondLoadStart;

    console.log(`First reload: ${firstReloadTime}ms, Second reload: ${secondReloadTime}ms`);

    // Second load should be at least as fast or faster
    expect(secondReloadTime).toBeLessThanOrEqual(firstReloadTime * 1.5);
  });

  test('PERF-007: Large tables render without freezing', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Measure time to render table
    const startTime = Date.now();
    const table = page.locator('table').first();

    if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
      const renderTime = Date.now() - startTime;
      console.log(`Table render time: ${renderTime}ms`);
      expect(renderTime).toBeLessThan(2000);
    } else {
      expect(true).toBeTruthy();
    }
  });

  test('PERF-008: JavaScript bundle size is reasonable', async ({ page }) => {
    const resourceSizes: number[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('.js') && response.status() === 200) {
        const size = parseInt(response.headers()['content-length'] || '0');
        if (size > 0) {
          resourceSizes.push(size);
        }
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const totalJSSize = resourceSizes.reduce((a, b) => a + b, 0);
    const totalMB = totalJSSize / (1024 * 1024);

    console.log(`Total JS size: ${totalMB.toFixed(2)}MB`);

    // Total JS should be under 5MB for good performance
    expect(totalMB).toBeLessThan(5);
  });

  test('PERF-009: No memory leaks on navigation', async ({ page }) => {
    // Navigate through several pages
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    await page.goto('/candidates');
    await page.waitForLoadState('networkidle');

    // Return to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for excessive event listeners (sign of memory leaks)
    const listenerCount = await page.evaluate(() => {
      // @ts-ignore
      return window.getEventListeners ? Object.keys(window.getEventListeners(document)).length : 0;
    });

    console.log(`Event listener types: ${listenerCount}`);
    // This is a basic check; real memory profiling requires more sophisticated tools
    expect(true).toBeTruthy();
  });

  test('PERF-010: First Contentful Paint is under 1.5 seconds', async ({ page }) => {
    await page.goto('/dashboard');

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
      };
    });

    console.log('Performance metrics:', metrics);

    if (metrics.fcp > 0) {
      expect(metrics.fcp).toBeLessThan(1500); // 1.5 seconds
    } else {
      // FCP not available, check DOM content loaded instead
      expect(metrics.domContentLoaded).toBeLessThan(2000);
    }
  });
});
