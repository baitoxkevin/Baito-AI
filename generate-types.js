require('dotenv').config();
const { execSync } = require('child_process');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

try {
  console.log('Generating database types...');
  execSync(`npx supabase gen types typescript --project-id ${supabaseUrl.split('.')[0].split('//')[1]} > src/lib/database.types.ts`, {
    stdio: 'inherit'
  });
  console.log('Database types generated successfully!');
} catch (error) {
  console.error('Error generating types:', error);
  process.exit(1);
}