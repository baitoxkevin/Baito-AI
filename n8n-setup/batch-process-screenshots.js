#!/usr/bin/env node

/**
 * Batch process multiple Excel screenshots through Vision AI
 * Usage: node batch-process-screenshots.js <directory>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCREENSHOTS_DIR = process.argv[2];
const DELAY_MS = 2000; // Delay between requests to avoid rate limits

if (!SCREENSHOTS_DIR) {
  console.error('❌ Usage: node batch-process-screenshots.js <directory>');
  console.error('\nExample:');
  console.error('  node batch-process-screenshots.js excel_screenshots/');
  process.exit(1);
}

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  console.error(`❌ Directory not found: ${SCREENSHOTS_DIR}`);
  process.exit(1);
}

// Get all image files
const files = fs.readdirSync(SCREENSHOTS_DIR)
  .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
  .sort();

if (files.length === 0) {
  console.error(`❌ No image files found in ${SCREENSHOTS_DIR}`);
  console.error('   Expected: .png, .jpg, or .jpeg files');
  process.exit(1);
}

console.log('🚀 Batch Vision AI Excel Extraction\n');
console.log('━'.repeat(60));
console.log(`📁 Directory: ${SCREENSHOTS_DIR}`);
console.log(`📸 Files found: ${files.length}`);
console.log(`⏱️  Delay between requests: ${DELAY_MS}ms`);
console.log(`⏳ Estimated time: ${Math.ceil(files.length * (DELAY_MS + 45000) / 60000)} minutes`);
console.log('━'.repeat(60));
console.log('');

const results = {
  total: files.length,
  processed: 0,
  successful: 0,
  failed: 0,
  errors: [],
  totalCandidates: 0,
  totalPayment: 0,
  outputs: []
};

// Process each file
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const filePath = path.join(SCREENSHOTS_DIR, file);

  console.log(`\n[${ i + 1 }/${files.length}] Processing: ${file}`);
  console.log('─'.repeat(60));

  try {
    // Run the single file processor
    const scriptPath = path.join(__dirname, 'test-vision-to-excel.js');
    const output = execSync(`node "${scriptPath}" "${filePath}"`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    // Display output
    console.log(output);

    // Try to extract results from output
    const extractedMatch = output.match(/Records Extracted: (\d+)/);
    const paymentMatch = output.match(/Total Payment: RM ([\d,.]+)/);

    if (extractedMatch) {
      const count = parseInt(extractedMatch[1]);
      results.totalCandidates += count;
      results.successful++;

      if (paymentMatch) {
        const amount = parseFloat(paymentMatch[1].replace(/,/g, ''));
        results.totalPayment += amount;
      }

      results.outputs.push({
        file: file,
        status: 'success',
        candidates: count,
        payment: paymentMatch ? parseFloat(paymentMatch[1].replace(/,/g, '')) : 0
      });

      console.log(`✅ Success: ${count} candidates extracted`);
    } else {
      results.successful++;
      results.outputs.push({
        file: file,
        status: 'success',
        candidates: 0,
        payment: 0
      });
    }

  } catch (error) {
    console.error(`❌ Failed to process ${file}:`);
    console.error(error.message);

    results.failed++;
    results.errors.push({
      file: file,
      error: error.message
    });

    results.outputs.push({
      file: file,
      status: 'failed',
      error: error.message
    });
  }

  results.processed++;

  // Delay before next request (except for last file)
  if (i < files.length - 1) {
    console.log(`\n⏳ Waiting ${DELAY_MS}ms before next request...`);
    execSync(`sleep ${DELAY_MS / 1000}`, { stdio: 'ignore' });
  }
}

// Final summary
console.log('\n\n');
console.log('═'.repeat(60));
console.log('📊 BATCH PROCESSING SUMMARY');
console.log('═'.repeat(60));
console.log('');
console.log(`   Total Files: ${results.total}`);
console.log(`   Processed: ${results.processed}`);
console.log(`   Successful: ${results.successful} (${(results.successful / results.total * 100).toFixed(1)}%)`);
console.log(`   Failed: ${results.failed} (${(results.failed / results.total * 100).toFixed(1)}%)`);
console.log('');
console.log(`   Total Candidates Extracted: ${results.totalCandidates}`);
console.log(`   Total Payment Sum: RM ${results.totalPayment.toFixed(2)}`);
console.log('');

if (results.errors.length > 0) {
  console.log('❌ FAILED FILES:\n');
  results.errors.forEach((err, i) => {
    console.log(`   ${i + 1}. ${err.file}`);
    console.log(`      Error: ${err.error}\n`);
  });
}

// Save summary
const summaryFile = `batch-summary-${Date.now()}.json`;
fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2));

console.log('═'.repeat(60));
console.log(`📄 Summary saved to: ${summaryFile}`);
console.log('');
console.log('🎯 Next Steps:');
console.log('   1. Review individual Excel output files');
console.log('   2. Check validation reports for issues');
console.log('   3. Merge all outputs: node merge-extracted-excels.js');
console.log('   4. Import to Supabase: node import-to-supabase.js');
console.log('');
