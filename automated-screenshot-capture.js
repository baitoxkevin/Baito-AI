/**
 * Automated Screenshot Capture Script
 *
 * This script uses Playwright to automatically navigate through the app,
 * test functionality, and capture screenshots for the user guide.
 *
 * Run: node automated-screenshot-capture.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

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

async function main() {
  console.log('🚀 Starting automated screenshot capture...\n');

  // Launch browser
  const browser = await chromium.launch({
    headless: false, // Show browser for debugging
    slowMo: 500 // Slow down actions to see what's happening
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // =====================================================
    // 1. LOGIN & DASHBOARD
    // =====================================================
    console.log('\n📸 Section 1: Login & Dashboard\n');

    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await wait(1000);
    await captureScreenshot(page, '001-login-page.png', 'Login page initial view');

    // Test: Fill in login credentials
    await page.fill('[name="email"]', TEST_USER.email);
    await page.fill('[name="password"]', TEST_USER.password);
    await wait(500);

    // Click login button
    await page.click('button:has-text("Login")');
    await wait(2000);

    // Should redirect to dashboard
    await page.waitForURL(/\/projects|\/dashboard/, { timeout: 10000 });
    await wait(1000);
    await captureScreenshot(page, '002-dashboard-overview.png', 'Projects dashboard main view');

    // Capture month selector
    await page.click('[data-testid="month-selector"], .month-dropdown, button:has-text("July")');
    await wait(500);
    await captureScreenshot(page, '003-month-selector.png', 'Month selector dropdown');
    await page.keyboard.press('Escape');

    // Test search functionality
    await page.click('[placeholder*="Search"]');
    await page.fill('[placeholder*="Search"]', 'Festival');
    await wait(500);
    await captureScreenshot(page, '004-search-bar.png', 'Search functionality');
    await page.fill('[placeholder*="Search"]', ''); // Clear search

    // =====================================================
    // 2. PROJECT CREATION WORKFLOW
    // =====================================================
    console.log('\n📸 Section 2: Project Creation\n');

    // Click "New Project" button
    await page.click('button:has-text("New Project")');
    await wait(1000);
    await captureScreenshot(page, '005-new-project-button.png', 'New project dialog opened');

    // Step 1: Project Info
    await captureScreenshot(page, '006-project-info-step.png', 'Step 1: Project Information');

    await page.fill('[name="title"]', 'TEST_Summer Festival 2025');

    // Select company
    await page.click('[name="client_id"]');
    await wait(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Select manager
    await page.click('[name="manager_id"]');
    await wait(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Set start date
    await page.fill('[name="start_date"]', '2025-07-15');

    await wait(500);
    await page.click('button:has-text("Next")');
    await wait(1000);

    // Step 2: Event Details
    await captureScreenshot(page, '007-event-details-step.png', 'Step 2: Event Details');

    // Select project type
    await page.click('[name="project_type"]');
    await wait(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Set priority
    await page.click('[name="priority"]');
    await wait(500);
    await page.click('text=High');

    await wait(500);
    await page.click('button:has-text("Next")');
    await wait(1000);

    // Step 3: Location
    await captureScreenshot(page, '008-location-step.png', 'Step 3: Location');

    await page.fill('[name="venue_address"]', 'Central Park, New York, NY');
    await page.fill('[name="venue_details"]', 'Main stage area, near fountain');

    await wait(500);
    await page.click('button:has-text("Next")');
    await wait(1000);

    // Step 4: Schedule
    await captureScreenshot(page, '009-schedule-step.png', 'Step 4: Schedule');

    await page.fill('[name="working_hours_start"]', '08:00');
    await page.fill('[name="working_hours_end"]', '18:00');

    await wait(500);
    await page.click('button:has-text("Next")');
    await wait(1000);

    // Step 5: Staffing
    await captureScreenshot(page, '010-staffing-step.png', 'Step 5: Staffing');

    await page.fill('[name="crew_count"]', '25');
    await page.fill('[name="supervisors_required"]', '3');
    await page.fill('[name="special_skills_required"]', 'Event management, crowd control');

    await wait(500);
    await page.click('button:has-text("Next")');
    await wait(1000);

    // Step 6: Advanced Settings
    await captureScreenshot(page, '011-advanced-settings.png', 'Step 6: Advanced Settings');

    await page.fill('[name="budget"]', '15000');

    await wait(500);
    await page.click('button:has-text("Next")');
    await wait(1000);

    // Step 7: Review & Save
    await captureScreenshot(page, '012-review-and-save.png', 'Step 7: Review & Save');

    await page.click('button:has-text("Create Project")');
    await wait(2000);

    await captureScreenshot(page, '013-project-created.png', 'Project created successfully');

    // =====================================================
    // 3. PROJECT DETAILS & EDITING
    // =====================================================
    console.log('\n📸 Section 3: Project Details & Editing\n');

    // Find and click on the created project
    await page.click('text=TEST_Summer Festival 2025');
    await wait(1000);
    await captureScreenshot(page, '014-project-card.png', 'Project card view');

    // Click "View Details"
    await page.click('button:has-text("View Details")');
    await wait(1000);
    await captureScreenshot(page, '015-project-details.png', 'Project details dialog');

    // Click Edit
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await wait(1000);
      await captureScreenshot(page, '016-edit-mode.png', 'Project edit mode');

      // Make a change
      await page.fill('[name="venue_address"]', 'Updated: Central Park, New York');
      await page.click('button:has-text("Save")');
      await wait(1000);
      await captureScreenshot(page, '017-save-success.png', 'Changes saved successfully');
    }

    // =====================================================
    // 4. STAFFING TAB
    // =====================================================
    console.log('\n📸 Section 4: Staff Management\n');

    // Navigate to Staffing tab
    await page.click('text=Staffing');
    await wait(1000);
    await captureScreenshot(page, '018-staffing-tab.png', 'Staffing tab view');

    // Click "Add Staff"
    const addStaffButton = page.locator('button:has-text("Add Staff")').first();
    if (await addStaffButton.isVisible()) {
      await addStaffButton.click();
      await wait(1000);
      await captureScreenshot(page, '019-add-staff-button.png', 'Add staff button');
      await captureScreenshot(page, '020-add-staff-dialog.png', 'Add staff dialog');

      // Search for staff
      await page.fill('[placeholder*="Search"]', 'John');
      await wait(1000);
      await captureScreenshot(page, '021-staff-search.png', 'Staff search results');

      // Select staff and configure
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await wait(500);

      // Capture date selection if available
      const dateSelector = page.locator('[data-testid="date-picker"], .calendar');
      if (await dateSelector.isVisible()) {
        await captureScreenshot(page, '022-date-selection.png', 'Working dates selection');
      }

      await captureScreenshot(page, '023-salary-entry.png', 'Salary entry');

      // Add to project
      await page.click('button:has-text("Add to Project"), button:has-text("Confirm")');
      await wait(1000);
      await captureScreenshot(page, '024-staff-added.png', 'Staff added successfully');
    }

    // =====================================================
    // 5. SCREENSHOTS FOR REMAINING SECTIONS
    // =====================================================
    console.log('\n📸 Capturing remaining sections...\n');

    // Documents tab
    const docsTab = page.locator('text=Documents');
    if (await docsTab.isVisible()) {
      await docsTab.click();
      await wait(1000);
      await captureScreenshot(page, '040-documents-tab.png', 'Documents tab');
    }

    // Export button
    const exportButton = page.locator('button:has-text("Export")');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await wait(1000);
      await captureScreenshot(page, '049-export-button.png', 'Export options');
      await page.keyboard.press('Escape');
    }

    console.log('\n✅ Screenshot capture complete!\n');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}\n`);

  } catch (error) {
    console.error('❌ Error during screenshot capture:', error);

    // Take error screenshot
    await captureScreenshot(page, 'error-state.png', 'Error occurred');
  } finally {
    await browser.close();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
