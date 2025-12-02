// ============================================
// MCP-Enhanced Chatbot Browser Console Test
// ============================================
// Copy and paste this into Chrome DevTools Console (F12)
// to test the MCP chatbot directly from your browser

const ENDPOINT = 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-mcp-enhanced';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTM2NDgsImV4cCI6MjA1NTgyOTY0OH0.F505FnCo_hg6_LpEZ-yvNWd5Zw5OnCnGxIogP4txeCY';

let conversationId = null;

// Helper function to test chatbot
async function testMCPChatbot(message, options = {}) {
  const {
    userId = 'test-user-browser',
    reasoningEffort = 'medium',
    showReasoning = false
  } = options;

  console.log('\n🚀 Testing MCP Chatbot');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Message:', message);
  console.log('👤 User ID:', userId);
  console.log('🧠 Reasoning:', reasoningEffort);

  const payload = {
    message,
    userId,
    reasoningEffort,
    showReasoning
  };

  if (conversationId) {
    payload.conversationId = conversationId;
  }

  const startTime = Date.now();

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', response.status, errorText);
      return { error: errorText };
    }

    const data = await response.json();

    // Store conversation ID
    if (data.conversationId) {
      conversationId = data.conversationId;
    }

    console.log('✅ Response received in', totalTime, 'ms');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💬 Reply:');
    console.log(data.reply);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (data.metadata) {
      console.log('📊 Metadata:');
      console.table(data.metadata);
    }

    if (data.toolCalls && data.toolCalls.length > 0) {
      console.log('🛠️ Tool Calls:');
      data.toolCalls.forEach((call, i) => {
        console.log(`  ${i + 1}. ${call.name}`, call.args);
      });
    }

    return data;

  } catch (error) {
    console.error('❌ Network Error:', error.message);
    return { error: error.message };
  }
}

// Quick test functions
async function test1_Capabilities() {
  console.log('\n🧪 TEST 1: Chatbot Capabilities');
  return await testMCPChatbot('What can you do?', { reasoningEffort: 'low' });
}

async function test2_ReadQuery() {
  console.log('\n🧪 TEST 2: Database Read Query');
  return await testMCPChatbot('Show me all my active projects');
}

async function test3_SecurityTest() {
  console.log('\n🧪 TEST 3: Security - Block DELETE');
  return await testMCPChatbot('Delete all old projects from 2023');
}

async function test4_JobPosting() {
  console.log('\n🧪 TEST 4: Job Posting Recognition');
  return await testMCPChatbot(
    'Need 8 waiters for wedding dinner. Dec 5th, 2024, 6pm-11pm. Grand Hyatt KL. RM20/hour. Must have experience.',
    { reasoningEffort: 'high', showReasoning: true }
  );
}

async function test5_ListTables() {
  console.log('\n🧪 TEST 5: List Database Tables (MCP Tool)');
  return await testMCPChatbot('What tables are in the database?');
}

async function test6_ComplexQuery() {
  console.log('\n🧪 TEST 6: Complex Query');
  return await testMCPChatbot('Find me all Mandarin-speaking candidates who are available');
}

// Run all tests sequentially
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   MCP-Enhanced Chatbot Test Suite             ║');
  console.log('╚════════════════════════════════════════════════╝');

  const results = [];

  results.push({ test: 'Capabilities', result: await test1_Capabilities() });
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between tests

  results.push({ test: 'Read Query', result: await test2_ReadQuery() });
  await new Promise(resolve => setTimeout(resolve, 2000));

  results.push({ test: 'Security Test', result: await test3_SecurityTest() });
  await new Promise(resolve => setTimeout(resolve, 2000));

  results.push({ test: 'Job Posting', result: await test4_JobPosting() });
  await new Promise(resolve => setTimeout(resolve, 2000));

  results.push({ test: 'List Tables', result: await test5_ListTables() });
  await new Promise(resolve => setTimeout(resolve, 2000));

  results.push({ test: 'Complex Query', result: await test6_ComplexQuery() });

  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   Test Suite Complete                          ║');
  console.log('╚════════════════════════════════════════════════╝');

  console.log('\n📊 Summary:');
  results.forEach(({ test, result }) => {
    const status = result.error ? '❌ FAILED' : '✅ PASSED';
    console.log(`  ${status} - ${test}`);
  });

  return results;
}

// Display help
console.log('╔════════════════════════════════════════════════╗');
console.log('║   MCP-Enhanced Chatbot Console Test           ║');
console.log('╚════════════════════════════════════════════════╝');
console.log('');
console.log('🚀 Available Commands:');
console.log('');
console.log('  testMCPChatbot(message, options)');
console.log('    - Test chatbot with custom message');
console.log('    - Example: testMCPChatbot("Show me projects")');
console.log('');
console.log('  test1_Capabilities()     - Test chatbot capabilities');
console.log('  test2_ReadQuery()        - Test database read');
console.log('  test3_SecurityTest()     - Test DELETE blocking');
console.log('  test4_JobPosting()       - Test job posting recognition');
console.log('  test5_ListTables()       - Test MCP list_tables tool');
console.log('  test6_ComplexQuery()     - Test complex SQL generation');
console.log('');
console.log('  runAllTests()            - Run all tests sequentially');
console.log('');
console.log('💡 Quick Start:');
console.log('  1. Run: test1_Capabilities()');
console.log('  2. Or run all: runAllTests()');
console.log('');
console.log('📊 Current Conversation ID:', conversationId || 'None (will create on first message)');
console.log('');
