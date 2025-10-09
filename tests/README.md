# Baito AI - E2E Testing Guide

Comprehensive end-to-end testing infrastructure built with Playwright.

## 🚀 Quick Start

### Prerequisites

- Node.js v22.7.3+ (see `.nvmrc`)
- npm or yarn
- A running local development server (or access to staging/production environments)

### Installation

```bash
# Install dependencies (Playwright is already in package.json)
npm install

# Install Playwright browsers
npx playwright install
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env.test

# Edit .env.test with your test credentials
# Set TEST_ENV, BASE_URL, API_URL, and test user credentials
```

### Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium

# Run tests with specific tag
npx playwright test --grep @smoke
```

## 📁 Project Structure

```
tests/
├── e2e/                      # End-to-end test specs
│   ├── example.spec.ts       # Basic navigation tests
│   ├── auth.spec.ts          # Authentication flows
│   └── project-crud.spec.ts  # Project CRUD operations
├── support/
│   ├── fixtures/             # Playwright fixtures
│   │   ├── auth.ts           # Authentication fixture
│   │   └── api.ts            # API testing fixture
│   └── helpers/              # Test helpers
│       └── data-factory.ts   # Test data generators
└── README.md                 # This file
```

## 🧪 Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Baito/);
});
```

### Using Authentication Fixture

```typescript
import { test, expect } from '../support/fixtures/auth';

test('protected route', async ({ authenticatedPage }) => {
  // authenticatedPage is already logged in
  await authenticatedPage.goto('/dashboard');
  await expect(authenticatedPage).toHaveURL(/dashboard/);
});
```

### Using Data Factories

```typescript
import { createProject } from '../support/helpers/data-factory';

test('create project', async ({ page }) => {
  const projectData = createProject({
    title: 'My Custom Project',
    status: 'planning',
  });

  // Use projectData in your test...
});
```

## 🎯 Best Practices

### 1. Use Data Attributes for Selectors

```typescript
// ✅ Good - stable selector
await page.click('[data-testid="create-project-button"]');

// ❌ Avoid - brittle selector
await page.click('.btn-primary');
```

### 2. Wait for Network Idle

```typescript
await page.goto('/projects');
await page.waitForLoadState('networkidle');
```

### 3. Use Fixtures for Reusable Setup

```typescript
// Define in tests/support/fixtures/my-fixture.ts
export const test = base.extend<MyFixtures>({
  myFixture: async ({}, use) => {
    // Setup
    const resource = await setup();
    await use(resource);
    // Teardown
    await cleanup(resource);
  },
});
```

### 4. Parallel-Safe Test Data

```typescript
// ✅ Good - unique identifiers
const project = createProject({
  title: `Test Project ${Date.now()}`,
});

// ❌ Avoid - hardcoded data
const project = { title: 'Test Project' };
```

## 🌍 Testing Environments

Configure via `TEST_ENV` in `.env.test`:

- **local**: `http://localhost:5173` (default)
- **staging**: `https://staging.baito.events`
- **production**: `https://baito.events` (use with caution!)

## 📊 Test Reports

After running tests:

```bash
# Open HTML report
npx playwright show-report

# JUnit XML reports available at:
# test-results/junit.xml
```

## 🔧 Configuration

See `playwright.config.ts` for:

- Timeout settings (action: 15s, navigation: 30s, test: 60s)
- Browser configurations
- Retry policies (2 retries on CI)
- Reporter settings (HTML + JUnit)
- Screenshot/video capture (failure-only)

## 🐛 Debugging

### Visual Debugging

```bash
# Open Playwright Inspector
npx playwright test --debug

# Run with trace viewer
npx playwright test --trace on
npx playwright show-trace trace.zip
```

### Console Logs

```typescript
test('debug test', async ({ page }) => {
  page.on('console', msg => console.log('Browser:', msg.text()));
  await page.goto('/');
});
```

### Screenshots

```typescript
test('take screenshot', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: 'screenshot.png' });
});
```

## 🚦 CI/CD Integration

Tests are configured for CI with:

- Retry on failure (2 retries)
- JUnit XML reports for CI dashboards
- Failure screenshots/videos
- Headless execution

Example GitHub Actions:

```yaml
- name: Run Playwright tests
  run: npm run test:e2e
  env:
    TEST_ENV: staging
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

## 🆘 Troubleshooting

### Tests Timing Out

- Increase timeouts in `playwright.config.ts`
- Check network connectivity
- Verify app is running

### Flaky Tests

- Use `waitForLoadState('networkidle')`
- Add explicit waits with `waitForSelector`
- Check for race conditions
- Review test isolation

### Authentication Issues

- Verify `.env.test` credentials
- Check Supabase configuration
- Ensure test user exists in database

---

**Built with ❤️ by the Baito Team**
