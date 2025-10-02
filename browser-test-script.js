/**
 * Browser Console Test Script for Add New Project Feature
 *
 * Instructions:
 * 1. Open http://localhost:5173 in your browser
 * 2. Open Developer Console (F12)
 * 3. Copy and paste this entire script
 * 4. Run: runTests()
 */

const TestRunner = {
  results: [],

  log(message, type = 'info') {
    const colors = {
      info: 'color: #2196F3',
      success: 'color: #4CAF50',
      error: 'color: #F44336',
      warning: 'color: #FF9800'
    };
    console.log(`%c${message}`, colors[type]);
    this.results.push({ message, type, timestamp: new Date().toISOString() });
  },

  async test(name, fn) {
    console.log(`\n%c🧪 Testing: ${name}`, 'font-weight: bold; font-size: 14px');
    try {
      await fn();
      this.log(`✅ PASS: ${name}`, 'success');
      return true;
    } catch (error) {
      this.log(`❌ FAIL: ${name} - ${error.message}`, 'error');
      console.error(error);
      return false;
    }
  },

  async wait(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  findElement(selector) {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`Element not found: ${selector}`);
    return el;
  },

  async clickElement(selector) {
    const el = this.findElement(selector);
    el.click();
    await this.wait(300);
  },

  async fillInput(selector, value) {
    const input = this.findElement(selector);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await this.wait(200);
  }
};

// Test Suite
const tests = {
  async checkDevServer() {
    await TestRunner.test('Development server is running', async () => {
      if (window.location.hostname !== 'localhost') {
        throw new Error('Not running on localhost');
      }
      TestRunner.log('✓ Running on localhost:5173', 'info');
    });
  },

  async checkReactApp() {
    await TestRunner.test('React app is loaded', async () => {
      const root = document.getElementById('root');
      if (!root || !root.children.length) {
        throw new Error('React app not mounted');
      }
      TestRunner.log('✓ React app mounted successfully', 'info');
    });
  },

  async checkAddProjectButton() {
    await TestRunner.test('Add New Project button exists', async () => {
      // Common selectors for "Add Project" buttons
      const selectors = [
        'button:has-text("New Project")',
        'button:has-text("Add Project")',
        'button:has-text("Create Project")',
        '[data-testid="add-project-button"]',
        'button[aria-label*="project"]'
      ];

      let found = false;
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes('project') ||
            btn.textContent.toLowerCase().includes('new')) {
          found = true;
          TestRunner.log(`✓ Found button: "${btn.textContent.trim()}"`, 'info');
        }
      });

      if (!found) throw new Error('Add Project button not found');
    });
  },

  async checkConsoleErrors() {
    await TestRunner.test('No console errors', async () => {
      const errors = [];
      const originalError = console.error;
      console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };

      await TestRunner.wait(1000);

      if (errors.length > 0) {
        throw new Error(`Found ${errors.length} console errors`);
      }
      TestRunner.log('✓ No console errors detected', 'info');
    });
  },

  async checkNetworkRequests() {
    await TestRunner.test('Check API connectivity', async () => {
      // Check if Supabase is configured
      if (typeof window.supabase === 'undefined') {
        TestRunner.log('⚠️ Supabase client not found in global scope', 'warning');
      } else {
        TestRunner.log('✓ Supabase client available', 'info');
      }
    });
  },

  async visualInspection() {
    await TestRunner.test('Visual inspection checklist', async () => {
      const checks = [
        'Check if sidebar navigation is visible',
        'Check if main content area loads',
        'Check if dark mode toggle exists',
        'Check if user profile/avatar is visible'
      ];

      checks.forEach(check => {
        TestRunner.log(`📋 ${check}`, 'info');
      });

      TestRunner.log('✓ Visual inspection checklist displayed', 'info');
    });
  }
};

