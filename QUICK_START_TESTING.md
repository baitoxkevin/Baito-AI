# Quick Start: Testing Guide

**Time to Complete**: 5 minutes
**Goal**: Run your first automated tests

---

## 🚀 Run Tests Now

### 1. Run All Unit Tests
```bash
cd /Users/baito.kevin/Downloads/Baito-AI
npm run test:run
```

**Expected Output**:
```
✓ src/__tests__/unit/payroll-calculations.test.ts (30 tests)
✓ src/__tests__/unit/form-validation.test.ts (25 tests)
✓ src/__tests__/unit/date-calculations.test.ts (20 tests)

Test Files  3 passed (3)
     Tests  75 passed (75)
```

---

### 2. Run Tests in Watch Mode (Recommended for Development)
```bash
npm run test
```

This will:
- Watch for file changes
- Re-run tests automatically
- Show only changed tests

**Press `a`** to run all tests
**Press `q`** to quit

---

### 3. Run Tests with Coverage
```bash
npm run test:coverage
```

**Expected**: Coverage report showing 80%+ for business logic

---

### 4. Run Tests with UI
```bash
npm run test:ui
```

Opens a browser with interactive test UI at `http://localhost:51204`

---

## 📸 Capture Screenshots (Manual)

### Setup
1. Start dev server:
```bash
npm run dev
```

2. Open browser:
```
http://localhost:5173/login
```

### Screenshot Checklist

Following the user guide at `docs/user-guides/project-management-complete-guide.md`:

**Login & Dashboard** (4 screenshots)
- [ ] 001-login-page.png
- [ ] 002-dashboard-overview.png
- [ ] 003-month-selector.png
- [ ] 004-search-bar.png

**Project Creation** (9 screenshots)
- [ ] 005-new-project-button.png
- [ ] 006-project-info-step.png
- [ ] 007-event-details-step.png
- [ ] 008-location-step.png
- [ ] 009-schedule-step.png
- [ ] 010-staffing-step.png
- [ ] 011-advanced-settings.png
- [ ] 012-review-and-save.png
- [ ] 013-project-created.png

**... Continue through all 64 screenshots**

Save to: `docs/user-guides/screenshots/`

---

## 🔍 What the Tests Cover

### Unit Tests ✅ (Already Implemented)
- **Payroll Calculations**: Ensures salary calculations are accurate
- **Form Validation**: Checks required fields, email formats, date validation
- **Date Logic**: Working days, date ranges, conflict detection

### Integration Tests ✅ (Partially Implemented)
- **Project CRUD**: Create, read, update, delete projects in database
- **Staff Assignment**: (To be added)
- **Document Upload**: (To be added)

### E2E Tests ⏳ (To be Implemented)
- Complete user journeys through the application

---

## 🐛 If Tests Fail

### Common Issues

**Issue**: Import errors
```
Cannot find module '@/components/payroll-manager/utils'
```

**Fix**: Check import paths match your project structure

---

**Issue**: Supabase connection errors
```
Supabase credentials not found
```

**Fix**: Ensure `.env` file exists with:
```
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
```

---

**Issue**: Test timeouts
```
Test timed out after 5000ms
```

**Fix**: Increase timeout in test file:
```typescript
test('slow operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

---

## 📚 Learn More

- **Full Testing Strategy**: See `TESTING_FRAMEWORK_SUMMARY.md`
- **Test Design**: See `qa/assessments/1.1-test-design-20251004.md`
- **User Guide**: See `docs/user-guides/project-management-complete-guide.md`

---

## ✅ Next Steps

1. ✅ **Run tests** (`npm run test:run`)
2. ⏳ **Capture screenshots** (64 total)
3. ⏳ **Implement remaining integration tests**
4. ⏳ **Add E2E tests** (Playwright/Cypress)
5. ⏳ **Set up CI/CD** (GitHub Actions)

---

**Questions?** Check `TESTING_FRAMEWORK_SUMMARY.md` for detailed documentation.

**Ready to test!** 🎯
