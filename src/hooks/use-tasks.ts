import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';
import { TaskStatus } from '@/lib/types';

export interface Task {
  id: string;
  gig_history_id?: string | null;
  task_name: string;
  task_description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  completed?: boolean;
  completion_notes?: string | null;
  created_at: string;
  
  // New fields we want to support
  status?: string;
  priority?: 'high' | 'medium' | 'low';
  title?: string;
  description?: string | null;
  assigned_to?: string | null;
  column_id?: string | null;
}

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('gig_tasks')  // Changed from 'tasks' to 'gig_tasks'
          .select('*');
        
        if (projectId) {
          query = query.eq('project_id', projectId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setTasks(data || []);
      } catch (err: any) {
        console.error('Error fetching tasks:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
        toast({
          title: 'Error fetching tasks',
          description: 'Please try again later',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
    
    // Set up realtime subscription
    const subscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'gig_tasks',  // Changed from 'tasks' to 'gig_tasks'
        ...(projectId ? { filter: `project_id=eq.${projectId}` } : {})
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [...prev, payload.new as Task]);
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(task => 
            task.id === payload.new.id ? { ...task, ...payload.new } : task
          ));
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(task => task.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [projectId, toast]);

  const addTask = async (newTask: {
    task_name?: string;
    title?: string;
    task_description?: string;
    description?: string;
    status?: string;
    priority?: 'high' | 'medium' | 'low';
    start_time?: string;
    end_time?: string;
  }) => {
    try {
      // Create a minimal task with the proper field names
      // We need to match the exact database field names
      const taskToAdd = {
        task_name: newTask.task_name || newTask.title || 'New Task'
      };
      
      // After previous errors, try to avoid any timestamp fields
      
      // Add optional fields only if they're specified in the newTask
      if (newTask.status) {
        taskToAdd['status'] = newTask.status;
      }
      
      if (newTask.priority) {
        taskToAdd['priority'] = newTask.priority;
      }
      
      // Handle either field name for description
      if (newTask.task_description) {
        taskToAdd['task_description'] = newTask.task_description;
      } else if (newTask.description) {
        taskToAdd['task_description'] = newTask.description;
      }
      
      try {
        // Try to insert into database first
        const { data, error } = await supabase
          .from('gig_tasks')
          .insert([taskToAdd])
          .select('*')
          .single();
        
        if (error) {
          console.error('Database error:', error);
          throw error;
        }
        
        setTasks(prev => [...prev, data]);
        return { success: true, data };
      } catch (dbError) {
        // If database fails, we'll return the error but the TodoPage will handle fallback
        console.warn('Database task creation failed:', dbError);
        throw dbError;
      }
    } catch (err: any) {
      console.error('Error adding task:', err);
      toast({
        title: 'Error adding task',
        description: err?.message || 'Failed to add task. Using local storage instead.',
        variant: 'destructive',
      });
      return { success: false, error: err };
    }
  };

  const updateTask = async (id: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('gig_tasks')  // Changed from 'tasks' to 'gig_tasks'
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      
      setTasks(prev => prev.map(task => task.id === id ? data : task));
      return { success: true, data };
    } catch (err: any) {
      console.error('Error updating task:', err);
      toast({
        title: 'Error updating task',
        description: 'Please try again',
        variant: 'destructive',
      });
      return { success: false, error: err };
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gig_tasks')  // Changed from 'tasks' to 'gig_tasks'
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTasks(prev => prev.filter(task => task.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting task:', err);
      toast({
        title: 'Error deleting task',
        description: 'Please try again',
        variant: 'destructive',
      });
      return { success: false, error: err };
    }
  };

  return { 
    tasks, 
    loading, 
    error,
    addTask,
    updateTask,
    deleteTask
  };
}