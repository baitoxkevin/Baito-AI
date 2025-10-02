import { supabase } from './supabase';

export interface CandidateHistoryEntry {
  id: string;
  candidate_id: string;
  project_id: string;
  user_id: string;
  completed_at: string;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  project?: {
    title: string;
    start_date: string;
    end_date: string;
    status: string;
    color: string;
  };
}

export interface CandidateMetrics {
  totalProjects: number;
  averageRating: number;
  onTimePercentage: number;
  completionRate: number;
  isBlacklisted: boolean;
  lastProjectDate: string | null;
  ratingBreakdown: Record<number, number>; // For star rating breakdown percentages
  longestStreak: number; // For longest consecutive project streak
}

/**
 * Get a candidate's project history
 */
export async function getCandidateHistory(candidateId: string): Promise<CandidateHistoryEntry[]> {
  try {
    // Check if the table exists by attempting a simple query
    const { error: tableCheckError } = await supabase
      .from('candidate_project_history')
      .select('id')
      .limit(1);
    
    // Table doesn't exist
    if (tableCheckError && (tableCheckError.code === '42P01' || tableCheckError.message.includes('does not exist'))) {
      console.warn('Candidate project history table does not exist or cannot be accessed');
      return [];
    }
    
    // Table exists, proceed with query
    const { data, error } = await supabase
      .from('candidate_project_history')
      .select(`
        *,
        project:project_id (
          title,
          start_date,
          end_date,
          status,
          color
        )
      `)
      .eq('candidate_id', candidateId)
      .order('completed_at', { ascending: false });

    if (error) {
      // Handle specific error cases
      if (error.code === 'PGRST200') {
        console.error('Error with foreign key relationship in candidate history. Database schema may need updating.');
      } else {
        console.error('Error fetching candidate history:', error);
      }
      return [];
    }

    return data as CandidateHistoryEntry[];
  } catch (e) {
    console.error('Unexpected error in getCandidateHistory:', e);
    return [];
  }
}

/**
 * Add a new entry to a candidate's project history
 */
export async function addCandidateHistoryEntry(
  candidateId: string,
  projectId: string,
  rating: number,
  comment?: string,
  status: string = 'completed'
): Promise<boolean> {
  const { data: userSession } = await supabase.auth.getSession();
  const userId = userSession.session?.user.id;

  if (!userId) {
    console.error('User not authenticated');
    return false;
  }

  const { error } = await supabase.from('candidate_project_history').insert({
    candidate_id: candidateId,
    project_id: projectId,
    user_id: userId,
    rating,
    comment,
    status,
    completed_at: new Date().toISOString()
  });

  if (error) {
    console.error('Error adding candidate history entry:', error);
    return false;
  }

  return true;
}

/**
 * Update an existing entry in a candidate's project history
 */
export async function updateCandidateHistoryEntry(
  historyId: string,
  updates: Partial<CandidateHistoryEntry>
): Promise<boolean> {
  const { error } = await supabase
    .from('candidate_project_history')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', historyId);

  if (error) {
    console.error('Error updating candidate history entry:', error);
    return false;
  }

  return true;
}

/**
 * Get performance metrics for a candidate
 */
export async function getCandidateMetrics(candidateId: string): Promise<CandidateMetrics> {
  // Get candidate's project history
  const history = await getCandidateHistory(candidateId);
  
  // Check if candidate is blacklisted
  let isBlacklisted = false;
  try {
    // Check if the table exists by attempting a simple query
    const { error: tableCheckError } = await supabase
      .from('candidate_blacklist')
      .select('id')
      .limit(1);
    
    // Table doesn't exist
    if (tableCheckError && (tableCheckError.code === '42P01' || tableCheckError.message.includes('does not exist'))) {
      console.warn('Candidate blacklist table does not exist or cannot be accessed');
    } else {
      // Table exists, check blacklist status
      const { data: blacklistData, error: blacklistError } = await supabase
        .from('candidate_blacklist')
        .select('*')
        .eq('candidate_id', candidateId)
        .maybeSingle();

      if (blacklistError) {
        if (blacklistError.code === '42P01') { // Table doesn't exist error
          console.error('Candidate blacklist table does not exist in database');
        } else {
          console.error('Error checking blacklist status:', blacklistError);
        }
      } else {
        isBlacklisted = !!blacklistData;
      }
    }
  } catch (e) {
    console.error('Unexpected error checking blacklist:', e);
  }

  // Calculate metrics
  const totalProjects = history.length;
  
  let sumRatings = 0;
  let onTimeCount = 0;
  let completedCount = 0;
  let lastProjectDate = null;
  let currentStreak = 0;
  let longestStreak = 0;
  
  // Initialize rating breakdown
  const ratingBreakdown: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  };
  
  if (totalProjects > 0) {
    lastProjectDate = history[0].completed_at;
    
    // Sort history by completion date for streak calculation
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    );
    
    let lastDate: Date | null = null;
    
    sortedHistory.forEach(entry => {
      // Calculate ratings
      if (entry.rating) {
        sumRatings += entry.rating;
        
        // Add to rating breakdown
        if (entry.rating >= 1 && entry.rating <= 5) {
          ratingBreakdown[Math.round(entry.rating)]++;
        }
      }
      
      // Calculate on-time percentage
      if (entry.status === 'completed_on_time') {
        onTimeCount++;
      }
      
      // Calculate completion rate
      if (entry.status.includes('completed')) {
        completedCount++;
      }
      
      // Calculate longest streak (projects completed within 30 days of each other)
      const currentDate = new Date(entry.completed_at);
      if (lastDate) {
        const daysDiff = Math.abs(
          (currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)
        );
        
        if (daysDiff <= 30) {
          // Continue streak
          currentStreak++;
        } else {
          // Reset streak
          currentStreak = 1;
        }
      } else {
        // First project
        currentStreak = 1;
      }
      
      // Update longest streak
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      
      lastDate = currentDate;
    });
  }
  
  // Convert rating breakdown to percentages
  const ratedProjects = Object.values(ratingBreakdown).reduce((sum, count) => sum + count, 0);
  if (ratedProjects > 0) {
    for (const rating in ratingBreakdown) {
      ratingBreakdown[rating] = Math.round((ratingBreakdown[rating] / ratedProjects) * 100);
    }
  }
  
  const metrics: CandidateMetrics = {
    totalProjects,
    averageRating: totalProjects > 0 ? parseFloat((sumRatings / totalProjects).toFixed(1)) : 0,
    onTimePercentage: totalProjects > 0 ? Math.round((onTimeCount / totalProjects) * 100) : 0,
    completionRate: totalProjects > 0 ? Math.round((completedCount / totalProjects) * 100) : 0,
    isBlacklisted,
    lastProjectDate,
    ratingBreakdown,
    longestStreak
  };
  
  return metrics;
}

/**
 * Get candidates who have worked on a specific project
 */
export async function getProjectCandidateHistory(projectId: string): Promise<CandidateHistoryEntry[]> {
  const { data, error } = await supabase
    .from('candidate_project_history')
    .select(`
      *,
      candidate:candidate_id (
        id,
        first_name,
        last_name,
        custom_fields
      )
    `)
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching project candidate history:', error);
    return [];
  }

  return data as unknown as CandidateHistoryEntry[];
}