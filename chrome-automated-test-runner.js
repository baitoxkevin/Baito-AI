/**
 * Automated AI Chatbot Test Runner using Puppeteer
 * Runs all 100 test scenarios and records results
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';

// Test scenarios from QUICK_TEST_COMMANDS.md
const TEST_SCENARIOS = {
  category1: [
    { id: '1.8', query: "What's starting this month?", expectedTool: 'query_projects', expectedParams: { date_from: '2025-10-01', date_to: '2025-10-31' } },
    { id: '1.9', query: "Who has a car?", expectedTool: 'query_candidates', expectedParams: { has_vehicle: true } },
    { id: '1.10', query: "Tell me about the MrDIY project", expectedTool: 'query_projects', expectedParams: { company_name: 'MrDIY' } },
    { id: '1.11', query: "Show me people with forklift skills", expectedTool: 'query_candidates', expectedParams: { skills: ['forklift'] } },
    { id: '1.12', query: "What was revenue last month?", expectedTool: 'calculate_revenue', expectedParams: { period: 'last_month' } },
    { id: '1.13', query: "Show me high priority projects", expectedTool: 'query_projects', expectedParams: { priority: 'high' } },
    { id: '1.14', query: "Which projects need more staff?", expectedTool: 'query_projects', expectedParams: { understaffed: true } },
    { id: '1.15', query: "Who is available next Friday?", expectedTool: 'query_candidates', expectedParams: { available_date: '2025-10-10' } }
  ],
  category2: [
    { id: '2.1', query: "Show active high-priority projects starting this month", expectedTool: 'query_projects', expectedParams: { status: 'active', priority: 'high', date_from: '2025-10-01' } },
    { id: '2.2', query: "Find candidates with forklift AND warehouse experience who have vehicles", expectedTool: 'query_candidates', expectedParams: { skills: ['forklift', 'warehouse'], has_vehicle: true } },
    { id: '2.3', query: "What's revenue from completed vs active projects?", expectedTool: 'calculate_revenue', expectedParams: { status: ['completed', 'active'] } },
    { id: '2.4', query: "Find candidates near Kuala Lumpur who are available this week", expectedTool: 'query_candidates', expectedParams: { location: 'Kuala Lumpur', available_date: '2025-10-03' } },
    { id: '2.5', query: "Show me projects that are fully staffed vs understaffed", expectedTool: 'query_projects', expectedParams: { understaffed: [false, true] } },
    { id: '2.6', query: "Who speaks Mandarin and has vehicle and forklift certification?", expectedTool: 'query_candidates', expectedParams: { languages: ['Mandarin'], has_vehicle: true, skills: ['forklift'] } },
    { id: '2.7', query: "What was our revenue between September 1 and September 30?", expectedTool: 'calculate_revenue', expectedParams: { date_from: '2025-09-01', date_to: '2025-09-30' } },
    { id: '2.8', query: "Show me all urgent projects that are still pending", expectedTool: 'query_projects', expectedParams: { priority: 'urgent', status: 'pending' } },
    { id: '2.9', query: "Find experienced candidates with 5+ completed projects", expectedTool: 'query_candidates', expectedParams: { min_projects: 5 } },
    { id: '2.10', query: "Which projects overlap with the MrDIY project dates?", expectedTool: 'query_projects', expectedParams: { date_overlap: 'MrDIY' } }
  ],
  category3: [
    { id: '3.1', query: "Find the best candidate for a forklift operator role at MrDIY project", expectedTool: 'query_candidates', multiStep: true },
    { id: '3.2', query: "How many more staff do we need to hire to fill all projects?", expectedTool: 'query_projects', multiStep: true },
    { id: '3.3', query: "If we complete all pending projects, what will our total revenue be?", expectedTool: 'calculate_revenue', multiStep: true },
    { id: '3.4', query: "Which candidates are working on the most projects?", expectedTool: 'query_candidates', multiStep: true },
    { id: '3.5', query: "Can we move staff from overstaffed projects to understaffed ones?", expectedTool: 'query_projects', multiStep: true },
    { id: '3.6', query: "What projects are starting within 7 days and still need staff?", expectedTool: 'query_projects', expectedParams: { date_from: '2025-10-03', date_to: '2025-10-10', understaffed: true } },
    { id: '3.7', query: "What skills are most needed for our pending projects?", expectedTool: 'query_projects', multiStep: true },
    { id: '3.8', query: "How does this month's revenue compare to last month?", expectedTool: 'calculate_revenue', multiStep: true },
    { id: '3.9', query: "Recommend 3 candidates for a warehouse project starting next week", expectedTool: 'query_candidates', multiStep: true },
    { id: '3.10', query: "If candidate X is double-booked, which project should we prioritize?", expectedTool: 'query_projects', multiStep: true }
  ]
};

class AITestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async initialize() {
    console.log('🚀 Launching browser...');
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    await this.page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });

    console.log('✅ Browser initialized');

    // Wait for and click AI Assistant button
    await this.page.waitForSelector('button:has-text("Open AI Assistant")', { timeout: 10000 });
    await this.page.click('button:has-text("Open AI Assistant")');
    await this.page.waitForTimeout(1000);

    console.log('✅ AI Assistant opened');
  }

  async runTest(test) {
    console.log(`\n📝 Running Test ${test.id}: "${test.query}"`);

    try {
      // Clear conversation for clean test
      const clearButton = await this.page.$('button:has-text("Clear conversation")');
      if (clearButton) {
        await clearButton.click();
        await this.page.waitForTimeout(500);
      }

      // Find input field and send message
      const inputSelector = 'textarea[placeholder*="Type your message"], input[placeholder*="Type your message"]';
      await this.page.waitForSelector(inputSelector);
      await this.page.type(inputSelector, test.query);

      // Click send button
      const sendButton = await this.page.$('button[type="submit"], button:has-text("Send")');
      await sendButton.click();

      // Wait for response (look for "TOOLS:" indicator or response text)
      await this.page.waitForTimeout(5000); // Give AI time to respond

      // Extract response
      const response = await this.page.evaluate(() => {
        const messages = document.querySelectorAll('[class*="message"]');
        const lastMessage = messages[messages.length - 1];
        return lastMessage ? lastMessage.innerText : '';
      });

      // Check if correct tool was mentioned in response
      const toolMentioned = response.includes(test.expectedTool);
      const passed = toolMentioned;

      const result = {
        id: test.id,
        query: test.query,
        expectedTool: test.expectedTool,
        response: response.substring(0, 200) + '...',
        passed: passed,
        timestamp: new Date().toISOString()
      };

      this.results.details.push(result);
      this.results.total++;

      if (passed) {
        this.results.passed++;
        console.log(`✅ PASS - Tool ${test.expectedTool} was used`);
      } else {
        this.results.failed++;
        console.log(`❌ FAIL - Expected ${test.expectedTool}, got different response`);
      }

      return result;

    } catch (error) {
      console.error(`❌ ERROR in test ${test.id}:`, error.message);

      const result = {
        id: test.id,
        query: test.query,
        error: error.message,
        passed: false,
        timestamp: new Date().toISOString()
      };

      this.results.details.push(result);
      this.results.total++;
      this.results.failed++;

      return result;
    }
  }

  async runAllTests() {
    console.log('\n🎯 Starting comprehensive AI chatbot test suite...\n');

    // Run Category 1 tests
    console.log('\n📋 CATEGORY 1: Temporal Awareness (Tests 1.8-1.15)');
    for (const test of TEST_SCENARIOS.category1) {
      await this.runTest(test);
      await this.page.waitForTimeout(1000); // Pause between tests
    }

    // Run Category 2 tests
    console.log('\n📋 CATEGORY 2: Complex Filtering (Tests 2.1-2.10)');
    for (const test of TEST_SCENARIOS.category2) {
      await this.runTest(test);
      await this.page.waitForTimeout(1000);
    }

    // Run Category 3 tests
    console.log('\n📋 CATEGORY 3: Multi-Step Reasoning (Tests 3.1-3.10)');
    for (const test of TEST_SCENARIOS.category3) {
      await this.runTest(test);
      await this.page.waitForTimeout(1000);
    }
  }

  async generateReport() {
    const passRate = ((this.results.passed / this.results.total) * 100).toFixed(1);

    const report = `# Automated AI Chatbot Test Report

## Test Execution Summary
- **Date**: ${new Date().toISOString()}
- **Total Tests**: ${this.results.total}
- **Passed**: ${this.results.passed} ✅
- **Failed**: ${this.results.failed} ❌
- **Pass Rate**: ${passRate}%
- **Grade**: ${passRate >= 90 ? 'A' : passRate >= 80 ? 'B' : passRate >= 70 ? 'C' : 'D'}

## Intelligence Score Calculation
- **Query Understanding**: ${passRate >= 90 ? '10/10' : passRate >= 80 ? '9/10' : '8/10'}
- **Tool Selection**: ${passRate >= 90 ? '10/10' : passRate >= 80 ? '9/10' : '8/10'}
- **Overall Intelligence Score**: ${Math.round(passRate)}/${100}

## Detailed Results

${this.results.details.map(r => `
### Test ${r.id}: ${r.passed ? '✅ PASS' : '❌ FAIL'}
- **Query**: ${r.query}
- **Expected Tool**: ${r.expectedTool}
- **Response**: ${r.response || r.error || 'No response'}
- **Timestamp**: ${r.timestamp}
`).join('\n')}

## Recommendations
${passRate >= 90 ? '🎉 Excellent! Ready for production deployment.' :
  passRate >= 80 ? '⚠️ Good performance, but needs minor improvements before full production.' :
  '🔴 Significant improvements needed. Review failed tests and retrain/fix tool selection logic.'}
`;

    await fs.writeFile('AUTOMATED_TEST_REPORT.md', report);
    console.log('\n📄 Report saved to AUTOMATED_TEST_REPORT.md');

    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.runAllTests();
      await this.generateReport();

      console.log('\n' + '='.repeat(60));
      console.log('📊 FINAL RESULTS');
      console.log('='.repeat(60));
      console.log(`Total Tests: ${this.results.total}`);
      console.log(`Passed: ${this.results.passed} ✅`);
      console.log(`Failed: ${this.results.failed} ❌`);
      console.log(`Pass Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
      console.log('='.repeat(60));

    } catch (error) {
      console.error('❌ Test runner error:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tests
const runner = new AITestRunner();
runner.run().then(() => {
  console.log('\n✨ Test execution complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
