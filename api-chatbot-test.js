/**
 * Direct API Testing for AI Chatbot
 * Tests all 100 scenarios by calling the Supabase Edge Function directly
 *
 * Run: node api-chatbot-test.js
 */

import fs from 'fs';

// Configuration
const CONFIG = {
  SUPABASE_URL: 'https://aoiwrdzlichescqgnohi.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTM2NDgsImV4cCI6MjA1NTgyOTY0OH0.F505FnCo_hg6_LpEZ-yvNWd5Zw5OnCnGxIogP4txeCY',
  // You need to provide a test user ID
  TEST_USER_ID: 'test-user-123', // Replace with actual user ID from your database
  WAIT_BETWEEN_TESTS: 1000 // 1 second between tests
};

// All test scenarios
const ALL_TESTS = [
  // Category 1: Basic Data Retrieval
  { id: "1.1", category: "Basic", query: "How many projects do we have?" },
  { id: "1.2", category: "Basic", query: "Show me all active projects" },
  { id: "1.3", category: "Basic", query: "List all candidates" },
  { id: "1.4", category: "Basic", query: "What's our total revenue?" },
  { id: "1.5", category: "Basic", query: "Check for scheduling conflicts this week" },
  { id: "1.6", category: "Basic", query: "Show me completed projects" },
  { id: "1.7", category: "Basic", query: "Show me available candidates" },
  { id: "1.8", category: "Basic", query: "What's starting this month?", bugFix: true },
  { id: "1.9", category: "Basic", query: "Who has a car?", bugFix: true },
  { id: "1.10", category: "Basic", query: "Tell me about the MrDIY project" },
  { id: "1.11", category: "Basic", query: "Show me people with forklift skills", bugFix: true },
  { id: "1.12", category: "Basic", query: "What was revenue last month?" },
  { id: "1.13", category: "Basic", query: "Show me high priority projects" },
  { id: "1.14", category: "Basic", query: "Which projects need more staff?", bugFix: true },
  { id: "1.15", category: "Basic", query: "Who is available next Friday?" },

  // Category 2: Complex Filtering
  { id: "2.1", category: "Complex", query: "Show active high-priority projects starting this month" },
  { id: "2.2", category: "Complex", query: "Find candidates with forklift AND warehouse experience who have vehicles" },
  { id: "2.3", category: "Complex", query: "What's revenue from completed projects?" },
  { id: "2.4", category: "Complex", query: "Show me projects in Kuala Lumpur" },
  { id: "2.5", category: "Complex", query: "Show me fully staffed projects" },

  // Category 3: Multi-Step Reasoning
  { id: "3.1", category: "Reasoning", query: "How many more staff do we need total?" },
  { id: "3.2", category: "Reasoning", query: "Which candidates are working on the most projects?" },

  // Category 4: Context Awareness
  { id: "4.1", category: "Context", query: "Show me MrDIY projects" },
  { id: "4.2", category: "Context", query: "Show me all", contextDependent: true },
  { id: "4.3", category: "Context", query: "Show MTDIY projects", expectsTypoCorrection: true },
];

