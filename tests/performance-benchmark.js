/**
 * Performance Benchmark Suite for Baito-AI
 * Run with: node tests/performance-benchmark.js
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';
import fs from 'fs';

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const API_URL = process.env.VITE_SUPABASE_URL || '';
const API_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// Benchmark results storage
const results = {
  pageLoad: [],
  apiResponse: [],
  dbQuery: [],
  fileUpload: [],
  searchPerformance: [],
  concurrentUsers: []
};

// Utility functions
function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function percentile(arr, p) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[index];
}

async function measureTime(fn, label) {
  const start = performance.now();
  try {
    await fn();
    const duration = performance.now() - start;
    console.log(`✅ ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  } catch (error) {
    console.error(`❌ ${label} failed:`, error.message);
    return null;
  }
}

// Benchmark Tests

/**
 * 1. Page Load Performance
 */
async function benchmarkPageLoad() {
  console.log('\n📊 Testing Page Load Performance...');

  const pages = [
    { path: '/', name: 'Homepage' },
    { path: '/projects', name: 'Projects Page' },
    { path: '/candidates', name: 'Candidates Page' },
    { path: '/calendar', name: 'Calendar Page' }
  ];

  for (const page of pages) {
    const times = [];

    for (let i = 0; i < 5; i++) {
      const time = await measureTime(
        async () => {
          const response = await fetch(`${BASE_URL}${page.path}`);
          await response.text();
        },
        `${page.name} - Run ${i + 1}`
      );

      if (time) times.push(time);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between tests
    }

    if (times.length > 0) {
      results.pageLoad.push({
        page: page.name,
        avg: average(times),
        min: Math.min(...times),
        max: Math.max(...times),
        p95: percentile(times, 95)
      });
    }
  }
}

/**
 * 2. API Response Time
 */
async function benchmarkAPIResponse() {
  console.log('\n📊 Testing API Response Times...');

  const endpoints = [
    { table: 'projects', name: 'Projects API' },
    { table: 'candidates', name: 'Candidates API' },
    { table: 'expense_claims', name: 'Expense Claims API' }
  ];

  for (const endpoint of endpoints) {
    const times = [];

    for (let i = 0; i < 10; i++) {
      const time = await measureTime(
        async () => {
          const response = await fetch(
            `${API_URL}/rest/v1/${endpoint.table}?limit=10`,
            {
              headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${API_KEY}`
              }
            }
          );
          await response.json();
        },
        `${endpoint.name} - Run ${i + 1}`
      );

      if (time) times.push(time);
    }

    if (times.length > 0) {
      results.apiResponse.push({
        endpoint: endpoint.name,
        avg: average(times),
        min: Math.min(...times),
        max: Math.max(...times),
        p95: percentile(times, 95)
      });
    }
  }
}

/**
 * 3. Database Query Performance
 */
async function benchmarkDatabaseQueries() {
  console.log('\n📊 Testing Database Query Performance...');

  const queries = [
    {
      name: 'Simple SELECT',
      query: async () => {
        const response = await fetch(
          `${API_URL}/rest/v1/projects?select=id,title&limit=1`,
          {
            headers: {
              'apikey': API_KEY,
              'Authorization': `Bearer ${API_KEY}`
            }
          }
        );
        return response.json();
      }
    },
    {
      name: 'JOIN Query',
      query: async () => {
        const response = await fetch(
          `${API_URL}/rest/v1/projects?select=*,project_staff(*)&limit=10`,
          {
            headers: {
              'apikey': API_KEY,
              'Authorization': `Bearer ${API_KEY}`
            }
          }
        );
        return response.json();
      }
    },
    {
      name: 'Aggregation Query',
      query: async () => {
        const response = await fetch(
          `${API_URL}/rest/v1/rpc/get_project_statistics`,
          {
            method: 'POST',
            headers: {
              'apikey': API_KEY,
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          }
        );
        return response.json();
      }
    }
  ];

  for (const queryTest of queries) {
    const times = [];

    for (let i = 0; i < 10; i++) {
      const time = await measureTime(
        queryTest.query,
        `${queryTest.name} - Run ${i + 1}`
      );

      if (time) times.push(time);
    }

    if (times.length > 0) {
      results.dbQuery.push({
        query: queryTest.name,
        avg: average(times),
        min: Math.min(...times),
        max: Math.max(...times),
        p95: percentile(times, 95)
      });
    }
  }
}

/**
 * 4. Search Performance
 */
async function benchmarkSearch() {
  console.log('\n📊 Testing Search Performance...');

  const searchTerms = [
    { term: 'John', table: 'candidates' },
    { term: 'Project', table: 'projects' },
    { term: '2024', table: 'projects' }
  ];

  for (const search of searchTerms) {
    const times = [];

    for (let i = 0; i < 5; i++) {
      const time = await measureTime(
        async () => {
          const response = await fetch(
            `${API_URL}/rest/v1/${search.table}?or=(title.ilike.*${search.term}*,name.ilike.*${search.term}*)`,
            {
              headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${API_KEY}`
              }
            }
          );
          await response.json();
        },
        `Search "${search.term}" in ${search.table} - Run ${i + 1}`
      );

      if (time) times.push(time);
    }

    if (times.length > 0) {
      results.searchPerformance.push({
        search: `${search.term} in ${search.table}`,
        avg: average(times),
        min: Math.min(...times),
        max: Math.max(...times),
        p95: percentile(times, 95)
      });
    }
  }
}

