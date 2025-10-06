# Test Levels Framework

## Purpose
Define clear criteria for choosing the appropriate test level (Unit, Integration, E2E) to ensure efficient test coverage without redundancy.

## Test Level Decision Tree

```
┌─────────────────────────────────────────────────┐
│ What are you testing?                           │
└─────────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   Pure Logic?              Interactions?
   Calculations?            Database ops?
   Validations?             API calls?
        │                         │
        ▼                         ▼
    UNIT TEST              INTEGRATION TEST

                         Critical User Journey?
                         Compliance required?
                         Revenue critical?
                                 │
                                 ▼
                            E2E TEST
```

## Unit Tests

### When to Use
- **Pure functions** with deterministic outputs
- **Business logic** calculations (salaries, totals, dates)
- **Input validation** (form field validation, data format checks)
- **Utility functions** (formatters, parsers, converters)
- **Component rendering** (isolated UI component behavior)

### Characteristics
- ✅ Fast execution (< 50ms per test)
- ✅ No external dependencies (DB, APIs, file system)
- ✅ Highly isolated and independent
- ✅ Easy to debug failures
- ✅ Can run thousands in seconds

### Examples
```javascript
// ✅ UNIT TEST - Pure calculation
test('calculateTotalPayroll sums all staff salaries correctly', () => {
  const staff = [
    { salary: 100, days: 5 },
    { salary: 150, days: 3 }
  ];
  expect(calculateTotalPayroll(staff)).toBe(950);
});

// ✅ UNIT TEST - Validation logic
test('validateEmail rejects invalid email formats', () => {
  expect(validateEmail('invalid')).toBe(false);
  expect(validateEmail('user@example.com')).toBe(true);
});

// ❌ NOT A UNIT TEST - Has DB dependency
test('saveProject persists to database', async () => {
  await saveProject({ title: 'Test' });
  const saved = await getProject();
  expect(saved.title).toBe('Test');
});
```

### Coverage Target
- 80%+ for business logic
- 90%+ for critical calculations (payroll, financial)
- 70%+ for utility functions

---

## Integration Tests

### When to Use
- **Multi-component interactions** (form submission → state update → UI refresh)
- **Database operations** (CRUD operations, queries, relationships)
- **API endpoints** (request → processing → response)
- **Service layer** (business logic that touches DB/APIs)
- **State management** (Redux/Zustand actions with side effects)
- **Authentication flows** (login → session → protected routes)

### Characteristics
- ⚖️ Moderate execution time (100ms - 2s per test)
- ⚖️ Requires test database or mocked APIs
- ⚖️ Tests real integration points
- ⚖️ More complex setup/teardown
- ⚖️ Tests component contracts

### Examples
```javascript
// ✅ INTEGRATION TEST - Component + Database
test('StaffingTab adds staff member to database', async () => {
  render(<StaffingTab projectId="123" />);

  await userEvent.click(screen.getByText('Add Staff'));
  await userEvent.type(screen.getByLabelText('Name'), 'John Doe');
  await userEvent.click(screen.getByText('Save'));

  const staffInDB = await supabase
    .from('project_staff')
    .select('*')
    .eq('project_id', '123');

  expect(staffInDB.data).toHaveLength(1);
  expect(staffInDB.data[0].name).toBe('John Doe');
});

// ✅ INTEGRATION TEST - API endpoint
test('POST /api/projects creates project in database', async () => {
  const response = await request(app)
    .post('/api/projects')
    .send({ title: 'New Project', client_id: '456' });

  expect(response.status).toBe(201);

  const project = await db.query('SELECT * FROM projects WHERE id = ?', [response.body.id]);
  expect(project.title).toBe('New Project');
});
```

### Coverage Target
- 70%+ for service layer functions
- 90%+ for critical data operations (payments, staff assignments)
- 60%+ for component interactions

---

## End-to-End (E2E) Tests

### When to Use
- **Critical user journeys** (complete workflows from start to finish)
- **Revenue-critical paths** (payment flows, project creation → invoicing)
- **Compliance requirements** (audit trails, security flows)
- **Cross-system integration** (external APIs, payment gateways)
- **User acceptance scenarios** (happy path + critical error paths)

### Characteristics
- ⏱️ Slow execution (5s - 30s per test)
- ⏱️ Tests entire stack (UI → API → DB)
- ⏱️ Brittle (UI changes break tests)
- ⏱️ Expensive to maintain
- ⏱️ Provides highest confidence

