-- Fix for task position and status not updating properly
-- This migration updates the update_task_position function to also update the task status

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.update_task_position;

-- Create the updated function
CREATE OR REPLACE FUNCTION public.update_task_position(task_id UUID, new_column_id UUID, new_position INTEGER)
RETURNS VOID AS $$$
DECLARE
  column_name TEXT;
  new_status TEXT;
BEGIN
  -- Get the column name to determine the task status
  SELECT name INTO column_name FROM public.kanban_columns WHERE id = new_column_id;
  
  -- Map column name to task status
  IF column_name ILIKE '%backlog%' THEN
    new_status := 'backlog';
  ELSIF column_name ILIKE '%progress%' OR column_name ILIKE '%doing%' THEN
    new_status := 'doing';
  ELSIF column_name ILIKE '%done%' OR column_name ILIKE '%complete%' THEN
    new_status := 'done';
  ELSIF column_name ILIKE '%todo%' OR column_name ILIKE '%to do%' THEN
    new_status := 'todo';
  ELSE
    new_status := 'todo'; -- Default fallback
  END IF;
  
  -- Update the task's column, position, and status
  UPDATE public.tasks
  SET column_id = new_column_id,
      position = new_position,
      status = new_status,
      updated_at = now()
  WHERE id = task_id;
  
  -- Reorder other tasks in the column
  UPDATE public.tasks
  SET position = position + 1,
      updated_at = now()
  WHERE column_id = new_column_id
    AND position >= new_position
    AND id != task_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_task_position TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_task_position TO service_role;