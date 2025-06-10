import { supabase } from '@/lib/supabase';
import { Project } from '@/lib/types';

export interface ProjectChange {
  id: string;
  project_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_reason: string | null;
  changed_by: string | null;
  created_at: string;
  display_name?: string; // Added from project_field_labels
}

export interface ProjectAIContext {
  id: string;
  project_id: string;
  context_type: 'change_analysis' | 'recommendation' | 'insight';
  content: string;
  source: 'user_input' | 'ai_generated';
  related_change_id: string | null;
  created_at: string;
}

/**
 * Detects significant changes between old and new project versions
 */
export function detectProjectChanges(oldProject: Project, newProject: Project): { field: string, oldValue: string, newValue: string }[] {
  const changes: { field: string, oldValue: string, newValue: string }[] = [];
  
  // Fields we want to track changes for
  const trackFields = [
    'title', 'crew_count', 'supervisors_required', 'start_date', 'end_date',
    'status', 'priority', 'venue_address', 'working_hours_start',
    'working_hours_end', 'event_type', 'client_id', 'manager_id'
  ];
  
  trackFields.forEach(field => {
    // Handle dates specially to avoid detecting changes when only the time portion changes
    if (field === 'start_date' || field === 'end_date') {
      // Skip if one is null/undefined and the other is empty string
      if (
        (oldProject[field] === null && (newProject[field] === '' || newProject[field] === null)) ||
        (newProject[field] === null && (oldProject[field] === '' || oldProject[field] === null))
      ) {
        return;
      }
      
      // If both values exist, compare only the date portion
      if (oldProject[field] && newProject[field]) {
        const oldDate = oldProject[field].split('T')[0];
        const newDate = newProject[field].split('T')[0];
        
        if (oldDate !== newDate) {
          changes.push({
            field,
            oldValue: oldDate || 'Not set',
            newValue: newDate || 'Not set'
          });
        }
        return;
      }
    }
    
    // For numeric fields, ensure we're comparing numbers not strings
    if (field === 'crew_count' || field === 'supervisors_required' || field === 'filled_positions') {
      const oldNumber = Number(oldProject[field]);
      const newNumber = Number(newProject[field]);
      
      if (!isNaN(oldNumber) && !isNaN(newNumber) && oldNumber !== newNumber) {
        changes.push({
          field,
          oldValue: String(oldNumber),
          newValue: String(newNumber)
        });
      }
      return;
    }
    
    // For other fields, do a string comparison but handle null/undefined
    const oldValue = oldProject[field] === null || oldProject[field] === undefined ? '' : String(oldProject[field]);
    const newValue = newProject[field] === null || newProject[field] === undefined ? '' : String(newProject[field]);
    
    // Only push if there's a meaningful change
    if (oldValue !== newValue && !(oldValue === '' && newValue === '')) {
      changes.push({
        field,
        oldValue: oldValue || 'Not set',
        newValue: newValue || 'Not set'
      });
    }
  });
  
  return changes;
}

/**
 * Records project changes in the database
 */