### Examples
```javascript
// ✅ E2E TEST - Complete user journey
test('User creates project, adds staff, and generates invoice', async () => {
  await page.goto('/projects');

  // Create project
  await page.click('button:has-text("New Project")');
  await page.fill('[name="title"]', 'Summer Festival 2025');
  await page.selectOption('[name="client_id"]', 'ABC Corp');
  await page.click('button:has-text("Save")');

  // Add staff
  await page.click('text=Staffing');
  await page.click('button:has-text("Add Staff")');
  await page.selectOption('[name="staff_id"]', 'John Doe');
  await page.click('button:has-text("Confirm")');

  // Generate invoice
  await page.click('text=Export');
  await page.click('button:has-text("Generate Invoice")');

  // Verify invoice downloaded
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('invoice');
});

// ✅ E2E TEST - Authentication flow
test('User logs in and accesses protected dashboard', async () => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button:has-text("Login")');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

### Coverage Target
- **P0 journeys**: 100% (must have E2E tests)
- **P1 journeys**: 80% (should have E2E tests)
- **P2 journeys**: 30% (nice to have)
- **P3 journeys**: 0% (skip E2E, use integration instead)

---

## Decision Matrix

| Scenario | Level | Justification |
|----------|-------|---------------|
| Calculate total payroll from staff data | Unit | Pure calculation, no dependencies |
| Validate project form inputs | Unit | Pure validation logic |
| Save project to database | Integration | Tests DB operation |
| Staff member applies to project → status updates → notification sent | Integration | Multi-component flow within system |
| User creates project → adds staff → exports details → generates invoice | E2E | Critical business journey spanning multiple features |
| Login → Session created → Redirect to dashboard | E2E | Security-critical authentication flow |
| Date picker component renders correctly | Unit | Isolated UI component |
| Date picker selection updates parent form state | Integration | Component interaction |

---

## Anti-Patterns to Avoid

### ❌ Over-Testing with E2E
```javascript
// DON'T - E2E test for simple validation
test('Email field shows error for invalid email', async () => {
  await page.fill('[name="email"]', 'invalid');
  await expect(page.locator('.error')).toBeVisible();
});

// DO - Unit test instead
test('validateEmail returns false for invalid format', () => {
  expect(validateEmail('invalid')).toBe(false);
});
```

### ❌ Duplicate Coverage
```javascript
// DON'T - Test same logic at multiple levels
// Unit test
test('calculateTotal adds values', () => { ... });

// Integration test
test('form submit calculates total', () => { ... });

// E2E test
test('user sees calculated total on screen', () => { ... });

// DO - Test once at the right level
// Unit test for calculation
test('calculateTotal adds values', () => { ... });

// E2E test only for critical user journey
test('user completes checkout and sees final total', () => { ... });
```

### ❌ Integration Tests That Should Be Unit
```javascript
// DON'T - Mock everything in integration test
test('processPayment calls payment service', () => {
  const mockPaymentService = jest.fn();
  const result = processPayment(mockPaymentService, data);
  expect(mockPaymentService).toHaveBeenCalled();
});

// DO - This is a unit test
test('processPayment calls payment service with correct data', () => {
  const mockPaymentService = jest.fn();
  processPayment(mockPaymentService, { amount: 100 });
  expect(mockPaymentService).toHaveBeenCalledWith({ amount: 100 });
});
```

---

## Quick Reference Guide

**Start with this question:** *"What is the smallest test that gives me confidence this works?"*

| Test Level | Speed | Cost | Confidence | Use For |
|------------|-------|------|------------|---------|
| Unit | ⚡⚡⚡ Fast | 💰 Low | 🔒 Logic correctness | Calculations, validations, pure functions |
| Integration | ⚡⚡ Medium | 💰💰 Medium | 🔒🔒 Component contracts | DB ops, API calls, component interactions |
| E2E | ⚡ Slow | 💰💰💰 High | 🔒🔒🔒 User flows | Critical journeys, compliance, revenue paths |

**Golden Rule:** Test each behavior **once** at the **lowest level** that gives you confidence.

---

## Framework Version
**Version:** 1.0
**Last Updated:** 2025-10-04
**Owner:** Quinn (Test Architect)
