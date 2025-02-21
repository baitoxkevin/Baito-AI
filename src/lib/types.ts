export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'done';
export type UserRole = 'admin' | 'manager' | 'client' | 'staff';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  assigned_by?: string;
  project_id?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  assignee_role?: UserRole;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
