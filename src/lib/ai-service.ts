// AI Service for task suggestions using OpenRouter API
// DO NOT include API keys directly in this file - they should be loaded from environment variables

export interface TaskSuggestion {
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'doing' | 'done';
  priority: 'high' | 'medium' | 'low';
  due_date_relative: string; // e.g. "3 days from start"
}

export interface ProjectDetails {
  title: string;
  project_type?: string;
  event_type: string;
  crew_count: number;
  supervisors_required?: number;
  venue_address: string;
  start_date: Date | string;
  end_date?: Date | string;
}

// Mock function for development until API key is properly set up
export async function getTaskSuggestions(projectDetails: ProjectDetails): Promise<TaskSuggestion[]> {
  console.log('Getting AI task suggestions for:', projectDetails);
  
  // In a production app, this would call the actual OpenRouter API
  // For now, return mock suggestions based on project type
  
  if (projectDetails.project_type === 'recruitment' || projectDetails.crew_count > 0) {
    return [
      {
        title: `Recruit ${projectDetails.crew_count} staff members`,
        description: 'Create job listings and start recruitment process',
        status: 'todo',
        priority: 'high',
        due_date_relative: '1 day from start'
      },
      {
        title: 'Screen initial candidates',
        description: 'Review applications and select candidates for interviews',
        status: 'backlog',
        priority: 'medium',
        due_date_relative: '3 days from start'
      },
      {
        title: 'Schedule interviews',
        description: 'Set up interview schedule for selected candidates',
        status: 'backlog',
        priority: 'medium',
        due_date_relative: '5 days from start'
      },
      {
        title: 'Conduct orientation session',
        description: 'Prepare and deliver orientation for new staff',
        status: 'backlog',
        priority: 'medium',
        due_date_relative: '10 days from start'
      }
    ];
  }
  
  if (projectDetails.event_type && projectDetails.venue_address) {
    return [
      {
        title: `Confirm venue booking at ${projectDetails.venue_address.split(',')[0]}`,
        description: 'Verify booking details and requirements with venue management',
        status: 'todo',
        priority: 'high',
        due_date_relative: '0 days from start'
      },
      {
        title: 'Create event budget',
        description: 'Prepare detailed budget including venue, staff, and materials',
        status: 'todo',
        priority: 'high',
        due_date_relative: '1 day from start'
      },
      {
        title: 'Prepare equipment list',
        description: 'Create list of all required equipment and supplies',
        status: 'todo',
        priority: 'medium',
        due_date_relative: '2 days from start'
      },
      {
        title: 'Schedule staff for event',
        description: 'Assign staff members to specific roles and shifts',
        status: 'backlog',
        priority: 'medium',
        due_date_relative: '5 days from start'
      }
    ];
  }
  
  // Default suggestions
  return [
    {
      title: `Initial planning for ${projectDetails.title}`,
      description: 'Outline project scope and key deliverables',
      status: 'todo',
      priority: 'high',
      due_date_relative: '0 days from start'
    },
    {
      title: 'Identify project stakeholders',
      description: 'Create list of all stakeholders and their roles',
      status: 'todo',
      priority: 'high',
      due_date_relative: '1 day from start'
    },
    {
      title: 'Set up project communication channels',
      description: 'Establish how team will communicate and share updates',
      status: 'backlog',
      priority: 'medium',
      due_date_relative: '2 days from start'
    }
  ];
}

// This function will use the OpenRouter API in production
// For now it's just a placeholder
export async function getTaskSuggestionsFromAI(projectDetails: ProjectDetails): Promise<TaskSuggestion[]> {
  // This would be implemented with actual API calls
  // For now, we'll use the mock function
  return getTaskSuggestions(projectDetails);
  
  /* Production implementation would look something like:
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-sonnet-20240229',
        messages: [
          {
            role: 'system',
            content: 'You are a project planning assistant for a staffing and events company.'
          },
          {
            role: 'user',
            content: `Based on the following project details, suggest 5-7 specific tasks...[detailed prompt]`
          }
        ],
        temperature: 0.7,
      }),
    });
    
    const data = await response.json();
    
    // Parse the response and return structured task suggestions
    try {
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse suggestions:', parseError);
      return getTaskSuggestions(projectDetails); // Fallback to mock suggestions
    }
  } catch (error) {
    console.error('Error calling AI API:', error);
    return getTaskSuggestions(projectDetails); // Fallback to mock suggestions
  }
  */
}