const { chromium } = require('playwright');

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
      
      // Try to login
      console.log('2. Attempting login...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Look for submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        console.log('✅ Login button clicked');
        
        // Wait for navigation or error
        await page.waitForTimeout(3000);
        
        // Check current URL
        const currentUrl = page.url();
        console.log('Current URL after login attempt:', currentUrl);
      }
    } else {
      console.log('⚠️ No login form found, app might already be logged in or has different UI');
    }
    
    // Check for any React errors
    const reactErrors = await page.locator('.error-boundary, [data-error], #error').count();
    if (reactErrors > 0) {
      console.error('❌ React error boundary triggered');
    } else {
      console.log('✅ No React error boundaries detected');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'app-test-screenshot.png' });
    console.log('📸 Screenshot saved as app-test-screenshot.png');
    
    // Get all console errors
    const errors = await page.evaluate(() => {
      return window.__errors || [];
    });
    
    if (errors.length > 0) {
      console.error('❌ JavaScript errors found:', errors);
    } else {
      console.log('✅ No JavaScript errors in console');
    }
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('Keep browser open for manual inspection...');
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testApp().catch(console.error);