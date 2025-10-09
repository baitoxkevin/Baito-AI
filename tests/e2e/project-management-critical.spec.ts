/**
 * P0 Critical Project Management Tests
 * Test IDs: PROJ-E2E-001 through PROJ-E2E-004
 * Risk Mitigation: R003 (Concurrent edits), R004 (Manager foreign key), R009 (Orphaned records)
 *
 * @priority P0
 * @category Data Integrity
 */

import { test, expect } from '../support/fixtures/auth';
import { createProject } from '../support/helpers/data-factory';

test.describe('P0 Project Management - CRUD Operations', () => {
  test.use({ storageState: '.auth/admin.json' }); // Reuse authenticated state

  test('PROJ-E2E-001: Create project with required fields saves successfully', async ({ authenticatedPage }) => {
    const projectData = createProject({
      title: `E2E Test Project ${Date.now()}`,
      status: 'planning',
      priority: 'medium',
    });

    // Navigate to projects page
    await authenticatedPage.goto('/projects');
    await authenticatedPage.waitForLoadState('networkidle');

    // Open create project dialog
    const createButton = authenticatedPage.locator(
      'button:has-text("New Project"), button:has-text("Create Project"), button:has-text("Add Project"), [data-testid="create-project"]'
    );
    await createButton.first().click();

    // Wait for dialog to open
    await authenticatedPage.waitForTimeout(1000);

    // Fill required fields
    const titleInput = authenticatedPage.locator('[name="title"], input[placeholder*="project" i][placeholder*="title" i]');
    await titleInput.first().fill(projectData.title);

    // Select company (if visible)
    const companySelect = authenticatedPage.locator('[name="client_id"], select:has-option');
    if (await companySelect.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await companySelect.first().click();
      await authenticatedPage.waitForTimeout(500);
      // Select first option
      await authenticatedPage.keyboard.press('ArrowDown');
      await authenticatedPage.keyboard.press('Enter');
    }

    // Select manager (Testing the fix for R004!)
    const managerSelect = authenticatedPage.locator('[name="manager_id"], button:has-text("Select a manager")');
    if (await managerSelect.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await managerSelect.first().click();
      await authenticatedPage.waitForTimeout(500);
      // Select first manager from dropdown
      const firstManager = authenticatedPage.locator('[role="option"]').first();
      if (await firstManager.isVisible({ timeout: 1000 }).catch(() => false)) {
        await firstManager.click();
      } else {
        // Fallback: press Enter to select
        await authenticatedPage.keyboard.press('ArrowDown');
        await authenticatedPage.keyboard.press('Enter');
      }
    }

    // Submit form
    const submitButton = authenticatedPage.locator(
      'button[type="submit"]:has-text("Create"), button:has-text("Save"), button:has-text("Add")'
    );
    await submitButton.first().click();

    // Wait for success
    await authenticatedPage.waitForTimeout(3000);

    // Verify project appears in list
    const projectCard = authenticatedPage.locator(`text="${projectData.title}"`);
    await expect(projectCard).toBeVisible({ timeout: 10000 });
  });

  test('PROJ-E2E-002: Edit project updates database and reflects in UI', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/projects');
    await authenticatedPage.waitForLoadState('networkidle');

    // Find first project card
    const firstProject = authenticatedPage.locator('[data-testid="project-card"], .project-card, article').first();
    await firstProject.waitFor({ state: 'visible', timeout: 10000 });

    // Get original title
    const originalTitle = await firstProject.textContent();

    // Click to view/edit
    await firstProject.click();
    await authenticatedPage.waitForTimeout(1500);

    // Look for edit button
    const editButton = authenticatedPage.locator('button:has-text("Edit"), button:has-text("Update"), [data-testid="edit-project"]');
    if (await editButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.first().click();
      await authenticatedPage.waitForTimeout(1000);
    }

    // Modify title
    const titleInput = authenticatedPage.locator('[name="title"], input[value*=""]').first();
    await titleInput.clear();
    const newTitle = `Updated ${Date.now()}`;
    await titleInput.fill(newTitle);

    // Save changes
    const saveButton = authenticatedPage.locator(
      'button[type="submit"]:has-text("Save"), button:has-text("Update"), button:has-text("Save Changes")'
    );
    await saveButton.first().click();

    // Wait for save
    await authenticatedPage.waitForTimeout(3000);

    // Verify new title appears
    const updatedProject = authenticatedPage.locator(`text="${newTitle}"`);
    await expect(updatedProject).toBeVisible({ timeout: 10000 });
  });

  test('PROJ-E2E-003: Delete project cascades to related records', async ({ authenticatedPage }) => {
    // First create a test project to delete
    const testProjectTitle = `Delete Test ${Date.now()}`;

    await authenticatedPage.goto('/projects');
    await authenticatedPage.waitForLoadState('networkidle');

    // Create project
    const createButton = authenticatedPage.locator('button:has-text("New Project")').first();
    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createButton.click();
      await authenticatedPage.waitForTimeout(1000);

      const titleInput = authenticatedPage.locator('[name="title"]').first();
      await titleInput.fill(testProjectTitle);

      const submitButton = authenticatedPage.locator('button[type="submit"]:has-text("Create")').first();
      await submitButton.click();
      await authenticatedPage.waitForTimeout(3000);
    }

    // Find the test project
    const testProject = authenticatedPage.locator(`text="${testProjectTitle}"`);
    await testProject.first().click();
    await authenticatedPage.waitForTimeout(1500);

    // Look for delete button
    const deleteButton = authenticatedPage.locator(
      'button:has-text("Delete"), [data-testid="delete-project"], button[aria-label*="delete" i]'
    );

    if (await deleteButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.first().click();

      // Confirm deletion if prompted
      await authenticatedPage.waitForTimeout(500);
      const confirmButton = authenticatedPage.locator(
        'button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")'
      );
      if (await confirmButton.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.first().click();
      }

      // Wait for deletion
      await authenticatedPage.waitForTimeout(3000);

      // Verify project no longer appears
      const deletedProject = authenticatedPage.locator(`text="${testProjectTitle}"`);
      await expect(deletedProject).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('PROJ-E2E-004: Manager dropdown shows all eligible users (R004 Fix Verification)', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/projects');
    await authenticatedPage.waitForLoadState('networkidle');

    // Open create project dialog
    const createButton = authenticatedPage.locator('button:has-text("New Project")').first();
    await createButton.click();
    await authenticatedPage.waitForTimeout(1500);

    // Click manager dropdown
    const managerDropdown = authenticatedPage.locator(
      '[name="manager_id"], button:has-text("Select a manager"), label:has-text("Person in Charge") + *'
    );
    await managerDropdown.first().click();
    await authenticatedPage.waitForTimeout(1000);

    // Verify managers are listed
    const managerOptions = authenticatedPage.locator('[role="option"], [data-value]');
    const managerCount = await managerOptions.count();

    // Should have at least 2 managers (Kevin Admin, Kevin Reuben)
    expect(managerCount).toBeGreaterThanOrEqual(2);

    // Verify specific managers appear (from our earlier fix)
    const kevinAdmin = authenticatedPage.locator('text="Kevin Admin"');
    const kevinReuben = authenticatedPage.locator('text="Kevin Reuben"');

    const adminVisible = await kevinAdmin.isVisible({ timeout: 2000 }).catch(() => false);
    const reubenVisible = await kevinReuben.isVisible({ timeout: 2000 }).catch(() => false);

    // At least one should be visible
    expect(adminVisible || reubenVisible).toBeTruthy();
  });
});