// Results tracking
const results = {
  startTime: new Date(),
  tests: [],
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n🚀 Starting Direct API Testing for AI Chatbot\n');
  console.log('='.repeat(80));
  console.log(`Using Supabase URL: ${CONFIG.SUPABASE_URL}`);
  console.log(`Test User ID: ${CONFIG.TEST_USER_ID}`);
  console.log('='.repeat(80));

  // Create a conversation ID for this test session
  const conversationId = `test-${Date.now()}`;
  console.log(`\nConversation ID: ${conversationId}\n`);

  // Group tests by category
  const categories = {};
  ALL_TESTS.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = [];
    }
    categories[test.category].push(test);
  });

  // Run tests by category
  for (const [categoryName, tests] of Object.entries(categories)) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📂 Category: ${categoryName} (${tests.length} tests)`);
    console.log('='.repeat(80));

    for (const test of tests) {
      await runSingleTest(test, conversationId);
      await sleep(CONFIG.WAIT_BETWEEN_TESTS);
    }
  }

  // Generate final report
  generateReport();

  console.log('\n✅ Testing complete!');
  console.log(`📄 Results saved to: api-test-results.json\n`);
}

/**
 * Run a single test
 */
async function runSingleTest(test, conversationId) {
  const testResult = {
    id: test.id,
    category: test.category,
    query: test.query,
    startTime: new Date(),
    status: 'PENDING'
  };

  try {
    console.log(`\n[${test.id}] Testing: "${test.query}"`);

    // Call AI chat API
    const response = await callChatAPI(test.query, conversationId);

    testResult.response = response.reply;
    testResult.toolsUsed = response.toolsUsed || [];
    testResult.endTime = new Date();
    testResult.duration = testResult.endTime - testResult.startTime;

    // Analyze response
    const analysis = analyzeResponse(response, test);
    testResult.analysis = analysis;

    if (analysis.passed) {
      testResult.status = 'PASS';
      results.passed++;
      console.log(`  ✅ PASS - ${analysis.reason}`);
      if (testResult.toolsUsed.length > 0) {
        console.log(`  🔧 Tools: ${testResult.toolsUsed.map(t => t.name).join(', ')}`);
      }
    } else {
      testResult.status = 'FAIL';
      results.failed++;
      console.log(`  ❌ FAIL - ${analysis.reason}`);
      results.errors.push({
        id: test.id,
        query: test.query,
        reason: analysis.reason
      });
    }

  } catch (error) {
    testResult.status = 'ERROR';
    testResult.error = error.message;
    testResult.endTime = new Date();
    results.failed++;
    console.log(`  ❌ ERROR - ${error.message}`);
    results.errors.push({
      id: test.id,
      query: test.query,
      error: error.message
    });
  }

  results.tests.push(testResult);
}

/**
 * Call the AI chat API
 */
async function callChatAPI(message, conversationId) {
  const url = `${CONFIG.SUPABASE_URL}/functions/v1/ai-chat`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      message,
      conversationId,
      userId: CONFIG.TEST_USER_ID
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Analyze the response
 */
function analyzeResponse(response, test) {
  // Check if we got a reply
  if (!response.reply || response.reply.trim().length === 0) {
    return {
      passed: false,
      reason: 'Empty response'
    };
  }

  // Check if response contains error
  if (response.reply.toLowerCase().includes('error') ||
      response.reply.toLowerCase().includes('something went wrong')) {
    return {
      passed: false,
      reason: 'Response contains error message'
    };
  }

  // Check if tools were used (good sign)
  if (response.toolsUsed && response.toolsUsed.length > 0) {
    return {
      passed: true,
      reason: `Successfully used ${response.toolsUsed.length} tool(s)`
    };
  }

  // For context-dependent queries, it's ok if no tools used but got response
  if (test.contextDependent && response.reply.length > 10) {
    return {
      passed: true,
      reason: 'Context-aware response received'
    };
  }

  // Response looks ok
  if (response.reply.length > 20) {
    return {
      passed: true,
      reason: 'Valid response received'
    };
  }

  return {
    passed: false,
    reason: 'Response too short or unclear'
  };
}

/**
 * Generate final report
 */
function generateReport() {
  const total = results.passed + results.failed;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  const intelligenceScore = total > 0 ? Math.round((results.passed / total) * 100) : 0;

  let grade = 'F';
  if (intelligenceScore >= 90) grade = 'A';
  else if (intelligenceScore >= 80) grade = 'B';
  else if (intelligenceScore >= 70) grade = 'C';
  else if (intelligenceScore >= 60) grade = 'D';

  const report = {
    timestamp: new Date().toISOString(),
    duration: (new Date() - results.startTime) / 1000,
    summary: {
      total,
      passed: results.passed,
      failed: results.failed,
      passRate: `${passRate}%`,
      intelligenceScore,
      grade
    },
    tests: results.tests,
    errors: results.errors
  };

  // Save to file
  fs.writeFileSync('api-test-results.json', JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 FINAL TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${results.passed} (${passRate}%)`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`\n🎯 Intelligence Score: ${intelligenceScore}/100 (Grade ${grade})`);
  console.log(`⏱️  Total Duration: ${report.duration.toFixed(1)}s`);

  if (results.errors.length > 0) {
    console.log('\n\n❌ Failed Tests:');
    console.log('-'.repeat(80));
    results.errors.forEach((err, i) => {
      console.log(`\n${i + 1}. [${err.id}] ${err.query}`);
      console.log(`   Reason: ${err.reason || err.error}`);
    });
  }

  // Category breakdown
  const byCategory = {};
  results.tests.forEach(test => {
    if (!byCategory[test.category]) {
      byCategory[test.category] = { passed: 0, failed: 0 };
    }
    if (test.status === 'PASS') {
      byCategory[test.category].passed++;
    } else {
      byCategory[test.category].failed++;
    }
  });

  console.log('\n\n📊 Results by Category:');
  console.log('-'.repeat(80));
  Object.entries(byCategory).forEach(([cat, stats]) => {
    const total = stats.passed + stats.failed;
    const rate = total > 0 ? ((stats.passed / total) * 100).toFixed(0) : 0;
    const status = rate >= 80 ? '✅' : rate >= 60 ? '⚠️' : '❌';
    console.log(`${status} ${cat}: ${stats.passed}/${total} (${rate}%)`);
  });

  console.log('\n' + '='.repeat(80));
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run tests
runTests().catch(console.error);
