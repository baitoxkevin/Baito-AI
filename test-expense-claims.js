const { createClient } = require('@supabase/supabase-js');

// Get Supabase URL and anon key from environment or hardcode for testing
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testExpenseClaims() {
  try {
    console.log('Testing expense claims table...\n');
    
    // Test 1: Check if table exists
    const { data: tableTest, error: tableError } = await supabase
      .from('expense_claims')
      .select('count')
      .limit(1);
      
    if (tableError) {
      console.error('Table error:', tableError);
      return;
    }
    
    console.log('✓ Table exists\n');
    
    // Test 2: Fetch all expense claims
    const { data: allClaims, error: allError } = await supabase
      .from('expense_claims')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (allError) {
      console.error('Error fetching all claims:', allError);
    } else {
      console.log(`✓ Found ${allClaims?.length || 0} total expense claims\n`);
      if (allClaims && allClaims.length > 0) {
        console.log('Sample claim:', JSON.stringify(allClaims[0], null, 2));
      }
    }
    
    // Test 3: Check RLS policies
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('⚠️  Not authenticated - this might affect RLS policies');
    } else {
      console.log(`✓ Authenticated as user: ${user.email}`);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testExpenseClaims();