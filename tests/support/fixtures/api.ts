/**
 * API Testing Fixture
 *
 * Provides API request context with authentication and helpers.
 * Framework-agnostic HTTP helpers that can be unit tested.
 */

import { test as base, APIRequestContext } from '@playwright/test';

type APIFixtures = {
  apiContext: APIRequestContext;
  apiHelpers: ReturnType<typeof createAPIHelpers>;
};

/**
 * Pure API helper functions
 * These can be tested independently and reused across different test frameworks
 */
export function createAPIHelpers(request: APIRequestContext, baseURL: string) {
  const apiURL = process.env.API_URL || baseURL;

  return {
    /**
     * Create a new project via API
     */
    async createProject(projectData: Record<string, unknown>, token?: string) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await request.post(`${apiURL}/projects`, {
        data: projectData,
        headers,
      });

      if (!response.ok()) {
        throw new Error(`Failed to create project: ${response.status()} ${await response.text()}`);
      }

      return response.json();
    },

    /**
     * Delete a project by ID
     */
    async deleteProject(projectId: string, token?: string) {
      const headers: Record<string, string> = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await request.delete(`${apiURL}/projects/${projectId}`, { headers });

      if (!response.ok()) {
        throw new Error(`Failed to delete project: ${response.status()}`);
      }

      return response.ok();
    },

    /**
     * Get user profile
     */
    async getUserProfile(userId: string, token?: string) {
      const headers: Record<string, string> = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await request.get(`${apiURL}/users/${userId}`, { headers });

      if (!response.ok()) {
        throw new Error(`Failed to get user profile: ${response.status()}`);
      }

      return response.json();
    },
  };
}

/**
 * Extended test with API fixtures
 */
export const test = base.extend<APIFixtures>({
  apiContext: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:5173',
      extraHTTPHeaders: {
        'Accept': 'application/json',
      },
    });

    await use(context);
    await context.dispose();
  },

  apiHelpers: async ({ apiContext }, use) => {
    const baseURL = process.env.BASE_URL || 'http://localhost:5173';
    const helpers = createAPIHelpers(apiContext, baseURL);

    await use(helpers);
  },
});

export { expect } from '@playwright/test';