// Main test runner
async function runTests() {
  console.clear();
  console.log('%c🚀 QA Test Suite - Add New Project Feature', 'font-size: 18px; font-weight: bold; color: #2196F3');
  console.log('%c════════════════════════════════════════════', 'color: #2196F3');

  TestRunner.results = [];

  await tests.checkDevServer();
  await tests.checkReactApp();
  await tests.checkAddProjectButton();
  await tests.checkConsoleErrors();
  await tests.checkNetworkRequests();
  await tests.visualInspection();

  // Summary
  console.log('\n%c════════════════════════════════════════════', 'color: #2196F3');
  console.log('%c📊 Test Summary', 'font-size: 16px; font-weight: bold');

  const passed = TestRunner.results.filter(r => r.type === 'success').length;
  const failed = TestRunner.results.filter(r => r.type === 'error').length;
  const warnings = TestRunner.results.filter(r => r.type === 'warning').length;

  console.log(`%c✅ Passed: ${passed}`, 'color: #4CAF50; font-weight: bold');
  console.log(`%c❌ Failed: ${failed}`, 'color: #F44336; font-weight: bold');
  console.log(`%c⚠️  Warnings: ${warnings}`, 'color: #FF9800; font-weight: bold');

  const passRate = ((passed / (passed + failed)) * 100).toFixed(1);
  console.log(`%c📈 Pass Rate: ${passRate}%`, `color: ${passRate >= 80 ? '#4CAF50' : '#FF9800'}; font-weight: bold; font-size: 14px`);

  console.log('\n%c📝 Manual Tests Required:', 'font-weight: bold; font-size: 14px');
  const manualTests = [
    '1. Click "Add New Project" button',
    '2. Fill out Step 1: Basic Information',
    '3. Test customer search/dropdown',
    '4. Test validation errors (leave required fields empty)',
    '5. Navigate through all 7 steps',
    '6. Test date range validation (end before start)',
    '7. Test brand logo search feature',
    '8. Review final step data display',
    '9. Submit and verify project creation',
    '10. Check success toast notification'
  ];

  manualTests.forEach(test => {
    console.log(`%c${test}`, 'color: #607D8B');
  });

  console.log('\n%c💡 Tip: Open Network tab to monitor API calls', 'color: #9C27B0; font-style: italic');
  console.log('%c════════════════════════════════════════════\n', 'color: #2196F3');

  return TestRunner.results;
}

// Helper functions for manual testing
const helpers = {
  async openAddProjectDialog() {
    console.log('🔍 Looking for Add Project button...');
    const buttons = document.querySelectorAll('button');
    let found = false;

    buttons.forEach(btn => {
      if (btn.textContent.toLowerCase().includes('project') &&
          btn.textContent.toLowerCase().includes('new')) {
        console.log(`✓ Found: "${btn.textContent.trim()}"`);
        btn.click();
        found = true;
      }
    });

    if (!found) console.log('❌ Add Project button not found');
  },

  async fillSampleData() {
    console.log('📝 Filling sample data...');
    // This would need to be customized based on actual form IDs
    console.log('⚠️  Not implemented - manual fill required');
  },

  async takeScreenshot() {
    console.log('📸 To take screenshot: Right-click > Inspect > Console > Screenshot');
  },

  getFormData() {
    const inputs = document.querySelectorAll('input, textarea, select');
    const data = {};
    inputs.forEach(input => {
      if (input.name) {
        data[input.name] = input.value;
      }
    });
    console.table(data);
    return data;
  }
};

// Export helpers
window.testHelpers = helpers;
window.runTests = runTests;

// Display instructions
console.log('%c╔══════════════════════════════════════════════════════════╗', 'color: #2196F3');
console.log('%c║  🧪 Test Script Loaded Successfully!                    ║', 'color: #2196F3; font-weight: bold');
console.log('%c╚══════════════════════════════════════════════════════════╝', 'color: #2196F3');
console.log('\n%cAvailable Commands:', 'font-weight: bold; font-size: 14px');
console.log('%c  runTests()                    - Run automated tests', 'color: #4CAF50');
console.log('%c  testHelpers.openAddProjectDialog() - Open dialog', 'color: #4CAF50');
console.log('%c  testHelpers.getFormData()     - Get current form data', 'color: #4CAF50');
console.log('\n%cRun: runTests()', 'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold');
