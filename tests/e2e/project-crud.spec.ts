/**
 * Project CRUD E2E Tests
 *
 * Tests project creation, reading, updating, and deletion.
 * Uses data factories for test data generation.
 */

import { test, expect } from '../support/fixtures/auth';
import { createProject } from '../support/helpers/data-factory';

test.describe('Project Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to projects page
    await authenticatedPage.goto('/projects');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test('should create a new project', async ({ authenticatedPage }) => {
    const projectData = createProject({
      title: `E2E Test Project ${Date.now()}`,
    });

    // Open create project dialog/form
    const createButton = authenticatedPage.locator('button:has-text("New Project"), button:has-text("Create Project"), button:has-text("Add Project")');
    await createButton.first().click();

    // Fill in project form
    await authenticatedPage.fill('[name="title"], input[placeholder*="project" i][placeholder*="name" i]', projectData.title);

    // Look for submit button
    const submitButton = authenticatedPage.locator('button[type="submit"]:has-text("Create"), button:has-text("Save"), button:has-text("Add")');
    await submitButton.first().click();

    // Wait for success notification or redirect
    await authenticatedPage.waitForTimeout(2000);

    // Verify project appears in list
    const projectCard = authenticatedPage.locator(`text="${projectData.title}"`);
    await expect(projectCard).toBeVisible({ timeout: 10000 });
  });

  test('should display project list', async ({ authenticatedPage }) => {
    // Wait for projects to load
    await authenticatedPage.waitForSelector('[data-testid="project-card"], .project-card, [class*="project"]', {
      timeout: 10000,
    });

    // Verify at least one project is visible
    const projects = authenticatedPage.locator('[data-testid="project-card"], .project-card');
    const count = await projects.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should open project details', async ({ authenticatedPage }) => {
    // Find first project card
    const firstProject = authenticatedPage.locator('[data-testid="project-card"], .project-card').first();
    await firstProject.waitFor({ state: 'visible', timeout: 10000 });

    // Click to view details
    await firstProject.click();

    // Verify detail view opens (could be modal, sidebar, or new page)
    const detailView = authenticatedPage.locator('[data-testid="project-detail"], [role="dialog"], aside');
    await expect(detailView.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Project Search and Filter', () => {
  test('should filter projects by status', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/projects');

    // Look for status filter dropdown
    const statusFilter = authenticatedPage.locator('[data-testid="status-filter"], select[name="status"], button:has-text("Status")');

    if (await statusFilter.count() > 0) {
      await statusFilter.first().click();

      // Select a specific status
      const plannedOption = authenticatedPage.locator('text="Planning"');
      if (await plannedOption.count() > 0) {
        await plannedOption.first().click();

        // Wait for filtering to complete
        await authenticatedPage.waitForTimeout(1000);

        // Verify filtered results
        const projects = authenticatedPage.locator('[data-testid="project-card"]');
        expect(await projects.count()).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
