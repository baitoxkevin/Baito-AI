/**
 * Automated Screenshot Capture Script (ESM)
 *
 * This script uses Playwright to automatically navigate through the app,
 * test functionality, and capture screenshots for the user guide.
 *
 * Run: node automated-screenshot-capture.mjs
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.join(__dirname, 'docs/user-guides/screenshots');
const TEST_USER = {
  email: 'admin@example.com',
  password: 'admin123!'
};

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function captureScreenshot(page, filename, description) {
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`✅ Captured: ${filename} - ${description}`);
  return filepath;
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function safeClick(page, selector, description) {
  try {
    const element = page.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout: 5000 });
    await element.click();
    console.log(`✓ Clicked: ${description}`);
    return true;
  } catch (error) {
    console.log(`⚠️  Could not click: ${description} (${selector})`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting automated screenshot capture...\n');
  console.log(`📁 Screenshots will be saved to: ${SCREENSHOTS_DIR}\n`);

  // Launch browser
  const browser = await chromium.launch({
    headless: false, // Show browser for debugging
    slowMo: 300 // Slow down actions to see what's happening
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // =====================================================
    // 1. LOGIN & DASHBOARD
    // =====================================================
    console.log('\n📸 Section 1: Login & Dashboard\n');

    // Navigate to login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await wait(1000);
    await captureScreenshot(page, '001-login-page.png', 'Login page initial view');

    // Test: Fill in login credentials
    await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
    await wait(300);
    await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);
    await wait(300);

    // Click login button
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    console.log('✓ Clicked login button');

    // Wait for navigation
    await wait(3000);

    // Check if we're on the dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/projects') || currentUrl.includes('/dashboard')) {
      console.log('✅ TEST PASSED: Successfully logged in');
      testsPassed++;
      await captureScreenshot(page, '002-dashboard-overview.png', 'Projects dashboard main view');
    } else {
      console.log('❌ TEST FAILED: Did not redirect to dashboard. Current URL:', currentUrl);
      testsFailed++;
      await captureScreenshot(page, 'error-login-failed.png', 'Login failed - current state');
    }

    await wait(1000);

    // Try to capture various dashboard elements
    const dashboardSelectors = [
      { selector: 'button:has-text("New Project")', screenshot: '005-new-project-button.png', desc: 'New Project button' },
      { selector: 'input[placeholder*="Search"], input[placeholder*="search"]', screenshot: '004-search-bar.png', desc: 'Search bar' }
    ];

    for (const { selector, screenshot, desc } of dashboardSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.scrollIntoViewIfNeeded();
        await wait(500);
        await captureScreenshot(page, screenshot, desc);
      }
    }

    // =====================================================
    // 2. PROJECT CREATION TEST
    // =====================================================
    console.log('\n📸 Section 2: Testing Project Creation\n');

    // Click "New Project"
    const newProjectClicked = await safeClick(
      page,
      'button:has-text("New Project")',
      'New Project button'
    );

    if (newProjectClicked) {
      await wait(1500);
      await captureScreenshot(page, '006-project-info-step.png', 'Step 1: Project Information');

      // Try to fill the form
      try {
        // Title
        const titleInput = page.locator('input[name="title"], input[placeholder*="title"]').first();
        if (await titleInput.isVisible().catch(() => false)) {
          await titleInput.fill('TEST_Automated Screenshot Project');
          console.log('✓ Filled project title');
        }

        // Try to find and select company
        const companySelect = page.locator('[name="client_id"], select:has-text("Company"), button:has-text("Select")').first();
        if (await companySelect.isVisible().catch(() => false)) {
          await companySelect.click();
          await wait(500);
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
          console.log('✓ Selected company');
        }

        await wait(500);
        await captureScreenshot(page, '007-event-details-step.png', 'Filled form state');

        console.log('✅ TEST PASSED: Project creation form accessible');
        testsPassed++;

        // Close dialog
        await page.keyboard.press('Escape');
        await wait(500);

      } catch (error) {
        console.log('⚠️  Could not complete project creation form:', error.message);
      }
    } else {
      console.log('❌ TEST FAILED: Could not open project creation dialog');
      testsFailed++;
    }

    // =====================================================
    // 3. NAVIGATE AND CAPTURE UI ELEMENTS
    // =====================================================
    console.log('\n📸 Section 3: Capturing UI Elements\n');

    // Capture different views
    await wait(1000);
    await captureScreenshot(page, '014-project-card.png', 'Project card view');

    // Try to find filter buttons
    const filterButtons = ['All', 'Planning', 'Confirmed', 'In Progress', 'Completed'];
    for (const filter of filterButtons) {
      const filterButton = page.locator(`button:has-text("${filter}")`).first();
      if (await filterButton.isVisible().catch(() => false)) {
        await filterButton.click();
        await wait(800);
        await captureScreenshot(page, `059-status-filter-${filter.toLowerCase().replace(' ', '-')}.png`, `${filter} filter view`);
      }
    }

    // =====================================================
    // SUMMARY
    // =====================================================
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log('═'.repeat(60) + '\n');

    // List captured screenshots
    const screenshots = fs.readdirSync(SCREENSHOTS_DIR);
    console.log(`📸 Total screenshots captured: ${screenshots.length}\n`);
    screenshots.forEach(file => console.log(`   - ${file}`));

  } catch (error) {
    console.error('\n❌ Error during screenshot capture:', error.message);
    console.error(error.stack);

    // Take error screenshot
    try {
      await captureScreenshot(page, 'error-state.png', 'Error occurred');
    } catch (e) {
      console.error('Could not capture error screenshot');
    }
  } finally {
    console.log('\n🔒 Closing browser...');
    await browser.close();
    console.log('✅ Complete!\n');
  }
}

// Run the script
main().catch(console.error);