export async function recordProjectChanges(
  projectId: string, 
  changes: { field: string, oldValue: string, newValue: string }[],
  userId: string
): Promise<string[]> {
  try {
    const changeIds: string[] = [];
    
    for (const change of changes) {
      const { data, error } = await supabase
        .from('project_changes')
        .insert({
          project_id: projectId,
          field_name: change.field,
          old_value: change.oldValue,
          new_value: change.newValue,
          changed_by: userId
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error recording project change:', error);
      } else if (data) {
        changeIds.push(data.id);
      }
    }
    
    return changeIds;
  } catch (error) {
    console.error('Failed to record project changes:', error);
    return [];
  }
}

/**
 * Prompts for user reason behind changes
 */
export function generateChangePrompt(changes: { field: string, oldValue: string, newValue: string }[]): string {
  // Get field labels to make prompts more human-readable
  const fieldLabels = {
    'crew_count': 'crew size',
    'supervisors_required': 'number of supervisors',
    'start_date': 'start date',
    'end_date': 'end date',
    'status': 'status',
    'priority': 'priority',
    'venue_address': 'venue',
    'working_hours_start': 'working hours start time',
    'working_hours_end': 'working hours end time',
    'event_type': 'event type',
    'client_id': 'client',
    'manager_id': 'project manager'
  };
  
  const significantChanges = changes.filter(c => 
    ['crew_count', 'supervisors_required', 'start_date', 'end_date', 'status', 'venue_address'].includes(c.field)
  );
  
  if (significantChanges.length === 0) return '';
  
  if (significantChanges.length === 1) {
    const change = significantChanges[0];
    const fieldLabel = fieldLabels[change.field] || change.field;
    return `You've changed the ${fieldLabel} from ${change.oldValue} to ${change.newValue}. What's the reason for this change?`;
  }
  
  // Multiple changes
  const changeDescriptions = significantChanges.map(change => {
    const fieldLabel = fieldLabels[change.field] || change.field;
    return `- Changed ${fieldLabel} from ${change.oldValue} to ${change.newValue}`;
  }).join('\n');
  
  return `You've made these changes to the project:\n${changeDescriptions}\n\nWhat's the context behind these updates?`;
}

/**
 * Saves user-provided context for project changes
 */
export async function saveProjectChangeContext(
  projectId: string,
  changeIds: string[],
  contextContent: string
): Promise<boolean> {
  try {
    // For simplicity, we'll associate the context with the first change
    const relatedChangeId = changeIds.length > 0 ? changeIds[0] : null;
    
    const { error } = await supabase
      .from('projects_ai_context')
      .insert({
        project_id: projectId,
        context_type: 'change_analysis',
        content: contextContent,
        source: 'user_input',
        related_change_id: relatedChangeId
      });
    
    if (error) {
      console.error('Error saving project change context:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save project change context:', error);
    return false;
  }
}

/**
 * Retrieves project change history with context
 */
export async function getProjectChangeHistory(projectId: string): Promise<{changes: ProjectChange[], context: ProjectAIContext[]}> {
  try {
    // Get changes with field labels
    const { data: changes, error: changesError } = await supabase
      .from('project_changes')
      .select(`
        id, project_id, field_name, old_value, new_value, 
        change_reason, changed_by, created_at
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (changesError) {
      console.error('Error fetching project changes:', changesError);
      return { changes: [], context: [] };
    }
    
    // Format changes and add display names manually
    const formattedChanges = changes.map(change => {
      // Field labels mapping for display names
      const fieldLabels = {
        'title': 'Project Title',
        'crew_count': 'Crew Size',
        'supervisors_required': 'Supervisors Count',
        'start_date': 'Start Date',
        'end_date': 'End Date',
        'status': 'Project Status',
        'priority': 'Priority',
        'venue_address': 'Venue',
        'working_hours_start': 'Working Hours Start',
        'working_hours_end': 'Working Hours End',
        'event_type': 'Event Type',
        'client_id': 'Client',
        'manager_id': 'Manager'
      };
      
      return {
        ...change,
        display_name: fieldLabels[change.field_name] || change.field_name
      };
    });
    
    // Get AI context
    const { data: context, error: contextError } = await supabase
      .from('projects_ai_context')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (contextError) {
      console.error('Error fetching project context:', contextError);
      return { changes: formattedChanges, context: [] };
    }
    
    return { 
      changes: formattedChanges, 
      context: context || [] 
    };
  } catch (error) {
    console.error('Failed to get project change history:', error);
    return { changes: [], context: [] };
  }
}

/**
 * Generates AI insights based on project changes
 * This would connect to Claude API in production
 */
export async function generateAIInsightsForChanges(
  projectId: string, 
  changes: ProjectChange[],
  context: ProjectAIContext[]
): Promise<string> {
  // This is a mock function for now
  // In production, this would call Claude API
  
  if (changes.length === 0) return '';
  
  // Mock insights based on specific fields
  if (changes.some(c => c.field_name === 'crew_count')) {
    const crewChange = changes.find(c => c.field_name === 'crew_count');
    const oldCount = Number(crewChange?.old_value || 0);
    const newCount = Number(crewChange?.new_value || 0);
    
    if (newCount < oldCount) {
      return `I notice the crew size was reduced from ${oldCount} to ${newCount}. This might affect your staffing plan. Consider reviewing task assignments and schedules to accommodate the smaller team.`;
    } else if (newCount > oldCount) {
      return `The crew size has increased from ${oldCount} to ${newCount}. This could be an opportunity to delegate more tasks or create specialized roles. Consider updating your recruitment criteria and onboarding materials.`;
    }
  }
  
  if (changes.some(c => c.field_name === 'start_date' || c.field_name === 'end_date')) {
    return `The project timeline has changed. This might impact task deadlines, resource allocation, and staff availability. Consider reviewing your milestones and dependencies.`;
  }
  
  if (changes.some(c => c.field_name === 'venue_address')) {
    return `The venue has changed. This might require adjustments to logistics, transportation plans, and setup arrangements. Consider doing a site visit to familiarize yourself with the new location.`;
  }
  
  // Default insight
  return `I've noticed changes to the project. Consider reviewing your task list and timeline to ensure everything is still aligned with the updated project details.`;
}

/**
 * Saves AI-generated insights about project changes
 */
export async function saveAIInsights(
  projectId: string,
  insightContent: string,
  relatedChangeId: string | null = null
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('projects_ai_context')
      .insert({
        project_id: projectId,
        context_type: 'insight',
        content: insightContent,
        source: 'ai_generated',
        related_change_id: relatedChangeId
      });
    
    if (error) {
      console.error('Error saving AI insights:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save AI insights:', error);
    return false;
  }
}