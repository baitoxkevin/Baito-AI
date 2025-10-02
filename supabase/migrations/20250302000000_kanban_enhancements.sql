-- Enhance tasks table for kanban functionality
ALTER TABLE IF EXISTS "public"."tasks" 
  ADD COLUMN IF NOT EXISTS "position" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "board_id" UUID REFERENCES public.kanban_boards(id) ON DELETE CASCADE;

-- Create kanban_boards table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."kanban_boards" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "project_id" UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- Create kanban_columns table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."kanban_columns" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "board_id" UUID REFERENCES public.kanban_boards(id) ON DELETE CASCADE,
  "position" INTEGER DEFAULT 0,
  "color" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for kanban_boards
ALTER TABLE "public"."kanban_boards" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their project boards" ON "public"."kanban_boards"
  FOR SELECT USING (
    auth.uid() IN (
      SELECT manager_id FROM projects WHERE id = project_id
      UNION
      SELECT client_id FROM projects WHERE id = project_id
    )
  );
CREATE POLICY "Users can create boards for their projects" ON "public"."kanban_boards"
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT manager_id FROM projects WHERE id = project_id
    )
  );
CREATE POLICY "Users can update their project boards" ON "public"."kanban_boards"
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT manager_id FROM projects WHERE id = project_id
    )
  );
CREATE POLICY "Users can delete their project boards" ON "public"."kanban_boards"
  FOR DELETE USING (
    auth.uid() IN (
      SELECT manager_id FROM projects WHERE id = project_id
    )
  );

-- Add RLS policies for kanban_columns
ALTER TABLE "public"."kanban_columns" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view board columns" ON "public"."kanban_columns"
  FOR SELECT USING (
    auth.uid() IN (
      SELECT p.manager_id FROM projects p
      JOIN kanban_boards kb ON p.id = kb.project_id
      WHERE kb.id = board_id
      UNION
      SELECT p.client_id FROM projects p
      JOIN kanban_boards kb ON p.id = kb.project_id
      WHERE kb.id = board_id
    )
  );
CREATE POLICY "Users can create columns for their boards" ON "public"."kanban_columns"
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT p.manager_id FROM projects p
      JOIN kanban_boards kb ON p.id = kb.project_id
      WHERE kb.id = board_id
    )
  );
CREATE POLICY "Users can update their board columns" ON "public"."kanban_columns"
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT p.manager_id FROM projects p
      JOIN kanban_boards kb ON p.id = kb.project_id
      WHERE kb.id = board_id
    )
  );
CREATE POLICY "Users can delete their board columns" ON "public"."kanban_columns"
  FOR DELETE USING (
    auth.uid() IN (
      SELECT p.manager_id FROM projects p
      JOIN kanban_boards kb ON p.id = kb.project_id
      WHERE kb.id = board_id
    )
  );

-- Update tasks table to reference kanban_columns
ALTER TABLE IF EXISTS "public"."tasks" 
  ADD COLUMN IF NOT EXISTS "column_id" UUID REFERENCES public.kanban_columns(id) ON DELETE SET NULL;

-- Create function to auto-generate a default kanban board when a project is created
CREATE OR REPLACE FUNCTION public.create_default_kanban_board()
RETURNS TRIGGER AS $$
DECLARE
  board_id UUID;
  todo_col_id UUID;
  doing_col_id UUID;
  done_col_id UUID;
BEGIN
  -- Create a default board for the new project
  INSERT INTO public.kanban_boards (name, description, project_id)
  VALUES (NEW.title || ' Board', 'Default kanban board for ' || NEW.title, NEW.id)
  RETURNING id INTO board_id;
  
  -- Create default columns
  INSERT INTO public.kanban_columns (name, board_id, position, color)
  VALUES ('To Do', board_id, 0, '#E2E8F0')
  RETURNING id INTO todo_col_id;
  
  INSERT INTO public.kanban_columns (name, board_id, position, color)
  VALUES ('In Progress', board_id, 1, '#93C5FD')
  RETURNING id INTO doing_col_id;
  
  INSERT INTO public.kanban_columns (name, board_id, position, color)
  VALUES ('Done', board_id, 2, '#BBF7D0')
  RETURNING id INTO done_col_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate kanban board for new projects
DROP TRIGGER IF EXISTS create_kanban_board_for_project ON public.projects;
CREATE TRIGGER create_kanban_board_for_project
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_kanban_board();

-- Functions to support position updates for drag-and-drop
CREATE OR REPLACE FUNCTION public.update_task_position(task_id UUID, new_column_id UUID, new_position INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Update the task's column and position
  UPDATE public.tasks
  SET column_id = new_column_id,
      position = new_position,
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