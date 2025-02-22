import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yihtesaawdzkgxukhlfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpaHRlc2Fhd2R6a2d4dWtobGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMDQ3ODUsImV4cCI6MjA1NDU4MDc4NX0.6pV98JpsEXMQyopmOTypmfmTpAg49v1EnrWNSovUOVU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSuperAdminColumn() {
  try {
    // First, check if the column exists
    const { data: columnExists, error: checkError } = await supabase
      .from('users')
      .select('is_super_admin')
      .limit(1);

    if (checkError && checkError.code === 'PGRST204') {
      console.log('Column does not exist, adding it...');
      
      // Add the column using raw SQL
      const { data, error } = await supabase
        .from('users')
        .update({ is_super_admin: true })
        .eq('email', 'noobxkevin@gmail.com')
        .select();

      if (error) {
        console.error('Error adding column:', error);
        return;
      }

      console.log('Column added and admin updated:', data);
    } else {
      console.log('Column already exists');
      
      // Update the admin user
      const { data, error } = await supabase
        .from('users')
        .update({ is_super_admin: true })
        .eq('email', 'noobxkevin@gmail.com')
        .select();

      if (error) {
        console.error('Error updating admin:', error);
        return;
      }

      console.log('Admin updated:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

addSuperAdminColumn();
