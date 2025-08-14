import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    console.log('Navigating to application...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Check if we're on login page
    const isLoginPage = await page.locator('text=Welcome back').isVisible();
    
    if (isLoginPage) {
      console.log('On login page, attempting to log in...');
      
      // Try to find and fill login form with test credentials
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Click sign in button
      await page.click('button[type="submit"]');
      
      // Wait for navigation or error
      await page.waitForTimeout(3000);
      
      // Check if login was successful
      const loginError = await page.locator('text=Unable to sign in').isVisible();
      if (loginError) {
        console.log('Login failed, trying to navigate directly to candidates page...');
        await page.goto('http://localhost:5173/candidates', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
      } else {
        console.log('Login successful, navigating to candidates page...');
        await page.goto('http://localhost:5173/candidates', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
      }
    } else {
      // Already authenticated, navigate to candidates
      console.log('Already authenticated, navigating to candidates page...');
      await page.goto('http://localhost:5173/candidates', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
    }
    
    // Take screenshot of current page (whether login or candidates)
    await page.screenshot({ 
      path: 'candidates-page-final-screenshot.png',
      fullPage: true
    });
    
    const currentUrl = page.url();
    console.log(`Screenshot taken of: ${currentUrl}`);
    console.log('Screenshot saved as candidates-page-final-screenshot.png');
  } catch (error) {
    console.error('Error taking screenshot:', error);
    
    // Take screenshot of whatever is currently displayed
    await page.screenshot({ 
      path: 'candidates-page-error-screenshot.png',
      fullPage: true
    });
    console.log('Error screenshot saved as candidates-page-error-screenshot.png');
  } finally {
    await browser.close();
  }
})();