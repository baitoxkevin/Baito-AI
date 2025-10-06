// Batch AI Chatbot Testing Script
// This script systematically tests all 100 scenarios

const testScenarios = [
  // Category 1: Basic Data Retrieval (1.3-1.15)
  { id: "1.3", query: "List all candidates", expectedTool: "query_candidates", category: "Basic Data Retrieval" },
  { id: "1.4", query: "What's our total revenue?", expectedTool: "calculate_revenue", category: "Basic Data Retrieval" },
  { id: "1.5", query: "Check for scheduling conflicts this week", expectedTool: "check_scheduling_conflicts", category: "Basic Data Retrieval" },
  { id: "1.6", query: "Show me completed projects", expectedTool: "query_projects", category: "Basic Data Retrieval" },
  { id: "1.7", query: "Show me available candidates", expectedTool: "query_candidates", category: "Basic Data Retrieval" },
  { id: "1.8", query: "Show projects starting this month", expectedTool: "query_projects", category: "Basic Data Retrieval" },
  { id: "1.9", query: "Which candidates have vehicles?", expectedTool: "query_candidates", category: "Basic Data Retrieval" },
  { id: "1.10", query: "Tell me about the MrDIY project", expectedTool: "query_projects", category: "Basic Data Retrieval" },
  { id: "1.11", query: "Show me candidates with forklift certification", expectedTool: "query_candidates", category: "Basic Data Retrieval" },
  { id: "1.12", query: "What was revenue last month?", expectedTool: "calculate_revenue", category: "Basic Data Retrieval" },
  { id: "1.13", query: "Show me high priority projects", expectedTool: "query_projects", category: "Basic Data Retrieval" },
  { id: "1.14", query: "Which projects need more staff?", expectedTool: "query_projects", category: "Basic Data Retrieval" },
  { id: "1.15", query: "Who is available on 2025-10-10?", expectedTool: "query_candidates", category: "Basic Data Retrieval" },

  // Category 2: Complex Filtering (15 tests)
  { id: "2.1", query: "Show active high-priority projects starting this month", expectedTool: "query_projects", category: "Complex Filtering" },
  { id: "2.2", query: "Find candidates with forklift AND warehouse experience who have vehicles", expectedTool: "query_candidates", category: "Complex Filtering" },
  { id: "2.3", query: "What's revenue from completed vs active projects?", expectedTool: "calculate_revenue", category: "Complex Filtering" },
  { id: "2.4", query: "Check for conflicts in high-priority projects only", expectedTool: "check_scheduling_conflicts", category: "Complex Filtering" },
  { id: "2.5", query: "Show projects in Kuala Lumpur area", expectedTool: "query_projects", category: "Complex Filtering" },
  { id: "2.6", query: "Who is available between 2025-10-01 and 2025-10-15?", expectedTool: "query_candidates", category: "Complex Filtering" },
  { id: "2.7", query: "Which projects are over 80% staffed?", expectedTool: "query_projects", category: "Complex Filtering" },
  { id: "2.8", query: "Find candidates with at least 3 different skills", expectedTool: "query_candidates", category: "Complex Filtering" },
  { id: "2.9", query: "Show projects that started in the last 30 days", expectedTool: "query_projects", category: "Complex Filtering" },
  { id: "2.10", query: "Who can work weekends?", expectedTool: "query_candidates", category: "Complex Filtering" },
  { id: "2.11", query: "Show projects lasting more than 1 week", expectedTool: "query_projects", category: "Complex Filtering" },
  { id: "2.12", query: "Show projects with payment over 10000", expectedTool: "query_projects", category: "Complex Filtering" },
  { id: "2.13", query: "Which projects are fully staffed?", expectedTool: "query_projects", category: "Complex Filtering" },
  { id: "2.14", query: "Who can start work tomorrow?", expectedTool: "query_candidates", category: "Complex Filtering" },
  { id: "2.15", query: "Show candidates assigned to multiple projects", expectedTool: "query_candidates", category: "Complex Filtering" },

  // Category 3: Multi-Step Reasoning (15 tests)
  { id: "3.1", query: "We have a new warehouse project. Who should I assign?", expectedTool: "query_candidates", category: "Multi-Step Reasoning" },
  { id: "3.2", query: "Can we take on a 5-person project starting next week?", expectedTool: "query_candidates", category: "Multi-Step Reasoning" },
  { id: "3.3", query: "If we complete all planning projects, what's total revenue?", expectedTool: "calculate_revenue", category: "Multi-Step Reasoning" },
  { id: "3.4", query: "I need alternatives for candidates who might be double-booked on 2025-10-01", expectedTool: "query_candidates", category: "Multi-Step Reasoning" },
  { id: "3.5", query: "How many more projects can we handle this month?", expectedTool: "query_projects", category: "Multi-Step Reasoning" },
  { id: "3.6", query: "We need forklift operators. Do we have enough?", expectedTool: "query_candidates", category: "Multi-Step Reasoning" },
  { id: "3.7", query: "Which understaffed project should we prioritize?", expectedTool: "query_projects", category: "Multi-Step Reasoning" },
  { id: "3.8", query: "What's average revenue per project by priority level?", expectedTool: "calculate_revenue", category: "Multi-Step Reasoning" },
  { id: "3.9", query: "Can we move staff from fully-staffed projects to understaffed ones?", expectedTool: "query_projects", category: "Multi-Step Reasoning" },
  { id: "3.10", query: "When can we schedule a 3-day project with 4 staff?", expectedTool: "query_candidates", category: "Multi-Step Reasoning" },

  // Category 5: Data Analysis (10 tests)
  { id: "5.1", query: "Are we getting more high-priority projects over time?", expectedTool: "query_projects", category: "Data Analysis" },
  { id: "5.2", query: "What's our project completion rate?", expectedTool: "query_projects", category: "Data Analysis" },
  { id: "5.3", query: "What percentage of candidates are currently assigned?", expectedTool: "query_candidates", category: "Data Analysis" },
  { id: "5.4", query: "Is revenue increasing month-over-month?", expectedTool: "calculate_revenue", category: "Data Analysis" },
  { id: "5.5", query: "What's causing scheduling conflicts?", expectedTool: "check_scheduling_conflicts", category: "Data Analysis" },
  { id: "5.6", query: "Which skills are most requested?", expectedTool: "query_projects", category: "Data Analysis" },
  { id: "5.7", query: "Where are most projects located?", expectedTool: "query_projects", category: "Data Analysis" },
  { id: "5.8", query: "Who are our top performers?", expectedTool: "query_candidates", category: "Data Analysis" },
  { id: "5.9", query: "Which upcoming projects are at risk?", expectedTool: "query_projects", category: "Data Analysis" },
  { id: "5.10", query: "Can we handle 10 more projects this quarter?", expectedTool: "query_projects", category: "Data Analysis" },

  // Category 6: Error Handling (15 tests)
  { id: "6.1", query: "Show projects on February 30th", expectedTool: "query_projects", category: "Error Handling" },
  { id: "6.2", query: "Find candidates with quantum physics skill", expectedTool: "query_candidates", category: "Error Handling" },
  { id: "6.3", query: "Show me everything", expectedTool: null, category: "Error Handling" },
  { id: "6.4", query: "Show projects from year 1900", expectedTool: "query_projects", category: "Error Handling" },
  { id: "6.5", query: "Show projects without end dates", expectedTool: "query_projects", category: "Error Handling" },
  { id: "6.6", query: "Show projects with priority = 'tomorrow'", expectedTool: "query_projects", category: "Error Handling" },
  { id: "6.7", query: "Calculate revenue", expectedTool: "calculate_revenue", category: "Error Handling" },
  { id: "6.8", query: "Find candidates not assigned to projects they're assigned to", expectedTool: "query_candidates", category: "Error Handling" },
  { id: "6.9", query: "Show projects with 1000000 staff", expectedTool: "query_projects", category: "Error Handling" },
  { id: "6.10", query: "Find candidate with name @#$%", expectedTool: "query_candidates", category: "Error Handling" },
  { id: "6.11", query: "", expectedTool: null, category: "Error Handling" },
  { id: "6.12", query: "I need to find projects that match very specific criteria including location, date range, priority level, staffing requirements, budget constraints, client satisfaction scores, and also need to cross-reference with candidate availability while considering their skill sets and previous project history", expectedTool: "query_projects", category: "Error Handling" },
  { id: "6.13", query: "Show me projects 在北京", expectedTool: "query_projects", category: "Error Handling" },
  { id: "6.14", query: "Show projects that are both active and completed", expectedTool: "query_projects", category: "Error Handling" },

  // Category 7: Advanced Intelligence (15 tests)
  { id: "7.1", query: "We're short-staffed", expectedTool: "check_scheduling_conflicts", category: "Advanced Intelligence" },
  { id: "7.2", query: "Show MrDIY project details", expectedTool: "query_projects", category: "Advanced Intelligence" },
  { id: "7.3", query: "No candidates available Friday", expectedTool: "query_candidates", category: "Advanced Intelligence" },
  { id: "7.4", query: "Why is MrDIY project at risk?", expectedTool: "query_projects", category: "Advanced Intelligence" },
  { id: "7.5", query: "If we assign John to a new project, what happens?", expectedTool: "query_candidates", category: "Advanced Intelligence" },
  { id: "7.6", query: "Find warehouse staff", expectedTool: "query_candidates", category: "Advanced Intelligence" },
  { id: "7.7", query: "Summarize our staffing situation", expectedTool: "query_candidates", category: "Advanced Intelligence" },
  { id: "7.8", query: "Anything unusual this week?", expectedTool: "check_scheduling_conflicts", category: "Advanced Intelligence" },
  { id: "7.9", query: "What should I focus on today?", expectedTool: "query_projects", category: "Advanced Intelligence" },
  { id: "7.10", query: "Why is revenue down?", expectedTool: "calculate_revenue", category: "Advanced Intelligence" },
  { id: "7.11", query: "Should we hire more staff?", expectedTool: "query_candidates", category: "Advanced Intelligence" },
  { id: "7.12", query: "Hey, quick question about that downtown project we discussed", expectedTool: "query_projects", category: "Advanced Intelligence" },
  { id: "7.13", query: "This is urgent! Need staff NOW!", expectedTool: "query_candidates", category: "Advanced Intelligence" },
  { id: "7.14", query: "ROI if we invest in 3 more forklifts", expectedTool: "calculate_revenue", category: "Advanced Intelligence" },
  { id: "7.15", query: "How can we maximize Q4 revenue?", expectedTool: "calculate_revenue", category: "Advanced Intelligence" },
];

