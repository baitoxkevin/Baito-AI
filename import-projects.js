const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parse/sync');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to generate consistent UUIDs for demo data
function generateDemoUUID(seed) {
  // For demo purposes, we'll use predictable UUIDs
  const hash = seed.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  // Format as UUID-like string
  const hex = Math.abs(hash).toString(16).padStart(32, '0');
  return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20, 12)}`;
}

async function createDemoUsersAndCompanies() {
  console.log('Creating demo companies and users...');
  
  // Create demo companies
  const companies = [
    {
      id: generateDemoUUID('demo-company-1'),
      company_name: 'Demo Event Company',
      company_email: 'info@demo-events.com',
      company_phone_no: '+60123456789',
      address: 'Kuala Lumpur, Malaysia'
    },
    {
      id: generateDemoUUID('demo-company-2'),
      company_name: 'Corporate Events Sdn Bhd',
      company_email: 'contact@corporate-events.com',
      company_phone_no: '+60198765432',
      address: 'Petaling Jaya, Malaysia'
    }
  ];

  const { error: companyError } = await supabase
    .from('companies')
    .upsert(companies, { onConflict: 'id' });

  if (companyError) {
    console.error('Error creating companies:', companyError);
    return null;
  }

  // Create demo users (client and manager)
  const users = [
    {
      id: generateDemoUUID('demo-client'),
      email: 'demo.client@example.com',
      full_name: 'Demo Client',
      role: 'client',
      company_name: companies[0].company_name
    },
    {
      id: generateDemoUUID('demo-manager'),
      email: 'demo.manager@example.com',
      full_name: 'Demo Manager',
      role: 'pm',
      company_name: companies[0].company_name
    }
  ];

  const { error: userError } = await supabase
    .from('users')
    .upsert(users, { onConflict: 'id' });

  if (userError) {
    console.error('Error creating users:', userError);
    return null;
  }

  console.log('Demo companies and users created successfully');
  return {
    clientId: users[0].id,
    managerId: users[1].id
  };
}

async function importProjects(csvFilePath) {
  try {
    // Read and parse CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const records = csv.parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    console.log(`Found ${records.length} projects to import`);

    // Create demo users and companies first
    const demoData = await createDemoUsersAndCompanies();
    if (!demoData) {
      console.error('Failed to create demo data');
      return;
    }

    // Process each record
    const projects = records.map((record, index) => {
      // Replace placeholder UUIDs with actual values
      const clientId = record.client_id === '<client_uuid>' ? demoData.clientId : record.client_id;
      const managerId = record.manager_id === '<manager_uuid>' ? demoData.managerId : record.manager_id;
      
      // Remove placeholder logo URL
      const brandLogo = record.brand_logo === '<logo_url>' ? null : record.brand_logo;

      return {
        title: record.title,
        client_id: clientId,
        manager_id: managerId,
        status: record.status,
        priority: record.priority,
        start_date: record.start_date,
        end_date: record.end_date,
        crew_count: parseInt(record.crew_count),
        filled_positions: parseInt(record.filled_positions),
        working_hours_start: record.working_hours_start,
        working_hours_end: record.working_hours_end,
        event_type: record.event_type,
        venue_address: record.venue_address,
        venue_details: record.venue_details,
        supervisors_required: parseInt(record.supervisors_required),
        color: record.color,
        budget: parseFloat(record.budget),
        project_type: record.project_type,
        schedule_type: record.schedule_type,
        brand_logo: brandLogo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    // Insert projects in batches to avoid timeout
    const batchSize = 50;
    let successCount = 0;
    
    for (let i = 0; i < projects.length; i += batchSize) {
      const batch = projects.slice(i, i + batchSize);
      console.log(`Importing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(projects.length / batchSize)}...`);
      
      const { data, error } = await supabase
        .from('projects')
        .insert(batch)
        .select();

      if (error) {
        console.error(`Error importing batch starting at index ${i}:`, error);
        
        // Try to import individually to identify problematic records
        for (let j = 0; j < batch.length; j++) {
          const { error: individualError } = await supabase
            .from('projects')
            .insert(batch[j]);
          
          if (individualError) {
            console.error(`Failed to import project "${batch[j].title}":`, individualError.message);
          } else {
            successCount++;
          }
        }
      } else {
        successCount += batch.length;
        console.log(`Batch imported successfully. Total imported: ${successCount}/${projects.length}`);
      }
    }

    console.log(`\nImport completed! Successfully imported ${successCount} out of ${projects.length} projects.`);

    // Generate a summary report
    const { data: summary } = await supabase
      .from('projects')
      .select('schedule_type, event_type')
      .order('start_date', { ascending: true });

    if (summary) {
      const scheduleTypes = summary.reduce((acc, project) => {
        acc[project.schedule_type] = (acc[project.schedule_type] || 0) + 1;
        return acc;
      }, {});

      const eventTypes = summary.reduce((acc, project) => {
        acc[project.event_type] = (acc[project.event_type] || 0) + 1;
        return acc;
      }, {});

      console.log('\nProject Summary:');
      console.log('Schedule Types:', scheduleTypes);
      console.log('Event Types:', Object.keys(eventTypes).length, 'unique types');
    }

  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Check if CSV file path is provided
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('Please provide the path to your CSV file');
  console.log('Usage: node import-projects.js <path-to-csv-file>');
  console.log('Example: node import-projects.js ./projects.csv');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(csvFilePath)) {
  console.error(`File not found: ${csvFilePath}`);
  process.exit(1);
}

// Run the import
console.log(`Starting import from ${csvFilePath}...`);
importProjects(csvFilePath).catch(console.error);