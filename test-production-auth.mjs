import { chromium } from 'playwright';

(async () => {
  console.log('Starting production authentication test...');
  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Enable console log monitoring
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`[CONSOLE ERROR]: ${text}`);
    } else if (type === 'warning') {
      console.log(`[CONSOLE WARNING]: ${text}`);
    } else {
      console.log(`[CONSOLE ${type.toUpperCase()}]: ${text}`);
    }
  });

  // Monitor network requests for auth-related calls
  page.on('request', request => {
    const url = request.url();
    if (url.includes('auth') || url.includes('login') || url.includes('session')) {
      console.log(`[NETWORK REQUEST]: ${request.method()} ${url}`);
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('auth') || url.includes('login') || url.includes('session')) {
      console.log(`[NETWORK RESPONSE]: ${response.status()} ${url}`);
    }
  });

  try {
    // Step 1: Navigate to production site
    console.log('\n=== Step 1: Navigating to https://baitoai.netlify.app/ ===');
    await page.goto('https://baitoai.netlify.app/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const initialUrl = page.url();
    console.log(`Current URL: ${initialUrl}`);

    // Take screenshot of login page
    await page.screenshot({
      path: 'production-01-login-page.png',
      fullPage: true
    });
    console.log('Screenshot saved: production-01-login-page.png');

    // Wait a bit to ensure page is fully loaded
    await page.waitForTimeout(2000);

    // Step 2: Check for login form
    console.log('\n=== Step 2: Checking for login form ===');
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();

    if (!await emailInput.isVisible() || !await passwordInput.isVisible()) {
      console.log('Login form not found, checking if already redirected...');
      console.log(`Current URL: ${page.url()}`);
      await page.screenshot({ path: 'production-no-login-form.png' });

      // Try to find login link
      const loginLink = await page.locator('a[href*="login"], button:has-text("Login"), button:has-text("Sign in")').first();
      if (await loginLink.isVisible()) {
        console.log('Found login link, clicking...');
        await loginLink.click();
        await page.waitForTimeout(2000);
      }
    }

    // Step 3: Enter credentials
    console.log('\n=== Step 3: Entering credentials ===');
    console.log('Email: admin@example.com');
    console.log('Password: admin123!');

    await emailInput.fill('admin@example.com');
    await passwordInput.fill('admin123!');

    // Take screenshot before login
    await page.screenshot({
      path: 'production-02-credentials-entered.png',
      fullPage: true
    });
    console.log('Screenshot saved: production-02-credentials-entered.png');

    // Step 4: Click login button
    console.log('\n=== Step 4: Clicking login button ===');
    const loginButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Submit")').first();

    if (!await loginButton.isVisible()) {
      console.log('Login button not found!');
      await page.screenshot({ path: 'production-no-login-button.png' });
    } else {
      await loginButton.click();
      console.log('Login button clicked, waiting for navigation...');
    }

    // Step 5: Wait for navigation and monitor redirects
    console.log('\n=== Step 5: Monitoring post-login behavior ===');
    let redirectCount = 0;
    let lastUrl = page.url();

    // Monitor for 20 seconds with checks every second
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(1000);
      const currentUrl = page.url();

      if (currentUrl !== lastUrl) {
        redirectCount++;
        console.log(`[${i+1}s] Redirect #${redirectCount}: ${lastUrl} -> ${currentUrl}`);
        lastUrl = currentUrl;

        // Check for redirect loop
        if (currentUrl.includes('/login') && i > 2) {
          console.log('WARNING: Redirected back to login page!');
          await page.screenshot({
            path: `production-redirect-loop-${i}s.png`,
            fullPage: true
          });
        }
      } else if (i % 5 === 0) {
        console.log(`[${i+1}s] Still on: ${currentUrl}`);
      }

      // Take screenshots at key intervals
      if (i === 0) {
        await page.screenshot({
          path: 'production-03-immediately-after-login.png',
          fullPage: true
        });
        console.log('Screenshot saved: production-03-immediately-after-login.png');
      } else if (i === 4) {
        await page.screenshot({
          path: 'production-04-after-5-seconds.png',
          fullPage: true
        });
        console.log('Screenshot saved: production-04-after-5-seconds.png');
      } else if (i === 14) {
        await page.screenshot({
          path: 'production-05-after-15-seconds.png',
          fullPage: true
        });
        console.log('Screenshot saved: production-05-after-15-seconds.png');
      }
    }

    // Step 6: Check localStorage for session
    console.log('\n=== Step 6: Checking session storage ===');
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.includes('auth') || key.includes('session') || key.includes('supabase'))) {
          items[key] = window.localStorage.getItem(key);
        }
      }
      return items;
    });

    console.log('LocalStorage auth-related items:');
    for (const [key, value] of Object.entries(localStorage)) {
      console.log(`  ${key}: ${value ? value.substring(0, 50) + '...' : 'null'}`);
    }

    // Step 7: Final status check
    console.log('\n=== Step 7: Final Status ===');
    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);
    console.log(`Total redirects: ${redirectCount}`);

    if (finalUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: User is on dashboard');
    } else if (finalUrl.includes('/login')) {
      console.log('❌ FAILURE: User is back on login page');
    } else {
      console.log(`⚠️  UNEXPECTED: User is on ${finalUrl}`);
    }

    // Take final screenshot
    await page.screenshot({
      path: 'production-06-final-state.png',
      fullPage: true
    });
    console.log('Screenshot saved: production-06-final-state.png');

    // Keep browser open for manual inspection
    console.log('\n=== Test Complete ===');
    console.log('Browser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Test failed with error:', error);
    await page.screenshot({
      path: 'production-error-state.png',
      fullPage: true
    });
  } finally {
    await browser.close();
    console.log('Test finished.');
  }
})();