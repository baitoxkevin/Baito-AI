export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'done';
export type UserRole = 'admin' | 'manager' | 'client' | 'staff';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  assigned_to?: User;
  assigned_by?: string;
  project_id?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  assignee_role?: UserRole;
  mentions?: string[];
  comments?: {
    id: string;
    text: string;
    created_at: string;
    created_by: string;
    mentions?: string[];
  }[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'mention' | 'assignment' | 'update';
  task_id?: string;
  project_id?: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  client?: {
    full_name: string;
  };
  client_id: string;
  manager_id: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string | null;
  crew_count: number;
  filled_positions: number;
  working_hours_start: string;
  working_hours_end: string;
  event_type: string;
  venue_address: string;
  venue_details: string | null;
  supervisors_required: number;
  color: string;
}

export function isProject(obj: any): obj is Project {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.client_id === 'string' &&
    typeof obj.manager_id === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.priority === 'string' &&
    typeof obj.start_date === 'string' &&
    (obj.end_date === null || typeof obj.end_date === 'string') &&
    typeof obj.working_hours_start === 'string' &&
    typeof obj.working_hours_end === 'string' &&
    typeof obj.event_type === 'string' &&
    typeof obj.venue_address === 'string' &&
    (obj.venue_details === null || typeof obj.venue_details === 'string') &&
    typeof obj.supervisors_required === 'number' &&
    typeof obj.crew_count === 'number' &&
    typeof obj.filled_positions === 'number' &&
    typeof obj.color === 'string'
  );
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