/**
 * 5. Concurrent Users Simulation
 */
async function benchmarkConcurrentUsers() {
  console.log('\n📊 Testing Concurrent Users...');

  const userCounts = [10, 50, 100];

  for (const count of userCounts) {
    console.log(`\nSimulating ${count} concurrent users...`);

    const promises = [];
    const times = [];

    for (let i = 0; i < count; i++) {
      promises.push(
        measureTime(
          async () => {
            const response = await fetch(
              `${API_URL}/rest/v1/projects?limit=5`,
              {
                headers: {
                  'apikey': API_KEY,
                  'Authorization': `Bearer ${API_KEY}`
                }
              }
            );
            await response.json();
          },
          `User ${i + 1}`
        )
      );
    }

    const start = performance.now();
    const userTimes = await Promise.all(promises);
    const totalTime = performance.now() - start;

    const validTimes = userTimes.filter(t => t !== null);

    if (validTimes.length > 0) {
      results.concurrentUsers.push({
        users: count,
        totalTime: totalTime,
        avgPerUser: average(validTimes),
        successRate: `${(validTimes.length / count * 100).toFixed(1)}%`,
        p95: percentile(validTimes, 95)
      });
    }
  }
}

/**
 * 6. Memory Usage Test
 */
async function benchmarkMemoryUsage() {
  console.log('\n📊 Testing Memory Usage...');

  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memStart = process.memoryUsage();

    // Simulate heavy operations
    const data = [];
    for (let i = 0; i < 1000; i++) {
      data.push({
        id: i,
        title: `Project ${i}`,
        description: 'A'.repeat(1000),
        metadata: new Array(100).fill(0)
      });
    }

    const memEnd = process.memoryUsage();

    console.log('Memory Usage:');
    console.log(`  Heap Used: ${((memEnd.heapUsed - memStart.heapUsed) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  RSS: ${(memEnd.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  External: ${(memEnd.external / 1024 / 1024).toFixed(2)} MB`);
  }
}

