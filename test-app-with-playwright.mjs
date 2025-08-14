import { chromium } from 'playwright';

async function testApp() {
  console.log('Starting browser test...');
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ Console Error:', msg.text());
    }
  });
  
  // Track uncaught exceptions
  page.on('pageerror', error => {
    console.error('❌ Page Error:', error.message);
  });
  
  try {
    console.log('1. Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Check if page loaded successfully
    const title = await page.title();
    console.log('✅ Page loaded with title:', title);
    
    // Wait for React app to mount
    await page.waitForTimeout(2000);
    
    // Check for login form
    const emailInput = await page.locator('input[type="email"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    
    if (emailInput > 0 && passwordInput > 0) {
      console.log('✅ Login form found');
      
      // Try to login with test credentials
      console.log('2. Attempting login...');
      await page.fill('input[type="email"]', 'kevin@baito.ai');
      await page.fill('input[type="password"]', 'password123');
      
      // Look for submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        console.log('✅ Login button clicked');
        
        // Wait for navigation or error
        await page.waitForTimeout(5000);
        
        // Check current URL
        const currentUrl = page.url();
        console.log('Current URL after login attempt:', currentUrl);
        
        // Check if we're redirected to dashboard
        if (currentUrl.includes('/dashboard') || currentUrl.includes('/projects')) {
          console.log('✅ Successfully logged in and redirected');
        } else if (currentUrl === 'http://localhost:5173/') {
          // Check for error messages
          const errorMessages = await page.locator('.error, [role="alert"], .text-destructive').allTextContents();
          if (errorMessages.length > 0) {
            console.log('⚠️ Login errors:', errorMessages);
          }
        }
      }
    } else {
      console.log('⚠️ No login form found, checking if already logged in...');
      
      // Check if we're on a dashboard or main app page
      const mainContent = await page.locator('main, [role="main"], .dashboard, .projects').count();
      if (mainContent > 0) {
        console.log('✅ App appears to be loaded and running');
      }
    }
    
    // Check for any React errors
    const reactErrors = await page.locator('.error-boundary, [data-error], #error').count();
    if (reactErrors > 0) {
      console.error('❌ React error boundary triggered');
    } else {
      console.log('✅ No React error boundaries detected');
    }
    
    // Check console for specific errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to different pages to check for errors
    const routes = ['/projects', '/calendar', '/candidates', '/dashboard'];
    for (const route of routes) {
      console.log(`\nTesting route: ${route}`);
      await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const hasErrors = await page.evaluate(() => {
        const errorElement = document.querySelector('.error-boundary, [data-error]');
        return errorElement !== null;
      });
      
      if (hasErrors) {
        console.error(`❌ Error on route ${route}`);
      } else {
        console.log(`✅ Route ${route} loads without errors`);
      }
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'app-test-screenshot.png' });
    console.log('\n📸 Screenshot saved as app-test-screenshot.png');
    
    if (consoleErrors.length > 0) {
      console.error('\n❌ Console errors found:', consoleErrors);
    } else {
      console.log('\n✅ No JavaScript errors in console');
    }
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('Browser will remain open for 30 seconds for manual inspection...');
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testApp().catch(console.error);