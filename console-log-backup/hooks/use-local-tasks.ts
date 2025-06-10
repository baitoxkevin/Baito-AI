import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

export interface LocalTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  updated_at: string;
}

export function useLocalTasks() {
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load tasks from localStorage
  useEffect(() => {
    try {
      setLoading(true);
      const storedTasks = localStorage.getItem('kanban_tasks');
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error('Error loading tasks from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('kanban_tasks', JSON.stringify(tasks));
    }
  }, [tasks, loading]);

  // Add a new task
  const addTask = async (newTask: Omit<LocalTask, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const now = new Date().toISOString();
      const task: LocalTask = {
        id: crypto.randomUUID(),
        ...newTask,
        created_at: now,
        updated_at: now
      };

      setTasks(prev => [task, ...prev]);
      
      return { success: true, data: task };
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: 'Error adding task',
        description: 'Could not add task',
        variant: 'destructive'
      });
      return { success: false, error };
    }
  };

  // Update task
  const updateTask = async (id: string, updates: Partial<Omit<LocalTask, 'id' | 'created_at'>>) => {
    try {
      const taskIndex = tasks.findIndex(task => task.id === id);
      
      if (taskIndex === -1) {
        throw new Error(`Task with ID ${id} not found`);
      }

      const updatedTask = {
        ...tasks[taskIndex],
        ...updates,
        updated_at: new Date().toISOString()
      };

      const updatedTasks = [...tasks];
      updatedTasks[taskIndex] = updatedTask;
      
      setTasks(updatedTasks);
      
      return { success: true, data: updatedTask };
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error updating task',
        description: 'Could not update task',
        variant: 'destructive'
      });
      return { success: false, error };
    }
  };

  // Delete task
  const deleteTask = async (id: string) => {
    try {
      setTasks(prev => prev.filter(task => task.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error deleting task',
        description: 'Could not delete task',
        variant: 'destructive'
      });
      return { success: false, error };
    }
  };

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask
  };
}