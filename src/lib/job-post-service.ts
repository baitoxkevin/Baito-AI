import { supabase } from './supabase';
import { Project } from './types';
import { format } from 'date-fns';

export interface JobPost {
  id?: string;
  project_id: string;
  title: string;
  content: string;
  contact_info: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface JobPostTemplate {
  projectTitle: string;
  date: string;
  time: string;
  location: string;
  payment: string;
  attire: string;
  jobScope: string[];
  requirements: string[];
  contactInfo: string;
  paxCount?: number;
  callTime?: string;
  endTime?: string;
  experienceLevel?: string;
  urgency?: boolean;
  training?: {
    date: string;
    time: string;
    location: string;
    compulsory: boolean;
  };
  publicHoliday?: boolean;
  additionalInfo?: string[];
}

// Generate job post content from project data
export function generateJobPostContent(project: Project, template?: Partial<JobPostTemplate>): string {
  const startDate = new Date(project.start_date);
  const endDate = project.end_date ? new Date(project.end_date) : null;
  
  // Default payment rates based on project type
  const defaultPayment = project.supervisors_required > 0 ? 'RM150/day' : 'RM100/day';
  
  // Format date range
  let dateStr = format(startDate, 'do MMMM yyyy');
  if (endDate && endDate.getTime() !== startDate.getTime()) {
    dateStr = `${format(startDate, 'do')} - ${format(endDate, 'do MMMM yyyy')}`;
  }
  
  // Format time
  const timeStr = `${project.working_hours_start || '9:00am'} - ${project.working_hours_end || '6:00pm'}`;
  
  // Build the job post content
  let content = '';
  
  // Title
  content += `${template?.urgency ? '🚨 URGENT ' : ''}${project.title.toUpperCase()}\n\n`;
  
  // Basic details with emojis
  content += `📅 Date: ${template?.date || dateStr}\n`;
  content += `📍 Location: ${template?.location || project.venue_address}\n`;
  content += `⏰ Time: ${template?.time || timeStr}`;
  if (template?.callTime) {
    content += ` (Call time ${template.callTime})`;
  }
  content += '\n';
  
  if (template?.paxCount || project.crew_count) {
    content += `👥 Pax: ${template?.paxCount || project.crew_count} pax\n`;
  }
  
  content += `💰 Payment: ${template?.payment || defaultPayment}\n`;
  
  if (template?.attire) {
    content += `👔 Attire: ${template.attire}\n`;
  }
  
  // Training section if applicable
  if (template?.training) {
    content += `\n‼️ ${template.training.compulsory ? 'Compulsory' : 'Optional'} Training:\n`;
    content += `${template.training.date} @ ${template.training.time} @ ${template.training.location}\n`;
  }
  
  // Job scope
  content += '\n📋 Job Scope:\n';
  if (template?.jobScope && template.jobScope.length > 0) {
    template.jobScope.forEach(scope => {
      content += `• ${scope}\n`;
    });
  } else {
    // Default job scopes based on project type
    if (project.event_type?.toLowerCase().includes('promoter')) {
      content += '• Actively promote to potential customers\n';
      content += '• Explain benefits and promotions clearly\n';
      content += '• Approach walk-in customers\n';
      content += '• Build rapport with customers\n';
    } else {
      content += '• Assist with event operations\n';
      content += '• Follow supervisor instructions\n';
      content += '• Maintain professional appearance\n';
    }
  }
  
  // Requirements
  if (template?.requirements && template.requirements.length > 0) {
    content += '\n📌 Requirements:\n';
    template.requirements.forEach(req => {
      content += `• ${req}\n`;
    });
  }
  
  // Experience level
  if (template?.experienceLevel) {
    content += `\n🌟 ${template.experienceLevel}\n`;
  }
  
  // Additional info
  if (template?.additionalInfo && template.additionalInfo.length > 0) {
    content += '\n';
    template.additionalInfo.forEach(info => {
      content += `${info}\n`;
    });
  }
  
  // Public holiday notice
  if (template?.publicHoliday) {
    content += '\n*Public Holiday rates apply\n';
  }
  
  // Contact info
  if (template?.contactInfo) {
    content += `\n${template.contactInfo}`;
  }
  
  return content;
}

// Save job post to database
export async function saveJobPost(jobPost: JobPost) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('project_job_posts')
      .insert({
        ...jobPost,
        created_by: userData?.user?.id
      })
      .select()
      .single();
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving job post:', error);
    return { data: null, error };
  }
}

// Get job posts for a project
export async function getProjectJobPosts(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('project_job_posts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching job posts:', error);
    return { data: null, error };
  }
}

// Update job post
export async function updateJobPost(id: string, updates: Partial<JobPost>) {
  try {
    const { data, error } = await supabase
      .from('project_job_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating job post:', error);
    return { data: null, error };
  }
}

// Delete job post
export async function deleteJobPost(id: string) {
  try {
    const { error } = await supabase
      .from('project_job_posts')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting job post:', error);
    return { error };
  }
}

// Common job post templates
export const jobPostTemplates = {
  promoter: {
    attire: 'Smart casual / As per brand guidelines',
    jobScope: [
      'Actively promote to potential customers',
      'Explain benefits and ongoing promotion clearly and convincingly',
      'Approach walk-in customers at booth',
      'Build rapport with customer to encourage sign-up'
    ],
    requirements: [
      'Aged 18 years old and above',
      'Prefer candidates with sales experience',
      'Good communication skills'
    ]
  },
  eventCrew: {
    attire: 'Black plain t-shirt, Black long pants & Black sport shoes',
    jobScope: [
      'Setup and dismantle event equipment',
      'Assist with crowd control',
      'Follow event coordinator instructions',
      'Maintain event area cleanliness'
    ],
    requirements: [
      'Physically fit',
      'Can stand for long hours',
      'Team player',
      'Punctual and responsible'
    ]
  },
  supervisor: {
    attire: 'Uniform provided, own black long pants and black covered shoes',
    jobScope: [
      'Manage team accordingly',
      'Update on-ground situation time by time',
      'Stock & free gift arrangement',
      'Ensure smooth event operations'
    ],
    requirements: [
      'Previous supervisory experience required',
      'Good leadership skills',
      'Problem-solving abilities',
      'Excellent communication'
    ],
    experienceLevel: 'Experience Supervisor Needed'
  },
  umpire: {
    jobScope: [
      'Makes calls regarding service faults and other player faults',
      'Keeps track of the match score and announces it after each point',
      'Determine whether a shuttle lands "in" or "out" on the lines'
    ],
    requirements: [
      'Familiar with badminton match rules',
      'Sharp eyes and quick decision making',
      'Can remain impartial throughout matches'
    ],
    experienceLevel: 'Preference of experienced umpire'
  }
};