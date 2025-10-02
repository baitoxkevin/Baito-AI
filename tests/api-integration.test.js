/**
 * Simplified API Integration Tests for Baito-AI
 * Tests basic API connectivity and operations
 */

import fetch from 'node-fetch';

const SUPABASE_URL = 'https://aoiwrdzlichescqgnohi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTM2NDgsImV4cCI6MjA1NTgyOTY0OH0.F505FnCo_hg6_LpEZ-yvNWd5Zw5OnCnGxIogP4txeCY';

console.log('🧪 Running Baito-AI API Integration Tests\n');

let testsPassed = 0;
let testsFailed = 0;

async function test(name, testFn) {
  try {
    await testFn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    testsFailed++;
  }
}

// Test 1: API Connectivity
await test('API should be reachable', async () => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  if (!response.ok) throw new Error(`Status: ${response.status}`);
});

// Test 2: Fetch Projects
await test('Should fetch projects list', async () => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/projects?limit=5`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Expected array of projects');
});

// Test 3: Fetch Candidates
await test('Should fetch candidates list', async () => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/candidates?limit=5`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Expected array of candidates');
});

// Test 4: Fetch Companies
await test('Should fetch companies list', async () => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/companies?limit=5`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Expected array of companies');
});

// Test 5: Search Projects
await test('Should search projects by title', async () => {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/projects?title=ilike.*Tech*&limit=5`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Expected array for search results');
});

// Test 6: Fetch Expense Claims
await test('Should fetch expense claims', async () => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/expense_claims?limit=5`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Expected array of expense claims');
});

// Test 7: Fetch with Relations
await test('Should fetch projects with staff relations', async () => {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/projects?select=*,project_staff(*)&limit=2`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Expected array with relations');
});

// Test 8: Count Query
await test('Should count total projects', async () => {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/projects?select=*&limit=0`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'count=exact'
      }
    }
  );
  const count = response.headers.get('content-range');
  if (!count) throw new Error('Expected count header');
});

// Test 9: Filter by Status
await test('Should filter projects by status', async () => {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/projects?status=eq.active&limit=5`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Expected filtered results');
});

// Test 10: Order Results
await test('Should order projects by date', async () => {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/projects?order=created_at.desc&limit=5`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Expected ordered results');
});

// Test Summary
console.log('\n' + '='.repeat(50));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
  console.log('\n🎉 All integration tests passed successfully!');
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
}

process.exit(testsFailed > 0 ? 1 : 0);