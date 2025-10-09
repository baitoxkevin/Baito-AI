# Test Suite Quick Reference 🚀

**Updated**: 2025-10-07
**Total Tests**: 173

---

## ⚡ Quick Commands

### Most Common

```bash
# Run everything (recommended for pre-push)
npx playwright test --project=chromium --workers=4

# Run critical tests only (fast check)
npx playwright test tests/e2e/authentication-critical.spec.ts tests/e2e/payments-p0.spec.ts --project=chromium

# Run with UI (debugging)
npx playwright test --ui

# Run specific test file
npx playwright test tests/e2e/calendar-p1.spec.ts --project=chromium
```

### By Category

| Command | Tests | Time |
|---------|-------|------|
| `npx playwright test tests/e2e` | 94 E2E | ~5 min |
| `npx playwright test tests/visual` | 11 Visual | ~30s |
| `npx playwright test tests/accessibility` | 20 A11y | ~2 min |
| `npx playwright test tests/mobile` | 15 Mobile | ~2 min |
| `npx playwright test tests/performance` | 10 Perf | ~2 min |
| `npx playwright test tests/security` | 15 Security | ~2 min |

### By Priority

```bash
# P0 - Critical (27 tests)
npx playwright test tests/e2e/authentication-critical.spec.ts tests/e2e/payments-p0.spec.ts tests/unit/payment-calculations.spec.ts

# P1 - High (21 tests)
npx playwright test tests/e2e/*-p1.spec.ts

# P2 - Medium (28 tests)
npx playwright test tests/e2e/*-p2.spec.ts

# P3 - Low (18 tests)
npx playwright test tests/e2e/*-p3.spec.ts
```

### Cross-Browser

```bash
# All browsers (slow)
npx playwright test tests/e2e/authentication-critical.spec.ts

# Specific browser
npx playwright test --project=firefox
npx playwright test --project=webkit
```

---

## 📝 Test Tags

Use tags to run specific subsets:

```bash
# Visual regression only
npx playwright test --grep @visual

# Accessibility only
npx playwright test --grep @a11y

# Mobile only
npx playwright test --grep @mobile

# Performance only
npx playwright test --grep @performance

# Security only
npx playwright test --grep @security
```

---

## 🐛 Debugging

### View Results

```bash
# Open HTML report
npx playwright show-report

# Show trace viewer
npx playwright show-trace trace.zip
```

### Debug Mode

```bash
# Run with debugger
npx playwright test --debug

# Run headed (see browser)
npx playwright test --headed

# Slow motion
npx playwright test --headed --slow-mo=1000
```

### Single Test

```bash
# Run one test by name
npx playwright test -g "PAY-E2E-001"

# Run test on line 42
npx playwright test tests/e2e/payments-p0.spec.ts:42
```

---

## 📸 Visual Regression

### Update Baselines

```bash
# Update all visual baselines
npx playwright test tests/visual --update-snapshots

# Update specific page
npx playwright test tests/visual -g "Dashboard" --update-snapshots
```

### Compare

```bash
# Run comparison
npx playwright test tests/visual

# View differences
npx playwright show-report
```

---

## 🔧 Common Issues

### Issue: Tests Failing Locally

**Fix**:
```bash
# Clear test results
rm -rf test-results

# Update Playwright
npm install -D @playwright/test@latest

# Reinstall browsers
npx playwright install
```

### Issue: Visual Tests Failing

**Fix**:
```bash
# Regenerate baselines (if intentional UI changes)
npx playwright test tests/visual --update-snapshots

# Or increase tolerance in spec file:
maxDiffPixels: 200  # from 100
```

### Issue: Slow Tests

**Fix**:
```bash
# Run with more workers
npx playwright test --workers=8

# Or run specific priority only
npx playwright test tests/e2e/*-p0.spec.ts
```

---

## 📊 Test Structure

```
tests/
├── e2e/                    # End-to-end tests (94)
│   ├── *-critical.spec.ts  # P0 critical
│   ├── *-p0.spec.ts        # P0 business critical
│   ├── *-p1.spec.ts        # P1 high priority
│   ├── *-p2.spec.ts        # P2 medium priority
│   └── *-p3.spec.ts        # P3 low priority
├── unit/                   # Unit tests (8)
├── visual/                 # Visual regression (11)
├── accessibility/          # WCAG compliance (20)
├── mobile/                 # Responsive tests (15)
├── performance/            # Load time tests (10)
└── security/               # Security tests (15)
```

---

## 🎯 Test Priorities

| Priority | When to Run | Time | Tests |
|----------|-------------|------|-------|
| **P0** | Always (pre-push) | ~1 min | 27 |
| **P1** | Before PR | ~2 min | 21 |
| **P2** | Before merge | ~3 min | 28 |
| **P3** | Weekly/CI | ~1 min | 18 |
| **Visual** | After UI changes | ~30s | 11 |
| **A11y** | Before release | ~2 min | 20 |
| **Mobile** | Before release | ~2 min | 15 |

---

## 🚦 Pre-Push Checklist

```bash
# 1. Run critical tests
npx playwright test tests/e2e/authentication-critical.spec.ts tests/e2e/payments-p0.spec.ts --project=chromium

# 2. If you changed UI, run visual tests
npx playwright test tests/visual --project=chromium

# 3. Run linting
npm run lint

# 4. (Optional) Run full suite
npx playwright test --project=chromium --workers=4
```

---

## 📖 Documentation

| Doc | Purpose |
|-----|---------|
| `COMPLETE_TEST_INFRASTRUCTURE_SUMMARY.md` | Full overview |
| `VISUAL_REGRESSION_GUIDE.md` | Visual testing workflow |
| `RISK_ASSESSMENT_AND_TEST_PLAN.md` | Risk analysis & plan |
| `TEST_QUICK_REFERENCE.md` | This document |

---

## 🆘 Need Help?

### Common Commands

```bash
# List all tests
npx playwright test --list

# Show Playwright config
npx playwright show-config

# Generate code
npx playwright codegen

# Install missing browsers
npx playwright install
```

### Environment Variables

```bash
# Run in CI mode
CI=true npx playwright test

# Change base URL
PLAYWRIGHT_BASE_URL=https://staging.example.com npx playwright test

# Debug
DEBUG=pw:api npx playwright test
```

---

**Quick Tip**: Use `npx playwright test --ui` for the best debugging experience! 🎨
