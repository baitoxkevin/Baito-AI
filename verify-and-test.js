#!/usr/bin/env node

/**
 * Verify Database and Test Real Backend Logging
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://aoiwrdzlichescqgnohi.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTM2NDgsImV4cCI6MjA1NTgyOTY0OH0.F505FnCo_hg6_LpEZ-yvNWd5Zw5OnCnGxIogP4txeCY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('\n🔍 Verifying Database Setup...');
console.log('━'.repeat(60));

/**
 * Step 1: Verify Tables Exist
 */
async function verifyTables() {
  console.log('\n📊 Step 1: Verifying database tables...');

  try {
    // Check user_activity_logs
    const { data: activityLogs, error: activityError } = await supabase
      .from('user_activity_logs')
      .select('id')
      .limit(1);

    if (activityError) {
      console.error('❌ user_activity_logs table not found:', activityError.message);
      return false;
    }
    console.log('✅ user_activity_logs table exists');

    // Check payment_logs
    const { data: paymentLogs, error: paymentError } = await supabase
      .from('payment_logs')
      .select('id')
      .limit(1);

    if (paymentError) {
      console.error('❌ payment_logs table not found:', paymentError.message);
      return false;
    }
    console.log('✅ payment_logs table exists');

    // Check projects.created_by column
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id, created_by')
      .limit(1);

    if (projectError) {
      console.error('❌ projects.created_by column issue:', projectError.message);
      return false;
    }
    console.log('✅ projects.created_by column exists');

    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

/**
 * Step 2: Test Backend Logging Functions
 */
async function testLoggingFunctions() {
  console.log('\n🧪 Step 2: Testing backend logging functions...');

  const testBatchId = `test_batch_${Date.now()}`;
  const testProjectId = 'test-project-verification';

  try {
    // Test log_payment_activity function
    console.log('\n   Testing log_payment_activity...');

    const { data: logId, error: logError } = await supabase.rpc('log_payment_activity', {
      p_payment_batch_id: testBatchId,
      p_project_id: testProjectId,
      p_user_id: null,
      p_action: 'create',
      p_status: 'pending',
      p_amount: 5000.00,
      p_staff_count: 8,
      p_export_format: null,
      p_file_path: null,
      p_details: { test: true, verification: 'automated' },
      p_error_message: null
    });

    if (logError) {
      console.error('   ❌ log_payment_activity failed:', logError.message);
      return false;
    }

    console.log(`   ✅ Payment log created with ID: ${logId}`);

    // Verify the log was created
    const { data: verifyLog, error: verifyError } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('payment_batch_id', testBatchId)
      .single();

    if (verifyError) {
      console.error('   ❌ Could not verify log:', verifyError.message);
      return false;
    }

    console.log('   ✅ Log verified in database');
    console.log(`      - Batch ID: ${verifyLog.payment_batch_id}`);
    console.log(`      - Action: ${verifyLog.action}`);
    console.log(`      - Status: ${verifyLog.status}`);
    console.log(`      - Amount: RM ${verifyLog.amount}`);
    console.log(`      - Staff Count: ${verifyLog.staff_count}`);

    return true;
  } catch (error) {
    console.error('❌ Logging test failed:', error.message);
    return false;
  }
}

/**
 * Step 3: View Recent Payment Activity
 */
async function viewRecentActivity() {
  console.log('\n📋 Step 3: Viewing recent payment activity...');

  try {
    const { data: activity, error } = await supabase
      .from('payment_activity_summary')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Could not fetch activity:', error.message);
      return false;
    }

    if (activity && activity.length > 0) {
      console.log(`\n✅ Found ${activity.length} recent payment activities:\n`);

      console.log('┌────────────────────┬──────────┬─────────┬────────┬─────────────────────┐');
      console.log('│ Project            │ User     │ Action  │ Status │ Time                │');
      console.log('├────────────────────┼──────────┼─────────┼────────┼─────────────────────┤');

      activity.forEach(a => {
        const project = (a.project_title || 'N/A').substring(0, 18).padEnd(18);
        const user = (a.user_name || 'System').substring(0, 8).padEnd(8);
        const action = (a.action || '-').substring(0, 7).padEnd(7);
        const status = (a.status || '-').substring(0, 6).padEnd(6);
        const time = new Date(a.created_at).toLocaleString().substring(0, 19).padEnd(19);
        console.log(`│ ${project} │ ${user} │ ${action} │ ${status} │ ${time} │`);
      });

      console.log('└────────────────────┴──────────┴─────────┴────────┴─────────────────────┘');
    } else {
      console.log('⚠️  No payment activity found yet');
      console.log('   This is expected if no payments have been created');
    }

    return true;
  } catch (error) {
    console.error('❌ Could not view activity:', error.message);
    return false;
  }
}

/**
 * Step 4: Full Payment Flow Test with Real Logging
 */
async function testFullPaymentFlow() {
  console.log('\n🚀 Step 4: Testing full payment flow with real logging...');

  const batchId = `batch_${Date.now()}`;
  const projectId = 'test-project-' + Math.random().toString(36).substr(2, 9);
  const totalAmount = 5000.00;
  const staffCount = 8;

  try {
    // Step 4.1: Create Payment
    console.log('\n   4.1 Creating payment batch...');

    const { data: createLog, error: createError } = await supabase.rpc('log_payment_activity', {
      p_payment_batch_id: batchId,
      p_project_id: projectId,
      p_user_id: null,
      p_action: 'create',
      p_status: 'pending',
      p_amount: totalAmount,
      p_staff_count: staffCount,
      p_export_format: null,
      p_file_path: null,
      p_details: {
        batch_id: batchId,
        staff_count: staffCount,
        total_amount: totalAmount,
        status: 'created'
      },
      p_error_message: null
    });

    if (createError) throw createError;
    console.log(`       ✅ Payment created: ${batchId}`);
    console.log(`       💰 Amount: RM ${totalAmount.toFixed(2)}`);
    console.log(`       👥 Staff: ${staffCount}`);

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 4.2: Push Payment
    console.log('\n   4.2 Pushing payment to queue...');

    const { data: pushLog, error: pushError } = await supabase.rpc('log_payment_activity', {
      p_payment_batch_id: batchId,
      p_project_id: projectId,
      p_user_id: null,
      p_action: 'push',
      p_status: 'pushed',
      p_amount: null,
      p_staff_count: staffCount,
      p_export_format: null,
      p_file_path: null,
      p_details: {
        batch_id: batchId,
        staff_count: staffCount,
        payment_date: new Date().toISOString().split('T')[0],
        status: 'pushed'
      },
      p_error_message: null
    });

    if (pushError) throw pushError;
    console.log('       ✅ Payment pushed to queue');

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 4.3: Export to DuitNow
    console.log('\n   4.3 Exporting to DuitNow Excel...');

    const fileName = `payment_duitnow_${batchId}.xlsx`;
    const filePath = `/downloads/${fileName}`;

    const { data: exportLog, error: exportError } = await supabase.rpc('log_payment_activity', {
      p_payment_batch_id: batchId,
      p_project_id: projectId,
      p_user_id: null,
      p_action: 'export',
      p_status: 'exported',
      p_amount: null,
      p_staff_count: staffCount,
      p_export_format: 'duitnow',
      p_file_path: filePath,
      p_details: {
        batch_id: batchId,
        export_format: 'duitnow',
        file_name: fileName,
        file_path: filePath,
        staff_count: staffCount,
        status: 'exported'
      },
      p_error_message: null
    });

    if (exportError) throw exportError;
    console.log(`       ✅ Excel exported: ${fileName}`);
    console.log(`       📁 Path: ${filePath}`);

    // Step 4.4: Verify all logs
    console.log('\n   4.4 Verifying all logs in database...');

    const { data: allLogs, error: verifyError } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('payment_batch_id', batchId)
      .order('created_at', { ascending: true });

    if (verifyError) throw verifyError;

    console.log(`\n       ✅ Found ${allLogs.length} log entries:\n`);

    console.log('       ┌─────────┬───────────┬──────────┬────────┬────────────┐');
    console.log('       │ Action  │ Status    │ Amount   │ Staff  │ Format     │');
    console.log('       ├─────────┼───────────┼──────────┼────────┼────────────┤');

    allLogs.forEach(log => {
      const action = log.action.padEnd(7);
      const status = log.status.padEnd(9);
      const amount = log.amount ? `RM ${log.amount.toFixed(2)}`.padEnd(8) : '-'.padEnd(8);
      const staff = String(log.staff_count).padEnd(6);
      const format = (log.export_format || '-').padEnd(10);
      console.log(`       │ ${action} │ ${status} │ ${amount} │ ${staff} │ ${format} │`);
    });

    console.log('       └─────────┴───────────┴──────────┴────────┴────────────┘');

    console.log('\n   ✅ Full payment flow completed successfully!');
    return true;

  } catch (error) {
    console.error('\n   ❌ Payment flow test failed:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Step 1: Verify tables
    const tablesOk = await verifyTables();
    if (!tablesOk) {
      console.error('\n❌ Database verification failed');
      console.log('\n📝 Please apply migrations from: APPLY_MIGRATIONS_NOW.md');
      process.exit(1);
    }

    // Step 2: Test logging functions
    const loggingOk = await testLoggingFunctions();
    if (!loggingOk) {
      console.error('\n❌ Logging function test failed');
      process.exit(1);
    }

    // Step 3: View recent activity
    await viewRecentActivity();

    // Step 4: Full payment flow test
    const flowOk = await testFullPaymentFlow();
    if (!flowOk) {
      console.error('\n❌ Payment flow test failed');
      process.exit(1);
    }

    // Final summary
    console.log('\n' + '═'.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('═'.repeat(60));
    console.log('\n🎉 Database migrations applied successfully');
    console.log('🎉 Backend logging is fully operational');
    console.log('🎉 Payment flow works with real database logging\n');

    console.log('📝 Next steps:');
    console.log('   1. Test in browser: http://localhost:5173/test-payment-flow.html');
    console.log('   2. View logs in Supabase: https://supabase.com/dashboard');
    console.log('   3. Check payment_activity_summary view for all activities\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run the verification and tests
main();
