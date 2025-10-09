/**
 * Seed Test Projects for Calendar Testing
 *
 * This script creates realistic test projects to showcase
 * the calendar improvements including:
 * - Single-day events
 * - Multi-day events
 * - Various event types
 * - Different times
 * - Mixed priorities and statuses
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aoiwrdzlichescqgnohi.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTM2NDgsImV4cCI6MjA1NTgyOTY0OH0.F505FnCo_hg6_LpEZ-yvNWd5Zw5OnCnGxIogP4txeCY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Get today and create date helpers
const today = new Date();
const getDate = (daysOffset = 0) => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

// Color palette for visual variety
const colors = {
  production: '#3B82F6',    // Blue
  meeting: '#F59E0B',       // Amber
  corporate: '#8B5CF6',     // Purple
  wedding: '#EC4899',       // Pink
  conference: '#10B981',    // Emerald
  concert: '#EF4444',       // Red
  festival: '#F97316',      // Orange
};

// Test projects data
const testProjects = [
  // TODAY - Multiple events to show time display
  {
    title: 'Morning Team Meeting',
    event_type: 'Meeting',
    start_date: getDate(0),
    end_date: getDate(0),
    working_hours_start: '09:00',
    working_hours_end: '10:30',
    venue_address: 'Conference Room A, Main Office',
    crew_count: 8,
    filled_positions: 6,
    status: 'Active',
    priority: 'High',
    color: colors.meeting,
    description: 'Weekly team sync to discuss project updates and priorities',
  },
  {
    title: 'Product Launch Event',
    event_type: 'Corporate',
    start_date: getDate(0),
    end_date: getDate(0),
    working_hours_start: '14:00',
    working_hours_end: '18:00',
    venue_address: 'Downtown Convention Center, Hall B',
    crew_count: 25,
    filled_positions: 25,
    status: 'Active',
    priority: 'High',
    color: colors.corporate,
    description: 'Major product launch with press conference and demo',
  },
  {
    title: 'Evening Networking Mixer',
    event_type: 'Corporate',
    start_date: getDate(0),
    end_date: getDate(0),
    working_hours_start: '19:00',
    working_hours_end: '22:00',
    venue_address: 'Sky Lounge, 42nd Floor, City Tower',
    crew_count: 12,
    filled_positions: 10,
    status: 'Active',
    priority: 'Medium',
    color: colors.corporate,
    description: 'Networking event for industry professionals',
  },

  // TOMORROW - Multi-day event starting
  {
    title: 'Tech Conference 2025',
    event_type: 'Conference',
    start_date: getDate(1),
    end_date: getDate(3),
    working_hours_start: '08:00',
    working_hours_end: '18:00',
    venue_address: 'Grand Convention Center, Exhibition Hall 1-3',
    crew_count: 50,
    filled_positions: 45,
    status: 'Active',
    priority: 'High',
    color: colors.conference,
    description: '3-day technology conference with keynotes and workshops',
  },

  // Day +2
  {
    title: 'Corporate Training Session',
    event_type: 'Meeting',
    start_date: getDate(2),
    end_date: getDate(2),
    working_hours_start: '10:00',
    working_hours_end: '16:00',
    venue_address: 'Training Center, Building 3',
    crew_count: 15,
    filled_positions: 12,
    status: 'Pending',
    priority: 'Medium',
    color: colors.meeting,
    description: 'Annual corporate training for new hires',
  },

  // Day +4
  {
    title: 'Summer Music Festival',
    event_type: 'Festival',
    start_date: getDate(4),
    end_date: getDate(6),
    working_hours_start: '12:00',
    working_hours_end: '23:00',
    venue_address: 'Riverside Park, Main Stage Area',
    crew_count: 100,
    filled_positions: 85,
    status: 'Active',
    priority: 'High',
    color: colors.festival,
    description: '3-day outdoor music festival with multiple stages',
  },

  // Day +5
  {
    title: 'Client Presentation',
    event_type: 'Meeting',
    start_date: getDate(5),
    end_date: getDate(5),
    working_hours_start: '14:00',
    working_hours_end: '15:30',
    venue_address: 'Client Office, 25th Floor Boardroom',
    crew_count: 5,
    filled_positions: 5,
    status: 'Active',
    priority: 'High',
    color: colors.meeting,
    description: 'Q4 results presentation to key stakeholders',
  },

  // Day +7 (Next week)
  {
    title: 'Wedding Reception - Johnson & Smith',
    event_type: 'Wedding',
    start_date: getDate(7),
    end_date: getDate(7),
    working_hours_start: '17:00',
    working_hours_end: '23:00',
    venue_address: 'Garden Estate Venue, 1234 Vineyard Road',
    crew_count: 30,
    filled_positions: 28,
    status: 'Active',
    priority: 'High',
    color: colors.wedding,
    description: 'Elegant outdoor wedding reception for 200 guests',
  },

  // Day +9
  {
    title: 'TV Commercial Shoot',
    event_type: 'Production',
    start_date: getDate(9),
    end_date: getDate(10),
    working_hours_start: '06:00',
    working_hours_end: '20:00',
    venue_address: 'Studio 7, Production Complex',
    crew_count: 40,
    filled_positions: 35,
    status: 'Pending',
    priority: 'Medium',
    color: colors.production,
    description: '2-day commercial shoot for major brand',
  },

  // Day +12
  {
    title: 'Rock Concert - The Voltage',
    event_type: 'Concert',
    start_date: getDate(12),
    end_date: getDate(12),
    working_hours_start: '19:00',
    working_hours_end: '23:30',
    venue_address: 'Arena Stadium, Gate 5',
    crew_count: 60,
    filled_positions: 55,
    status: 'Active',
    priority: 'High',
    color: colors.concert,
    description: 'Live rock concert with opening acts',
  },

  // Day +14 (2 weeks out)
  {
    title: 'Annual Corporate Retreat',
    event_type: 'Corporate',
    start_date: getDate(14),
    end_date: getDate(16),
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    venue_address: 'Mountain Resort & Conference Center',
    crew_count: 20,
    filled_positions: 15,
    status: 'Pending',
    priority: 'Medium',
    color: colors.corporate,
    description: '3-day company retreat with team building activities',
  },

  // Day +18
  {
    title: 'Fashion Show - Spring Collection',
    event_type: 'Production',
    start_date: getDate(18),
    end_date: getDate(18),
    working_hours_start: '18:00',
    working_hours_end: '21:00',
    venue_address: 'Modern Art Museum, Grand Hall',
    crew_count: 35,
    filled_positions: 30,
    status: 'Pending',
    priority: 'High',
    color: colors.production,
    description: 'High-fashion runway show and after-party',
  },

  // Day +21 (3 weeks out)
  {
    title: 'Board Meeting - Q4 Review',
    event_type: 'Meeting',
    start_date: getDate(21),
    end_date: getDate(21),
    working_hours_start: '09:00',
    working_hours_end: '12:00',
    venue_address: 'Executive Suite, Corporate HQ',
    crew_count: 6,
    filled_positions: 6,
    status: 'Pending',
    priority: 'High',
    color: colors.meeting,
    description: 'Quarterly board meeting and strategic planning',
  },

  // YESTERDAY (to test past events)
  {
    title: 'Film Production Wrap Party',
    event_type: 'Production',
    start_date: getDate(-1),
    end_date: getDate(-1),
    working_hours_start: '20:00',
    working_hours_end: '01:00',
    venue_address: 'Sunset Studios, Stage 4',
    crew_count: 25,
    filled_positions: 25,
    status: 'Completed',
    priority: 'Low',
    color: colors.production,
    description: 'Celebration wrap party for completed film project',
  },

  // Last week (to test list view scrolling)
  {
    title: 'Charity Gala Dinner',
    event_type: 'Corporate',
    start_date: getDate(-7),
    end_date: getDate(-7),
    working_hours_start: '18:30',
    working_hours_end: '23:00',
    venue_address: 'Grand Hotel Ballroom',
    crew_count: 40,
    filled_positions: 40,
    status: 'Completed',
    priority: 'Medium',
    color: colors.corporate,
    description: 'Annual charity fundraising gala',
  },
];

async function seedProjects() {
  console.log('🌱 Starting to seed test projects...\n');

  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Error: No authenticated user found.');
      console.log('💡 Please make sure you are logged in to the application first.\n');
      return;
    }

    console.log(`✅ Authenticated as: ${user.email}\n`);

    let successCount = 0;
    let errorCount = 0;

    // Insert each project
    for (const project of testProjects) {
      const projectData = {
        ...project,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select();

      if (error) {
        console.error(`❌ Error creating "${project.title}":`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Created: ${project.title} (${project.start_date})`);
        successCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 Seeding complete!`);
    console.log(`   ✅ Success: ${successCount} projects`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount} projects`);
    }
    console.log('='.repeat(60) + '\n');

    console.log('📅 Project Distribution:');
    console.log(`   - Today: 3 events (Morning, Afternoon, Evening)`);
    console.log(`   - This week: 6 events`);
    console.log(`   - Next week: 4 events`);
    console.log(`   - Past events: 2 events`);
    console.log(`   - Multi-day events: 4 events\n`);

    console.log('🎨 Event Types:');
    console.log(`   - Meetings: 5`);
    console.log(`   - Corporate: 4`);
    console.log(`   - Production: 3`);
    console.log(`   - Conference: 1`);
    console.log(`   - Festival: 1`);
    console.log(`   - Wedding: 1`);
    console.log(`   - Concert: 1\n`);

    console.log('💡 Next Steps:');
    console.log('   1. Open http://localhost:5173/calendar/view');
    console.log('   2. See today\'s events with times');
    console.log('   3. Hover over events for details');
    console.log('   4. Try list view: /calendar/list\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the seeder
seedProjects();
