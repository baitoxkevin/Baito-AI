import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env.test (for testing) or .env (fallback)
dotenv.config({ path: '.env.test' });
dotenv.config(); // Fallback to .env if .env.test doesn't exist

/**
 * Environment configuration map
 * Extend this as you add more test environments
 */
const envConfigMap: Record<string, { baseURL: string; apiURL: string }> = {
  local: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    apiURL: process.env.API_URL || 'http://localhost:3000/api',
  },
  staging: {
    baseURL: process.env.STAGING_URL || 'https://staging.baito.events',
    apiURL: process.env.STAGING_API_URL || 'https://api-staging.baito.events',
  },
  production: {
    baseURL: process.env.PROD_URL || 'https://baito.events',
    apiURL: process.env.PROD_API_URL || 'https://api.baito.events',
  },
};

// Get current test environment (default to 'local')
const TEST_ENV = (process.env.TEST_ENV || 'local') as keyof typeof envConfigMap;

// Fail fast if environment is not configured
if (!envConfigMap[TEST_ENV]) {
  throw new Error(
    `Invalid TEST_ENV="${TEST_ENV}". Supported environments: ${Object.keys(envConfigMap).join(', ')}`
  );
}

const config = envConfigMap[TEST_ENV];

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Enable parallel execution - use 1 worker on CI, 4 workers locally */
  workers: process.env.CI ? 1 : 4,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'test-results/html', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: config.baseURL,

    /* Standardized timeouts */
    actionTimeout: 15_000, // 15 seconds for actions
    navigationTimeout: 30_000, // 30 seconds for page navigation

    /* Collect trace only on failure for debugging */
    trace: 'on-first-retry',

    /* Screenshot only on failure */
    screenshot: 'only-on-failure',

    /* Video only on failure */
    video: 'retain-on-failure',

    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'X-Test-Environment': TEST_ENV,
    },
  },

  /* Configure timeout for assertions */
  expect: {
    timeout: 10_000, // 10 seconds for expect assertions
  },

  /* Global test timeout */
  timeout: 60_000, // 60 seconds per test

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: TEST_ENV === 'local' ? {
    command: 'npm run dev',
    url: config.baseURL,
    reuseExistingServer: true, // Always reuse existing server
    timeout: 120_000,
  } : undefined,

  /* Output directory for test artifacts */
  outputDir: 'test-results/artifacts',
});