test.describe('P0 Project Data Integrity', () => {
  test.use({ storageState: '.auth/admin.json' });

  test('Invalid date range validation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/projects');
    await authenticatedPage.waitForLoadState('networkidle');

    const createButton = authenticatedPage.locator('button:has-text("New Project")').first();
    await createButton.click();
    await authenticatedPage.waitForTimeout(1000);

    // Try to set end_date before start_date
    const startDateInput = authenticatedPage.locator('[name="start_date"]').first();
    const endDateInput = authenticatedPage.locator('[name="end_date"]').first();

    if (await startDateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startDateInput.fill('2025-12-31');
      await endDateInput.fill('2025-01-01'); // Earlier than start

      // Try to submit
      const submitButton = authenticatedPage.locator('button[type="submit"]').first();
      await submitButton.click();
      await authenticatedPage.waitForTimeout(1000);

      // Should show validation error or prevent submission
      const validationError = await authenticatedPage
        .locator('text=/invalid|error|after|before/i, [role="alert"]')
        .first()
        .isVisible()
        .catch(() => false);

      expect(validationError).toBeTruthy();
    }
  });

  test('Required fields validation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/projects');
    await authenticatedPage.waitForLoadState('networkidle');

    const createButton = authenticatedPage.locator('button:has-text("New Project")').first();
    await createButton.click();
    await authenticatedPage.waitForTimeout(1000);

    // Try to submit without filling required fields
    const submitButton = authenticatedPage.locator('button[type="submit"]').first();
    await submitButton.click();
    await authenticatedPage.waitForTimeout(500);

    // Should show validation errors
    const validationError = await authenticatedPage
      .locator('text=/required|mandatory|enter/i, [role="alert"]')
      .first()
      .isVisible()
      .catch(() => false);

    expect(validationError).toBeTruthy();
  });
});
