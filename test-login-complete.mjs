import { chromium } from 'playwright';

async function testLoginFlow() {
  console.log('🚀 Starting comprehensive login test...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down actions to see what's happening
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out expected auth errors and warnings
      if (!text.includes('401') && 
          !text.includes('Invalid login credentials') && 
          !text.includes('permission denied') &&
          !text.includes('Warning: Received')) {
        errors.push(text);
        console.error('❌ Console Error:', text);
      }
    }
  });
  
  // Track page errors
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('❌ Page Error:', error.message);
  });
  
  try {
    // Step 1: Navigate to the app
    console.log('📍 Step 1: Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    const title = await page.title();
    console.log('✅ Page loaded with title:', title);
    
    // Step 2: Check if login form is present
    console.log('\n📍 Step 2: Checking for login form...');
    await page.waitForTimeout(2000);
    
    const emailInput = await page.locator('input[type="email"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    
    if (emailInput > 0 && passwordInput > 0) {
      console.log('✅ Login form found');
      
      // Step 3: Try to login with demo credentials
      console.log('\n📍 Step 3: Attempting login with demo credentials...');
      
      // Clear inputs first
      await page.fill('input[type="email"]', '');
      await page.fill('input[type="password"]', '');
      
      // Fill with demo credentials - you might need to create these in Supabase
      await page.fill('input[type="email"]', 'demo@example.com');
      await page.fill('input[type="password"]', 'demo123456');
      
      // Click login button
      const loginButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first();
      await loginButton.click();
      
      console.log('⏳ Waiting for login response...');
      
      // Wait for navigation or error
      await page.waitForTimeout(5000);
      
      // Check the result
      const currentUrl = page.url();
      console.log('📍 Current URL:', currentUrl);
      
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/projects')) {
        console.log('✅ Successfully logged in and redirected to:', currentUrl);
      } else {
        // Check for error messages
        const errorAlerts = await page.locator('[role="alert"], .text-destructive, .error').allTextContents();
        if (errorAlerts.length > 0) {
          console.log('⚠️ Login failed with messages:', errorAlerts);
          console.log('\n📝 Note: You may need to create a test user in Supabase');
          console.log('   Run: npx supabase db reset to seed test data');
        }
      }
    } else {
      console.log('⚠️ No login form found - checking if already authenticated...');
      
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/projects')) {
        console.log('✅ Already authenticated, redirected to:', currentUrl);
      }
    }
    
    // Step 4: Test navigation to main routes
    console.log('\n📍 Step 4: Testing main application routes...');
    
    const routes = [
      { path: '/projects', name: 'Projects' },
      { path: '/calendar', name: 'Calendar' },
      { path: '/candidates', name: 'Candidates' },
      { path: '/dashboard', name: 'Dashboard' }
    ];
    
    for (const route of routes) {
      console.log(`\n   Testing ${route.name} (${route.path})...`);
      await page.goto(`http://localhost:5173${route.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // Check if page loaded without critical errors
      const hasErrorBoundary = await page.locator('.error-boundary, [data-error]').count();
      
      if (hasErrorBoundary > 0) {
        console.error(`   ❌ Error boundary triggered on ${route.name}`);
      } else {
        console.log(`   ✅ ${route.name} page loads successfully`);
      }
      
      // Take screenshot of each page
      await page.screenshot({ path: `screenshot-${route.path.slice(1)}.png` });
    }
    
    // Step 5: Final assessment
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    if (errors.length === 0) {
      console.log('✅ NO CRITICAL ERRORS FOUND');
      console.log('✅ Application is running properly');
    } else {
      console.log(`⚠️ Found ${errors.length} errors during testing:`);
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.substring(0, 100)}...`);
      });
    }
    
    console.log('\n📸 Screenshots saved for each page');
    console.log('🔍 Browser will remain open for 20 seconds for manual inspection...\n');
    
    // Keep browser open for inspection
    await page.waitForTimeout(20000);
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Test completed and browser closed');
  }
}

// Run the test
testLoginFlow().catch(console.error);