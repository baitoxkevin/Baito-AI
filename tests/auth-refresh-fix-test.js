/**
 * Autonomous Test for Auth Session & Cache Fix
 * Tests the fix for refresh-induced session loss
 */

import { chromium } from 'playwright';

const TEST_URL = 'http://localhost:5173';
const LOGIN_EMAIL = process.env.TEST_EMAIL || 'admin@example.com';
const LOGIN_PASSWORD = process.env.TEST_PASSWORD || 'password123';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function runTest() {
  log('\n🤖 AUTONOMOUS AUTH REFRESH TEST STARTING...', colors.cyan);
  log('=' .repeat(60), colors.cyan);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testResults = {
    loginSuccess: false,
    initialDataLoad: false,
    refreshTests: [],
    avatarPersistence: [],
    consoleLogs: [],
    cacheClearing: false,
    overallSuccess: false,
  };

  try {
    // Step 1: Navigate and Login
    log('\n📍 Step 1: Navigating to login page...', colors.blue);
    await page.goto(`${TEST_URL}/login`);
    await page.waitForLoadState('networkidle');

    log('🔑 Attempting login...', colors.blue);
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    testResults.loginSuccess = true;
    log('✅ Login successful!', colors.green);

    // Step 2: Check initial data load
    log('\n📊 Step 2: Checking initial data load...', colors.blue);
    await page.waitForTimeout(2000); // Wait for data to load

    // Check if projects are loaded
    const projectsVisible = await page.locator('[data-testid="project-card"], .project-card, h2:has-text("Project")').count() > 0;
    testResults.initialDataLoad = projectsVisible;

    if (projectsVisible) {
      log('✅ Initial data loaded successfully', colors.green);
    } else {
      log('⚠️  No projects visible (may be empty state)', colors.yellow);
    }

    // Check user avatar
    const avatarText = await page.locator('[data-testid="user-avatar"], .avatar, button:has-text("KR"), button:has-text("K")').first().textContent();
    log(`👤 User avatar: ${avatarText}`, colors.cyan);
    testResults.avatarPersistence.push({ attempt: 0, avatar: avatarText });

    // Step 3: Perform 5 refresh cycles
    log('\n🔄 Step 3: Performing 5 refresh cycles...', colors.blue);

    for (let i = 1; i <= 5; i++) {
      log(`\n   Refresh #${i}...`, colors.cyan);

      // Capture console logs
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('[AUTH]') || text.includes('[CACHE]')) {
          testResults.consoleLogs.push({ refresh: i, log: text });
        }
      });

      // Perform refresh
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // Check if still authenticated
      const currentUrl = page.url();
      const stillOnDashboard = currentUrl.includes('/dashboard');

      // Check avatar persistence
      try {
        const avatarAfterRefresh = await page.locator('[data-testid="user-avatar"], .avatar, button:has-text("KR"), button:has-text("K")').first().textContent({ timeout: 3000 });
        const avatarPersisted = avatarAfterRefresh && avatarAfterRefresh.trim() !== 'U';

        testResults.refreshTests.push({
          attempt: i,
          stillAuthenticated: stillOnDashboard,
          avatarPersisted,
          avatar: avatarAfterRefresh,
        });

        testResults.avatarPersistence.push({ attempt: i, avatar: avatarAfterRefresh });

        if (stillOnDashboard && avatarPersisted) {
          log(`   ✅ Refresh #${i}: PASSED (Avatar: ${avatarAfterRefresh})`, colors.green);
        } else {
          log(`   ❌ Refresh #${i}: FAILED (Logged out: ${!stillOnDashboard}, Avatar: ${avatarAfterRefresh})`, colors.red);
        }
      } catch (error) {
        log(`   ❌ Refresh #${i}: FAILED (${error.message})`, colors.red);
        testResults.refreshTests.push({
          attempt: i,
          stillAuthenticated: false,
          error: error.message,
        });
      }
    }

    // Step 4: Check console logs
    log('\n📝 Step 4: Analyzing console logs...', colors.blue);
    const authLogs = testResults.consoleLogs.filter(l => l.log.includes('[AUTH]'));
    const cacheLogs = testResults.consoleLogs.filter(l => l.log.includes('[CACHE]'));

    log(`   Found ${authLogs.length} [AUTH] logs`, colors.cyan);
    log(`   Found ${cacheLogs.length} [CACHE] logs`, colors.cyan);

    // Check for bad patterns
    const hasBadSessionClearing = testResults.consoleLogs.some(l => l.log.includes('clearing bad session'));
    if (hasBadSessionClearing) {
      log('   ❌ Found "clearing bad session" logs - FIX NOT WORKING', colors.red);
    } else {
      log('   ✅ No "clearing bad session" logs found', colors.green);
    }

    // Step 5: Test logout and cache clearing
    log('\n🚪 Step 5: Testing logout and cache clearing...', colors.blue);

    // Logout
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), [data-testid="logout"]').first();
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await page.waitForURL('**/login', { timeout: 5000 });

      // Check if cache was cleared (look for console log)
      const cacheCleared = testResults.consoleLogs.some(l => l.log.includes('clearing cache') || l.log.includes('SIGNED_OUT'));
      testResults.cacheClearing = cacheCleared;

      if (cacheCleared) {
        log('✅ Cache cleared on logout', colors.green);
      } else {
        log('⚠️  Cache clearing not detected in logs', colors.yellow);
      }
    } else {
      log('⚠️  Logout button not found', colors.yellow);
    }

  } catch (error) {
    log(`\n❌ Test Error: ${error.message}`, colors.red);
    console.error(error);
  } finally {
    await browser.close();
  }

  // Generate Report
  log('\n\n' + '='.repeat(60), colors.cyan);
  log('📊 TEST RESULTS SUMMARY', colors.cyan);
  log('='.repeat(60), colors.cyan);

  log(`\n✅ Login: ${testResults.loginSuccess ? 'PASSED' : 'FAILED'}`, testResults.loginSuccess ? colors.green : colors.red);
  log(`✅ Initial Data Load: ${testResults.initialDataLoad ? 'PASSED' : 'FAILED'}`, testResults.initialDataLoad ? colors.green : colors.red);

  log('\n🔄 Refresh Test Results:', colors.cyan);
  const allRefreshesPassed = testResults.refreshTests.every(t => t.stillAuthenticated && t.avatarPersisted);
  testResults.refreshTests.forEach(test => {
    const status = test.stillAuthenticated && test.avatarPersisted ? '✅ PASS' : '❌ FAIL';
    const color = test.stillAuthenticated && test.avatarPersisted ? colors.green : colors.red;
    log(`   ${status} - Refresh #${test.attempt}: Avatar="${test.avatar}"`, color);
  });

  log(`\n👤 Avatar Persistence:`, colors.cyan);
  const avatarNeverChangedToU = testResults.avatarPersistence.every(a => a.avatar && a.avatar.trim() !== 'U');
  testResults.avatarPersistence.forEach(a => {
    const changed = a.avatar && a.avatar.trim() !== 'U';
    log(`   ${changed ? '✅' : '❌'} Attempt ${a.attempt}: ${a.avatar}`, changed ? colors.green : colors.red);
  });

  log(`\n🚪 Logout & Cache Clearing: ${testResults.cacheClearing ? 'PASSED' : 'NOT VERIFIED'}`, testResults.cacheClearing ? colors.green : colors.yellow);

  // Overall Success
  testResults.overallSuccess = testResults.loginSuccess &&
                               allRefreshesPassed &&
                               avatarNeverChangedToU &&
                               !testResults.consoleLogs.some(l => l.log.includes('clearing bad session'));

  log('\n' + '='.repeat(60), colors.cyan);
  if (testResults.overallSuccess) {
    log('🎉 OVERALL RESULT: ALL TESTS PASSED ✅', colors.green);
    log('✅ Auth session persists across refreshes', colors.green);
    log('✅ Avatar remains consistent', colors.green);
    log('✅ No session clearing bugs detected', colors.green);
  } else {
    log('❌ OVERALL RESULT: SOME TESTS FAILED', colors.red);
    log('⚠️  Fix may need adjustment', colors.yellow);
  }
  log('='.repeat(60) + '\n', colors.cyan);

  // Save detailed results
  const fs = await import('fs');
  const resultsPath = './test-results/auth-refresh-test-results.json';
  await fs.promises.mkdir('./test-results', { recursive: true });
  await fs.promises.writeFile(resultsPath, JSON.stringify(testResults, null, 2));
  log(`📄 Detailed results saved to: ${resultsPath}`, colors.cyan);

  process.exit(testResults.overallSuccess ? 0 : 1);
}

// Run the test
runTest().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
