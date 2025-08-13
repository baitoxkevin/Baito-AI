// Test script to verify project creation works with the updated schema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugmniohuvoprarccquso.supabase.co';
const supabaseAnonKey = 'YOUR_ANON_KEY'; // Replace with actual anon key

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProjectCreation() {
  console.log('Testing project creation...');
  
  const projectData = {
    title: 'Test Project from Script',
    client_id: '11111111-1111-1111-1111-111111111111', // Acme Corp
    manager_id: '3ec143d2-9dcd-4290-b1de-d36507f9bd69', // Laili
    brand_name: 'Test Brand',
    brand_logo: 'https://via.placeholder.com/150',
    event_type: 'Conference',
    venue_address: '123 Test Street, Test City',
    venue_details: 'Conference Room A',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    schedule_type: 'single',
    crew_count: 10,
    supervisors_required: 2,
    status: 'planning',
    priority: 'medium',
    budget: 5000,
    invoice_number: 'INV-2025-001',
    cc_client_ids: [],
    cc_user_ids: [],
    project_type: 'internal_event',
    description: 'Test project created via script',
    name: 'Test Project from Script' // Include name for backward compatibility
  };

  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return;
    }

    console.log('Project created successfully:', data);
    
    // Clean up - delete the test project
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', data.id);
      
    if (deleteError) {
      console.error('Error deleting test project:', deleteError);
    } else {
      console.log('Test project cleaned up successfully');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the test
testProjectCreation();