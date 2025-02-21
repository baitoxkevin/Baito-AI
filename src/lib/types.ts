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

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
