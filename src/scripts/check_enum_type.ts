import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yihtesaawdzkgxukhlfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpaHRlc2Fhd2R6a2d4dWtobGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMDQ3ODUsImV4cCI6MjA1NDU4MDc4NX0.6pV98JpsEXMQyopmOTypmfmTpAg49v1EnrWNSovUOVU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnumType() {
  try {
    // Try to update the admin user with an existing role
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', 'noobxkevin@gmail.com')
      .select();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return;
    }

    console.log('User updated:', updateData);

    // Now add is_super_admin boolean column
    const { data: addColumnData, error: addColumnError } = await supabase
      .from('users')
      .update({ is_super_admin: true })
      .eq('email', 'noobxkevin@gmail.com')
      .select();

    if (addColumnError) {
      console.error('Error adding column:', addColumnError);
      return;
    }

    console.log('Column added and user updated:', addColumnData);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkEnumType();
