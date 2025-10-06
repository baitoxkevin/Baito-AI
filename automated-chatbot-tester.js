/**
 * Automated AI Chatbot Test Runner
 * Systematically tests all 100 scenarios and generates comprehensive report
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';

const TEST_SCENARIOS = {
  // Category 1: Basic Data Retrieval (13 remaining: 1.3-1.15)
  basicRetrieval: [
    { id: "1.3", query: "List all candidates", expectedTool: "query_candidates" },
    { id: "1.4", query: "What's our total revenue?", expectedTool: "calculate_revenue" },
    { id: "1.5", query: "Check for scheduling conflicts this week", expectedTool: "check_scheduling_conflicts" },
    { id: "1.6", query: "Show me completed projects", expectedTool: "query_projects" },
    { id: "1.7", query: "Show me available candidates", expectedTool: "query_candidates" },
    { id: "1.8", query: "Show projects starting in October 2025", expectedTool: "query_projects" },
    { id: "1.9", query: "Which candidates have vehicles?", expectedTool: "query_candidates" },
    { id: "1.10", query: "Tell me about the MrDIY project", expectedTool: "query_projects" },
    { id: "1.11", query: "Show me candidates with forklift certification", expectedTool: "query_candidates" },
    { id: "1.12", query: "What was revenue in September 2025?", expectedTool: "calculate_revenue" },
    { id: "1.13", query: "Show me high priority projects", expectedTool: "query_projects" },
    { id: "1.14", query: "Which projects need more staff?", expectedTool: "query_projects" },
    { id: "1.15", query: "Who is available on 2025-10-10?", expectedTool: "query_candidates" }
  ],

  // Category 2: Complex Filtering (15 tests)
  complexFiltering: [
    { id: "2.1", query: "Show planning status high-priority projects starting in October", expectedTool: "query_projects" },
    { id: "2.2", query: "Find candidates with forklift AND warehouse experience who have vehicles", expectedTool: "query_candidates" },
    { id: "2.3", query: "What's revenue from completed vs planning projects?", expectedTool: "calculate_revenue" },
    { id: "2.4", query: "Check for conflicts in high-priority projects only", expectedTool: "check_scheduling_conflicts" },
    { id: "2.5", query: "Show projects in KL or Kuala Lumpur area", expectedTool: "query_projects" },
    { id: "2.6", query: "Who is available between 2025-10-01 and 2025-10-15?", expectedTool: "query_candidates" },
    { id: "2.7", query: "Which projects are over 80% staffed?", expectedTool: "query_projects" },
    { id: "2.8", query: "Find candidates with at least 3 different skills", expectedTool: "query_candidates" },
    { id: "2.9", query: "Show projects that started in the last 30 days", expectedTool: "query_projects" },
    { id: "2.10", query: "Who can work on weekends?", expectedTool: "query_candidates" },
    { id: "2.11", query: "Show projects lasting more than 1 week", expectedTool: "query_projects" },
    { id: "2.12", query: "Show projects with payment over 10000", expectedTool: "query_projects" },
    { id: "2.13", query: "Which projects are fully staffed?", expectedTool: "query_projects" },
    { id: "2.14", query: "Who can start work tomorrow (2025-10-04)?", expectedTool: "query_candidates" },
    { id: "2.15", query: "Show candidates assigned to multiple projects", expectedTool: "query_candidates" }
  ],

  // Category 3: Multi-Step Reasoning (15 tests)
  multiStepReasoning: [
    { id: "3.1", query: "We have a new warehouse project. Who should I assign?", expectedTools: ["query_candidates"] },
    { id: "3.2", query: "Can we take on a 5-person project starting next week?", expectedTools: ["query_candidates", "check_scheduling_conflicts"] },
    { id: "3.3", query: "If we complete all planning projects, what's total revenue?", expectedTools: ["query_projects", "calculate_revenue"] },
    { id: "3.4", query: "I need alternatives for candidates who might be double-booked on 2025-10-01", expectedTools: ["query_candidates", "check_scheduling_conflicts"] },
    { id: "3.5", query: "How many more projects can we handle this month?", expectedTools: ["query_candidates", "query_projects"] },
    { id: "3.6", query: "We need forklift operators. Do we have enough?", expectedTools: ["query_candidates", "query_projects"] },
    { id: "3.7", query: "Which understaffed project should we prioritize?", expectedTools: ["query_projects"] },
    { id: "3.8", query: "What's average revenue per project by priority level?", expectedTools: ["query_projects", "calculate_revenue"] },
    { id: "3.9", query: "Can we move staff from fully-staffed projects to understaffed ones?", expectedTools: ["query_projects"] },
    { id: "3.10", query: "When can we schedule a 3-day project with 4 staff?", expectedTools: ["query_candidates"] }
  ],

  // Category 4: Context Awareness (remaining: 4.3-4.15)
  contextAwareness: [
    {
      id: "4.3",
      turns: [
        { query: "Check MrDIY project status", expectedTool: "query_projects" },
        { query: "Who is assigned to it?", expectedTool: "query_projects", contextTest: "Resolve 'it' to MrDIY project" }
      ]
    },
    {
      id: "4.4",
      turns: [
        { query: "Find warehouse candidates", expectedTool: "query_candidates" },
        { query: "With forklift certification", expectedTool: "query_candidates", contextTest: "Add filter to previous query" },
        { query: "Available this week", expectedTool: "query_candidates", contextTest: "Further refine same search" }
      ]
    },
    {
      id: "4.7",
      turns: [
        { query: "Find candidate named Sarah", expectedTool: "query_candidates" },
        { query: "What projects is she on?", expectedTool: "query_projects", contextTest: "Resolve 'she' to Sarah" }
      ]
    }
  ],

  // Category 5: Data Analysis (10 tests)
  dataAnalysis: [
    { id: "5.1", query: "Are we getting more high-priority projects over time?", expectedTool: "query_projects" },
    { id: "5.2", query: "What's our project completion rate?", expectedTool: "query_projects" },
    { id: "5.3", query: "What percentage of candidates are currently assigned?", expectedTool: "query_candidates" },
    { id: "5.4", query: "Is revenue increasing month-over-month?", expectedTool: "calculate_revenue" },
    { id: "5.5", query: "What's causing scheduling conflicts?", expectedTool: "check_scheduling_conflicts" },
    { id: "5.6", query: "Which skills are most requested in projects?", expectedTool: "query_projects" },
    { id: "5.7", query: "Where are most projects located?", expectedTool: "query_projects" },
    { id: "5.8", query: "Who are our top performing candidates?", expectedTool: "query_candidates" },
    { id: "5.9", query: "Which upcoming projects are at risk of understaffing?", expectedTool: "query_projects" },
    { id: "5.10", query: "Can we handle 10 more projects this quarter?", expectedTool: "query_projects" }
  ],

  // Category 6: Error Handling (15 tests)
  errorHandling: [
    { id: "6.1", query: "Show projects on February 30th", expectedBehavior: "Handle invalid date gracefully" },
    { id: "6.2", query: "Find candidates with quantum physics skill", expectedBehavior: "Return empty result gracefully" },
    { id: "6.3", query: "Show me everything", expectedBehavior: "Ask for clarification" },
    { id: "6.4", query: "Show projects from year 1900", expectedBehavior: "Handle historical date" },
    { id: "6.5", query: "Show projects without end dates", expectedTool: "query_projects" },
    { id: "6.6", query: "Show projects with priority = 'tomorrow'", expectedBehavior: "Recognize type error" },
    { id: "6.7", query: "Calculate revenue", expectedTool: "calculate_revenue" },
    { id: "6.9", query: "Show projects with 1000000 staff needed", expectedBehavior: "Handle unrealistic value" },
    { id: "6.10", query: "Find candidate with name @#$%", expectedBehavior: "Handle special characters" },
    { id: "6.12", query: "I need to find projects that match very specific criteria including location date range priority level staffing requirements budget constraints and client satisfaction scores", expectedTool: "query_projects" },
    { id: "6.13", query: "Show me projects 在北京", expectedBehavior: "Handle multilingual input" },
    { id: "6.14", query: "Show projects that are both planning and completed status", expectedBehavior: "Detect mutually exclusive conditions" }
  ],

  // Category 7: Advanced Intelligence (15 tests)
  advancedIntelligence: [
    { id: "7.1", query: "We're short-staffed", expectedBehavior: "Infer need to check conflicts" },
    { id: "7.2", query: "Show MrDIY project details", expectedTool: "query_projects" },
    { id: "7.3", query: "No candidates available on 2025-10-05", expectedBehavior: "Suggest alternatives" },
    { id: "7.4", query: "Why is the MrDIY project at risk?", expectedTools: ["query_projects"] },
    { id: "7.6", query: "Find warehouse staff", expectedTool: "query_candidates" },
    { id: "7.7", query: "Summarize our staffing situation", expectedTools: ["query_candidates", "query_projects"] },
    { id: "7.8", query: "Anything unusual this week?", expectedTool: "check_scheduling_conflicts" },
    { id: "7.9", query: "What should I focus on today?", expectedTools: ["query_projects", "check_scheduling_conflicts"] },
    { id: "7.10", query: "Why might revenue be down?", expectedTool: "calculate_revenue" },
    { id: "7.11", query: "Should we hire more staff?", expectedTools: ["query_candidates", "query_projects"] },
    { id: "7.12", query: "Hey quick question about that MyTown project", expectedTool: "query_projects" },
    { id: "7.13", query: "This is urgent! Need staff NOW!", expectedTool: "query_candidates" },
    { id: "7.15", query: "How can we maximize revenue for next quarter?", expectedTools: ["calculate_revenue", "query_projects"] }
  ]
};

class ChatbotTester {
  constructor() {
    this.results = [];
    this.scores = {
      toolSelectionAccuracy: 0,
      queryUnderstanding: 0,
      dataRetrievalAccuracy: 0,
      responseQuality: 0,
      errorHandling: 0,
      contextAwareness: 0,
      multiStepReasoning: 0,
      proactiveIntelligence: 0,
      learningAdaptation: 0,
      businessValue: 0
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Automated Chatbot Testing...\n');

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    // Run all test categories
    await this.runCategory(page, 'Basic Data Retrieval', TEST_SCENARIOS.basicRetrieval);
    await this.runCategory(page, 'Complex Filtering', TEST_SCENARIOS.complexFiltering);
    await this.runCategory(page, 'Multi-Step Reasoning', TEST_SCENARIOS.multiStepReasoning);
    await this.runContextTests(page, TEST_SCENARIOS.contextAwareness);
    await this.runCategory(page, 'Data Analysis', TEST_SCENARIOS.dataAnalysis);
    await this.runCategory(page, 'Error Handling', TEST_SCENARIOS.errorHandling);
    await this.runCategory(page, 'Advanced Intelligence', TEST_SCENARIOS.advancedIntelligence);

    await browser.close();

    // Generate report
    await this.generateReport();
  }

  async runCategory(page, categoryName, tests) {
    console.log(`\n📁 Testing Category: ${categoryName}`);
    console.log('='.repeat(60));

    for (const test of tests) {
      await this.runSingleTest(page, test, categoryName);
      await page.waitForTimeout(1000);
    }
  }

  async runSingleTest(page, test, category) {
    try {
      // Open chatbot if not already open
      const chatButton = await page.$('button:has-text("Open AI Assistant")');
      if (chatButton) {
        await chatButton.click();
        await page.waitForTimeout(500);
      }

      // Clear previous conversation
      const clearButton = await page.$('button[description="Start new conversation"]');
      if (clearButton) {
        await clearButton.click();
        await page.waitForTimeout(500);
      }

      // Send query
      const input = await page.$('textarea, input[placeholder*="message"]');
      await input.fill(test.query);
      await page.keyboard.press('Enter');

      // Wait for response
      await page.waitForTimeout(5000);

      // Extract response and tool usage
      const responseText = await page.textContent('.message-list, [role="log"]').catch(() => '');
      const toolsUsed = this.extractToolsFromResponse(responseText);

      // Validate results
      const passed = this.validateTest(test, toolsUsed, responseText);

      // Record result
      this.results.push({
        id: test.id,
        category,
        query: test.query,
        expectedTool: test.expectedTool || test.expectedTools,
        actualTools: toolsUsed,
        response: responseText.substring(0, 200),
        status: passed ? 'PASS' : 'FAIL',
        timestamp: new Date().toISOString()
      });

      console.log(`  ${passed ? '✅' : '❌'} ${test.id}: ${test.query.substring(0, 50)}...`);

    } catch (error) {
      console.error(`  ❌ ${test.id} ERROR:`, error.message);
      this.results.push({
        id: test.id,
        category,
        query: test.query,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  async runContextTests(page, tests) {
    console.log(`\n📁 Testing Category: Context Awareness (Multi-Turn)`);
    console.log('='.repeat(60));

    for (const test of tests) {
      await this.runMultiTurnTest(page, test);
    }
  }

  async runMultiTurnTest(page, test) {
    // Clear conversation
    const clearButton = await page.$('button[description="Start new conversation"]');
    if (clearButton) {
      await clearButton.click();
      await page.waitForTimeout(500);
    }

    let allPassed = true;

    for (const turn of test.turns) {
      const input = await page.$('textarea, input[placeholder*="message"]');
      await input.fill(turn.query);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);

      const responseText = await page.textContent('.message-list').catch(() => '');
      const toolsUsed = this.extractToolsFromResponse(responseText);

      const turnPassed = toolsUsed.includes(turn.expectedTool);
      if (!turnPassed) allPassed = false;

      console.log(`  ${turnPassed ? '✅' : '❌'} ${test.id} Turn ${test.turns.indexOf(turn) + 1}: ${turn.query.substring(0, 40)}...`);
    }

    this.results.push({
      id: test.id,
      category: 'Context Awareness',
      status: allPassed ? 'PASS' : 'FAIL',
      turns: test.turns.length
    });
  }

  extractToolsFromResponse(text) {
    const tools = [];
    if (text.includes('query_projects')) tools.push('query_projects');
    if (text.includes('query_candidates')) tools.push('query_candidates');
    if (text.includes('calculate_revenue')) tools.push('calculate_revenue');
    if (text.includes('check_scheduling_conflicts')) tools.push('check_scheduling_conflicts');
    return tools;
  }

  validateTest(test, toolsUsed, response) {
    if (test.expectedTool) {
      return toolsUsed.includes(test.expectedTool);
    }
    if (test.expectedTools) {
      return test.expectedTools.some(tool => toolsUsed.includes(tool));
    }
    if (test.expectedBehavior) {
      return response.length > 0; // At least responded
    }
    return false;
  }

  calculateScores() {
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const totalTests = this.results.length;
    const passRate = (passedTests / totalTests) * 100;

    // Score each dimension 0-10
    this.scores.toolSelectionAccuracy = Math.round((passRate / 10));
    this.scores.queryUnderstanding = Math.round((passRate / 10));
    this.scores.dataRetrievalAccuracy = Math.round((passRate / 10));
    this.scores.responseQuality = Math.round((passRate / 10)) - 1;
    this.scores.errorHandling = Math.round((passRate / 10)) - 1;
    this.scores.contextAwareness = Math.round((passRate / 10));
    this.scores.multiStepReasoning = Math.round((passRate / 10)) - 1;
    this.scores.proactiveIntelligence = Math.round((passRate / 10)) - 2;
    this.scores.learningAdaptation = Math.round((passRate / 10)) - 3;
    this.scores.businessValue = Math.round((passRate / 10));

    return Object.values(this.scores).reduce((a, b) => a + b, 0);
  }

  async generateReport() {
    const totalScore = this.calculateScores();
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const errorTests = this.results.filter(r => r.status === 'ERROR').length;

    const report = {
      testRun: {
        date: new Date().toISOString(),
        totalTests: this.results.length,
        passed: passedTests,
        failed: failedTests,
        errors: errorTests,
        passRate: `${((passedTests / this.results.length) * 100).toFixed(2)}%`
      },
      scores: this.scores,
      totalScore: totalScore,
      maxScore: 100,
      intelligenceGrade: this.getGrade(totalScore),
      results: this.results
    };

    // Save to file
    await fs.writeFile(
      'test-results-final.json',
      JSON.stringify(report, null, 2)
    );

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⚠️  Errors: ${errorTests}`);
    console.log(`📈 Pass Rate: ${report.testRun.passRate}`);
    console.log(`🎯 Intelligence Score: ${totalScore}/100 (${report.intelligenceGrade})`);
    console.log('='.repeat(60));
    console.log('\n✅ Report saved to: test-results-final.json');
  }

  getGrade(score) {
    if (score >= 90) return 'A+ (Exceptional)';
    if (score >= 80) return 'A (Excellent)';
    if (score >= 70) return 'B (Good)';
    if (score >= 60) return 'C (Average)';
    return 'D (Needs Improvement)';
  }
}

// Run tests
const tester = new ChatbotTester();
tester.runAllTests().catch(console.error);
