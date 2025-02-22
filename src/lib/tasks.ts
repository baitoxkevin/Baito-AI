import { supabase } from './supabase';
import type { Task, TaskStatus, UserRole } from './types';

export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assigned_to:users!tasks_assigned_to_fkey(id, full_name, role),
      assigned_by:users!tasks_assigned_by_fkey(id, full_name, role),
      project:projects(id, title)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTask(task: Partial<Task>) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(id: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  return updateTask(id, { status });
}

export async function assignTask(id: string, userId: string, assignedBy: string) {
  return updateTask(id, { 
    assigned_to: userId,
    assigned_by: assignedBy,
    status: 'todo'
  });
}

export async function getUsersByRole(role: UserRole) {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, role')
    .eq('role', role)
    .order('full_name');

  if (error) throw error;
  return data;
}
