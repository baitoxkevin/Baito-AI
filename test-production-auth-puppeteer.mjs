import puppeteer from 'puppeteer';

(async () => {
  console.log('Starting production authentication test...');
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

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
      waitUntil: 'networkidle0',
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
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Check for login form
    console.log('\n=== Step 2: Checking for login form ===');

    // Try multiple selectors for email input
    let emailInput = null;
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[id="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]'
    ];

    for (const selector of emailSelectors) {
      try {
        emailInput = await page.waitForSelector(selector, { timeout: 3000 });
        if (emailInput) {
          console.log(`Found email input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Try multiple selectors for password input
    let passwordInput = null;
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[id="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="Password" i]'
    ];

    for (const selector of passwordSelectors) {
      try {
        passwordInput = await page.waitForSelector(selector, { timeout: 3000 });
        if (passwordInput) {
          console.log(`Found password input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!emailInput || !passwordInput) {
      console.log('Login form not found, checking current page...');
      console.log(`Current URL: ${page.url()}`);
      await page.screenshot({ path: 'production-no-login-form.png' });

      // Check if we need to navigate to login
      if (!page.url().includes('/login')) {
        console.log('Not on login page, navigating to /login...');
        await page.goto('https://baitoai.netlify.app/login', {
          waitUntil: 'networkidle0',
          timeout: 30000
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Try to find inputs again
        emailInput = await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
        passwordInput = await page.waitForSelector('input[type="password"], input[name="password"]', { timeout: 5000 });
      }
    }

    // Step 3: Enter credentials
    console.log('\n=== Step 3: Entering credentials ===');
    console.log('Email: admin@example.com');
    console.log('Password: admin123!');

    await emailInput.click();
    await page.keyboard.type('admin@example.com');

    await passwordInput.click();
    await page.keyboard.type('admin123!');

    // Take screenshot before login
    await page.screenshot({
      path: 'production-02-credentials-entered.png',
      fullPage: true
    });
    console.log('Screenshot saved: production-02-credentials-entered.png');

    // Step 4: Click login button
    console.log('\n=== Step 4: Clicking login button ===');

    // Try multiple selectors for login button
    const loginButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
      'button:has-text("Submit")',
      'button[type="submit"]:not([disabled])',
      'input[type="submit"]'
    ];

    let loginButton = null;
    for (const selector of loginButtonSelectors) {
      try {
        loginButton = await page.$(selector);
        if (loginButton) {
          const isVisible = await loginButton.isIntersectingViewport();
          const isEnabled = await page.evaluate(el => !el.disabled, loginButton);
          if (isVisible && isEnabled) {
            console.log(`Found login button with selector: ${selector}`);
            break;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!loginButton) {
      // Fallback: look for any button with login-related text
      loginButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn =>
          /login|sign\s*in|submit/i.test(btn.textContent) && !btn.disabled
        );
      });
    }

    if (!loginButton || !(await loginButton.asElement())) {
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
    const urlHistory = [lastUrl];

    // Monitor for 20 seconds with checks every second
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const currentUrl = page.url();

      if (currentUrl !== lastUrl) {
        redirectCount++;
        console.log(`[${i+1}s] Redirect #${redirectCount}: ${lastUrl} -> ${currentUrl}`);
        urlHistory.push(currentUrl);
        lastUrl = currentUrl;

        // Check for redirect loop
        if (currentUrl.includes('/login') && i > 2) {
          console.log('⚠️  WARNING: Redirected back to login page!');
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
      const displayValue = value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : 'null';
      console.log(`  ${key}: ${displayValue}`);
    }

    // Step 7: Final status check
    console.log('\n=== Step 7: Final Status ===');
    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);
    console.log(`Total redirects: ${redirectCount}`);
    console.log(`URL History: ${urlHistory.join(' -> ')}`);

    if (finalUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: User is on dashboard');
      console.log('✅ Authentication appears to be working correctly!');
    } else if (finalUrl.includes('/login')) {
      console.log('❌ FAILURE: User is back on login page');
      console.log('❌ REDIRECT LOOP DETECTED - The issue persists on production!');
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
    console.log('You can interact with the page during this time.');
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