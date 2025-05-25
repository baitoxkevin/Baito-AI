import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://npixytgh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5waXh5dGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxNTQxNzUsImV4cCI6MjAzOTczMDE3NX0.EtMFLvUKaVqHqmOG4yg89Hc_d9y-F0_n6aD5m9-4kGE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCandidate() {
  const { data, error } = await supabase
    .from('candidates')
    .select(`
      id,
      full_name,
      race,
      shirt_size,
      languages_spoken,
      emergency_contact_relationship,
      highest_education,
      field_of_study,
      gender,
      nationality,
      phone_number,
      email,
      updated_at
    `)
    .eq('id', '2ffe1842-b87b-4b37-bd8e-d4b449253cef')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Candidate data:', JSON.stringify(data, null, 2));
}

checkCandidate();