// Context Awareness Multi-Turn Tests (4.3-4.15)
const contextTests = [
  {
    id: "4.3",
    turns: [
      { query: "Check MrDIY project status", expectedTool: "query_projects" },
      { query: "Who is assigned to it?", expectedTool: "query_projects" }
    ],
    category: "Context Awareness"
  },
  {
    id: "4.4",
    turns: [
      { query: "Find warehouse candidates", expectedTool: "query_candidates" },
      { query: "With forklift certification", expectedTool: "query_candidates" },
      { query: "Available this week", expectedTool: "query_candidates" }
    ],
    category: "Context Awareness"
  },
  {
    id: "4.5",
    turns: [
      { query: "Show revenue for MrDIY project", expectedTool: "calculate_revenue" },
      { query: "Compare with other projects", expectedTool: "calculate_revenue" }
    ],
    category: "Context Awareness"
  },
  {
    id: "4.7",
    turns: [
      { query: "Find candidate named Sarah", expectedTool: "query_candidates" },
      { query: "What projects is she on?", expectedTool: "query_projects" }
    ],
    category: "Context Awareness"
  },
  {
    id: "4.9",
    turns: [
      { query: "Check conflicts for next week", expectedTool: "check_scheduling_conflicts" },
      { query: "What about the week after?", expectedTool: "check_scheduling_conflicts" }
    ],
    category: "Context Awareness"
  },
  {
    id: "4.10",
    turns: [
      { query: "Calculate total revenue", expectedTool: "calculate_revenue" },
      { query: "Break it down by month", expectedTool: "calculate_revenue" }
    ],
    category: "Context Awareness"
  },
  {
    id: "4.11",
    turns: [
      { query: "How many projects?", expectedTool: "query_projects" },
      { query: "Show me the complete list", expectedTool: "query_projects" }
    ],
    category: "Context Awareness"
  },
  {
    id: "4.14",
    turns: [
      { query: "Revenue this month", expectedTool: "calculate_revenue" },
      { query: "vs last month", expectedTool: "calculate_revenue" }
    ],
    category: "Context Awareness"
  },
];

console.log("AI Chatbot Test Scenarios Loaded");
console.log(`Total Single-Query Tests: ${testScenarios.length}`);
console.log(`Total Context-Aware Multi-Turn Tests: ${contextTests.length}`);
console.log(`Total Test Scenarios: ${testScenarios.length + contextTests.reduce((acc, t) => acc + t.turns.length, 0)}`);
