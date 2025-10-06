const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runTests() {
  console.log('Running ProjectsPageRedesign tests...\n');

  try {
    const { stdout, stderr } = await execPromise(
      'npx vitest run src/pages/__tests__/ProjectsPageRedesign.test.tsx --reporter=verbose 2>&1 | grep -E "✓|×|Test Files|Tests|Start|Duration" | head -100',
      { maxBuffer: 1024 * 1024 * 10, timeout: 120000 }
    );

    // Parse the output for summary
    const lines = stdout.split('\n').filter(line => line.trim());

    console.log('Test Results Summary:');
    console.log('=====================\n');

    // Count passes and failures
    const passes = lines.filter(line => line.includes('✓')).length;
    const failures = lines.filter(line => line.includes('×')).length;

    console.log(`✅ Passing tests: ${passes}`);
    console.log(`❌ Failing tests: ${failures}`);
    console.log(`📊 Total tests: ${passes + failures}`);

    if (passes + failures > 0) {
      console.log(`✨ Pass rate: ${((passes / (passes + failures)) * 100).toFixed(1)}%\n`);
    }

    // Show some sample results
    console.log('Sample test results:');
    console.log('-------------------');
    lines.slice(0, 20).forEach(line => console.log(line));

  } catch (error) {
    console.error('Error running tests:', error.message);

    // Try a simpler approach
    console.log('\nTrying simpler test run...');
    try {
      const { stdout } = await execPromise(
        'npx vitest run src/pages/__tests__/ProjectsPageRedesign.test.tsx --reporter=json',
        { maxBuffer: 1024 * 1024 * 10, timeout: 120000 }
      );

      const results = JSON.parse(stdout);
      if (results.testResults && results.testResults[0]) {
        const testFile = results.testResults[0];
        console.log(`\nTests in file: ${testFile.assertionResults.length}`);
        console.log(`Passed: ${testFile.assertionResults.filter(r => r.status === 'passed').length}`);
        console.log(`Failed: ${testFile.assertionResults.filter(r => r.status === 'failed').length}`);
      }
    } catch (jsonError) {
      console.error('JSON parsing also failed');
    }
  }
}

runTests();