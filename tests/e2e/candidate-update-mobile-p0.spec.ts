/**
 * Candidate Mobile Update - Critical Path (P0)
 *
 * Tests the secure mobile candidate update flow including:
 * - Email uniqueness handling (bug fix verification)
 * - Secure token validation
 * - Form data persistence
 * - PDPA consent flow
 *
 * Priority: P0 (Critical - Blocks production use)
 * Execution Time Target: < 90 seconds
 */

import { test, expect } from '@playwright/test';
import { supabase } from '../../src/lib/supabase';
import crypto from 'crypto';

// Test data factory
interface TestCandidate {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string;
  secure_token: string;
  token_expires_at: string;
}

async function createTestCandidate(overrides?: Partial<TestCandidate>): Promise<TestCandidate> {
  const candidateId = crypto.randomUUID();
  const secureToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

  const candidate: TestCandidate = {
    id: candidateId,
    full_name: `Test Candidate ${Date.now()}`,
    email: null, // Start with null email to test the bug fix
    phone_number: '+60123456789',
    secure_token: secureToken,
    token_expires_at: tokenExpiresAt,
    ...overrides
  };

  // Insert test candidate into database
  const { error } = await supabase
    .from('candidates')
    .insert({
      id: candidate.id,
      full_name: candidate.full_name,
      email: candidate.email,
      phone_number: candidate.phone_number,
      secure_update_token: candidate.secure_token,
      secure_update_token_expires_at: candidate.token_expires_at,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to create test candidate: ${error.message}`);
  }

  return candidate;
}

async function cleanupTestCandidate(candidateId: string) {
  await supabase
    .from('candidates')
    .delete()
    .eq('id', candidateId);
}

test.describe('Candidate Mobile Update - Critical Path', () => {

  test.describe('Email Uniqueness Handling', () => {

    test('should save candidate with empty email as null (Bug Fix Verification)', async ({ page }) => {
      const candidate = await createTestCandidate();

      try {
        // Navigate to mobile update page
        await page.goto(`/candidate-update-mobile/${candidate.id}?secure_token=${candidate.secure_token}`);

        // Wait for page to load
        await expect(page.getByText('Update Your Profile')).toBeVisible({ timeout: 10000 });

        // Fill required fields but leave email empty
        await page.fill('[name="full_name"]', candidate.full_name);
        await page.fill('[name="phone_number"]', candidate.phone_number);

        // Submit the form
        await page.click('button[type="submit"]');

        // Wait for success message
        await expect(page.getByText('Profile Updated')).toBeVisible({ timeout: 10000 });

        // Verify email is stored as null in database
        const { data, error } = await supabase
          .from('candidates')
          .select('email')
          .eq('id', candidate.id)
          .single();

        expect(error).toBeNull();
        expect(data?.email).toBeNull();

      } finally {
        await cleanupTestCandidate(candidate.id);
      }
    });

    test('should convert whitespace-only email to null', async ({ page }) => {
      const candidate = await createTestCandidate();

      try {
        await page.goto(`/candidate-update-mobile/${candidate.id}?secure_token=${candidate.secure_token}`);
        await expect(page.getByText('Update Your Profile')).toBeVisible({ timeout: 10000 });

        // Fill with whitespace-only email
        await page.fill('[name="email"]', '   ');
        await page.fill('[name="full_name"]', candidate.full_name);
        await page.fill('[name="phone_number"]', candidate.phone_number);

        await page.click('button[type="submit"]');
        await expect(page.getByText('Profile Updated')).toBeVisible({ timeout: 10000 });

        // Verify email is null
        const { data } = await supabase
          .from('candidates')
          .select('email')
          .eq('id', candidate.id)
          .single();

        expect(data?.email).toBeNull();

      } finally {
        await cleanupTestCandidate(candidate.id);
      }
    });

    test('should save valid email correctly', async ({ page }) => {
      const candidate = await createTestCandidate();
      const testEmail = `test-${Date.now()}@example.com`;

      try {
        await page.goto(`/candidate-update-mobile/${candidate.id}?secure_token=${candidate.secure_token}`);
        await expect(page.getByText('Update Your Profile')).toBeVisible({ timeout: 10000 });

        await page.fill('[name="email"]', testEmail);
        await page.fill('[name="full_name"]', candidate.full_name);
        await page.fill('[name="phone_number"]', candidate.phone_number);

        await page.click('button[type="submit"]');
        await expect(page.getByText('Profile Updated')).toBeVisible({ timeout: 10000 });

        // Verify email is saved correctly
        const { data } = await supabase
          .from('candidates')
          .select('email')
          .eq('id', candidate.id)
          .single();

        expect(data?.email).toBe(testEmail);

      } finally {
        await cleanupTestCandidate(candidate.id);
      }
    });

    test('should handle duplicate email gracefully', async ({ page }) => {
      // Create first candidate with an email
      const existingEmail = `existing-${Date.now()}@example.com`;
      const candidate1 = await createTestCandidate({ email: existingEmail });
      const candidate2 = await createTestCandidate();

      try {
        // Try to update second candidate with the same email
        await page.goto(`/candidate-update-mobile/${candidate2.id}?secure_token=${candidate2.secure_token}`);
        await expect(page.getByText('Update Your Profile')).toBeVisible({ timeout: 10000 });

        await page.fill('[name="email"]', existingEmail);
        await page.fill('[name="full_name"]', candidate2.full_name);
        await page.fill('[name="phone_number"]', candidate2.phone_number);

        await page.click('button[type="submit"]');

        // Should show error message about duplicate email
        await expect(page.getByText(/duplicate|already exists|unique/i)).toBeVisible({ timeout: 10000 });

      } finally {
        await cleanupTestCandidate(candidate1.id);
        await cleanupTestCandidate(candidate2.id);
      }
    });
  });

  test.describe('Secure Token Validation', () => {

    test('should reject expired token', async ({ page }) => {
      const expiredToken = new Date(Date.now() - 1000).toISOString(); // Expired 1 second ago
      const candidate = await createTestCandidate({ token_expires_at: expiredToken });

      try {
        await page.goto(`/candidate-update-mobile/${candidate.id}?secure_token=${candidate.secure_token}`);

        // Should show error message
        await expect(page.getByText(/expired|invalid|access denied/i)).toBeVisible({ timeout: 10000 });

      } finally {
        await cleanupTestCandidate(candidate.id);
      }
    });

    test('should reject invalid token', async ({ page }) => {
      const candidate = await createTestCandidate();

      try {
        // Use wrong token
        await page.goto(`/candidate-update-mobile/${candidate.id}?secure_token=invalid_token_12345`);

        // Should show error message
        await expect(page.getByText(/invalid|access denied|unauthorized/i)).toBeVisible({ timeout: 10000 });

      } finally {
        await cleanupTestCandidate(candidate.id);
      }
    });

    test('should accept valid token', async ({ page }) => {
      const candidate = await createTestCandidate();

      try {
        await page.goto(`/candidate-update-mobile/${candidate.id}?secure_token=${candidate.secure_token}`);

        // Should show the form
        await expect(page.getByText('Update Your Profile')).toBeVisible({ timeout: 10000 });

      } finally {
        await cleanupTestCandidate(candidate.id);
      }
    });
  });

  test.describe('Form Data Persistence', () => {

    test('should save all basic fields correctly', async ({ page }) => {
      const candidate = await createTestCandidate();

      const testData = {
        full_name: 'John Doe Updated',
        email: `john-${Date.now()}@example.com`,
        phone_number: '+60198765432',
        ic_number: '901234-05-6789',
        nationality: 'Malaysian',
        gender: 'male',
        race: 'chinese',
        home_address: '123 Test Street, Kuala Lumpur'
      };

      try {
        await page.goto(`/candidate-update-mobile/${candidate.id}?secure_token=${candidate.secure_token}`);
        await expect(page.getByText('Update Your Profile')).toBeVisible({ timeout: 10000 });

        // Fill all fields
        await page.fill('[name="full_name"]', testData.full_name);
        await page.fill('[name="email"]', testData.email);
        await page.fill('[name="phone_number"]', testData.phone_number);
        await page.fill('[name="ic_number"]', testData.ic_number);
        await page.selectOption('[name="nationality"]', testData.nationality);
        await page.selectOption('[name="gender"]', testData.gender);
        await page.selectOption('[name="race"]', testData.race);
        await page.fill('[name="home_address"]', testData.home_address);

        await page.click('button[type="submit"]');
        await expect(page.getByText('Profile Updated')).toBeVisible({ timeout: 10000 });

        // Verify all data in database
        const { data } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', candidate.id)
          .single();

        expect(data?.full_name).toBe(testData.full_name);
        expect(data?.email).toBe(testData.email);
        expect(data?.phone_number).toBe(testData.phone_number);
        expect(data?.ic_number).toBe(testData.ic_number);
        expect(data?.nationality).toBe(testData.nationality);
        expect(data?.gender).toBe(testData.gender);
        expect(data?.race).toBe(testData.race);
        expect(data?.home_address).toBe(testData.home_address);

      } finally {
        await cleanupTestCandidate(candidate.id);
      }
    });

    test('should save bank details correctly', async ({ page }) => {
      const candidate = await createTestCandidate();

      const bankData = {
        bank_name: 'Maybank',
        bank_account_number: '1234567890',
        bank_account_name: 'John Doe'
      };

      try {
        await page.goto(`/candidate-update-mobile/${candidate.id}?secure_token=${candidate.secure_token}`);
        await expect(page.getByText('Update Your Profile')).toBeVisible({ timeout: 10000 });

        // Navigate to bank details section
        await page.click('text=Bank Details');

        await page.fill('[name="bank_name"]', bankData.bank_name);
        await page.fill('[name="bank_account_number"]', bankData.bank_account_number);
        await page.fill('[name="bank_account_name"]', bankData.bank_account_name);

        await page.click('button[type="submit"]');
        await expect(page.getByText('Profile Updated')).toBeVisible({ timeout: 10000 });

        // Verify bank data
        const { data } = await supabase
          .from('candidates')
          .select('bank_name, bank_account_number, bank_account_name')
          .eq('id', candidate.id)
          .single();

        expect(data?.bank_name).toBe(bankData.bank_name);
        expect(data?.bank_account_number).toBe(bankData.bank_account_number);
        expect(data?.bank_account_name).toBe(bankData.bank_account_name);

      } finally {
        await cleanupTestCandidate(candidate.id);
      }
    });
  });

  test.describe('PDPA Consent Flow', () => {

    test('should require PDPA consent before saving', async ({ page }) => {
      const candidate = await createTestCandidate();

      try {
        await page.goto(`/candidate-update-mobile/${candidate.id}?secure_token=${candidate.secure_token}`);
        await expect(page.getByText('Update Your Profile')).toBeVisible({ timeout: 10000 });

        await page.fill('[name="full_name"]', candidate.full_name);
        await page.fill('[name="phone_number"]', candidate.phone_number);

        await page.click('button[type="submit"]');

        // Should show PDPA consent dialog
        await expect(page.getByText(/privacy|data protection|PDPA/i)).toBeVisible({ timeout: 10000 });

        // Accept consent
        await page.click('button:has-text("Accept")');

        // Should now save successfully
        await expect(page.getByText('Profile Updated')).toBeVisible({ timeout: 10000 });

      } finally {
        await cleanupTestCandidate(candidate.id);
      }
    });
  });
});