/**
 * Generate Performance Report
 */
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📈 PERFORMANCE BENCHMARK REPORT - BAITO-AI');
  console.log('='.repeat(80));

  // Page Load Results
  if (results.pageLoad.length > 0) {
    console.log('\n🌐 PAGE LOAD PERFORMANCE');
    console.log('-'.repeat(40));
    results.pageLoad.forEach(r => {
      console.log(`${r.page}:`);
      console.log(`  Average: ${r.avg.toFixed(2)}ms`);
      console.log(`  Min: ${r.min.toFixed(2)}ms | Max: ${r.max.toFixed(2)}ms`);
      console.log(`  P95: ${r.p95.toFixed(2)}ms`);
      console.log(`  Status: ${r.avg < 3000 ? '✅ PASS' : '❌ FAIL (>3s)'}`);
    });
  }

  // API Response Results
  if (results.apiResponse.length > 0) {
    console.log('\n⚡ API RESPONSE TIMES');
    console.log('-'.repeat(40));
    results.apiResponse.forEach(r => {
      console.log(`${r.endpoint}:`);
      console.log(`  Average: ${r.avg.toFixed(2)}ms`);
      console.log(`  P95: ${r.p95.toFixed(2)}ms`);
      console.log(`  Status: ${r.avg < 500 ? '✅ PASS' : '⚠️  SLOW (>500ms)'}`);
    });
  }

  // Database Query Results
  if (results.dbQuery.length > 0) {
    console.log('\n🗄️  DATABASE QUERY PERFORMANCE');
    console.log('-'.repeat(40));
    results.dbQuery.forEach(r => {
      console.log(`${r.query}:`);
      console.log(`  Average: ${r.avg.toFixed(2)}ms`);
      console.log(`  P95: ${r.p95.toFixed(2)}ms`);
      console.log(`  Status: ${r.avg < 200 ? '✅ FAST' : r.avg < 500 ? '⚠️  OK' : '❌ SLOW'}`);
    });
  }

  // Search Performance Results
  if (results.searchPerformance.length > 0) {
    console.log('\n🔍 SEARCH PERFORMANCE');
    console.log('-'.repeat(40));
    results.searchPerformance.forEach(r => {
      console.log(`Search ${r.search}:`);
      console.log(`  Average: ${r.avg.toFixed(2)}ms`);
      console.log(`  P95: ${r.p95.toFixed(2)}ms`);
    });
  }

  // Concurrent Users Results
  if (results.concurrentUsers.length > 0) {
    console.log('\n👥 CONCURRENT USERS LOAD TEST');
    console.log('-'.repeat(40));
    results.concurrentUsers.forEach(r => {
      console.log(`${r.users} Concurrent Users:`);
      console.log(`  Total Time: ${r.totalTime.toFixed(2)}ms`);
      console.log(`  Avg Per User: ${r.avgPerUser.toFixed(2)}ms`);
      console.log(`  Success Rate: ${r.successRate}`);
      console.log(`  P95: ${r.p95.toFixed(2)}ms`);
    });
  }

  // Performance Thresholds
  console.log('\n📊 PERFORMANCE THRESHOLDS');
  console.log('-'.repeat(40));
  console.log('✅ PASS Thresholds:');
  console.log('  - Page Load: < 3000ms');
  console.log('  - API Response: < 500ms');
  console.log('  - DB Query: < 200ms');
  console.log('  - Search: < 1000ms');
  console.log('  - 100 Users: < 2000ms avg');

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('-'.repeat(40));

  const avgPageLoad = results.pageLoad.length > 0
    ? average(results.pageLoad.map(r => r.avg))
    : 0;

  if (avgPageLoad > 3000) {
    console.log('⚠️  Page load is slow. Consider:');
    console.log('   - Implementing code splitting');
    console.log('   - Optimizing bundle size');
    console.log('   - Adding CDN');
  }

  const avgAPI = results.apiResponse.length > 0
    ? average(results.apiResponse.map(r => r.avg))
    : 0;

  if (avgAPI > 500) {
    console.log('⚠️  API responses are slow. Consider:');
    console.log('   - Adding database indexes');
    console.log('   - Implementing caching');
    console.log('   - Optimizing queries');
  }

  console.log('\n' + '='.repeat(80));
}

// Main execution
async function runBenchmarks() {
  console.log('🚀 Starting Baito-AI Performance Benchmarks...');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`API URL: ${API_URL}`);
  console.log('-'.repeat(80));

  try {
    // Run all benchmarks
    await benchmarkPageLoad();
    await benchmarkAPIResponse();
    await benchmarkDatabaseQueries();
    await benchmarkSearch();
    await benchmarkConcurrentUsers();
    await benchmarkMemoryUsage();

    // Generate report
    generateReport();

    // Export results
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `benchmark-results-${timestamp}.json`;

    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`\n📁 Results saved to: ${filename}`);

  } catch (error) {
    console.error('❌ Benchmark failed:', error);
  }
}

// Run benchmarks
runBenchmarks();

export { runBenchmarks, results };