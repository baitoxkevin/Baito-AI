-- Add task comments table
CREATE TABLE IF NOT EXISTS "public"."task_comments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "task_id" UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  "user_id" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- Add task attachments table
CREATE TABLE IF NOT EXISTS "public"."task_attachments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "task_id" UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  "filename" TEXT NOT NULL,
  "file_path" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "file_type" TEXT NOT NULL,
  "uploaded_by" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Add task templates table
CREATE TABLE IF NOT EXISTS "public"."task_templates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "user_id" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  "priority" TEXT DEFAULT 'medium',
  "estimated_hours" NUMERIC(5,2),
  "is_global" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- Enhance tasks table with additional fields for assignment and filtering
ALTER TABLE IF EXISTS "public"."tasks" 
  ADD COLUMN IF NOT EXISTS "assigned_to" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "assigned_by" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "assigned_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "estimated_hours" NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "labels" TEXT[],
  ADD COLUMN IF NOT EXISTS "template_id" UUID REFERENCES public.task_templates(id) ON DELETE SET NULL;

-- Add RLS policies for task_comments
ALTER TABLE "public"."task_comments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view task comments" ON "public"."task_comments"
  FOR SELECT USING (
    auth.uid() IN (
      SELECT p.manager_id FROM projects p
      JOIN tasks t ON p.id = t.project_id
      WHERE t.id = task_id
      UNION
      SELECT p.client_id FROM projects p
      JOIN tasks t ON p.id = t.project_id
      WHERE t.id = task_id
    )
  );
CREATE POLICY "Users can create comments for tasks" ON "public"."task_comments"
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT p.manager_id FROM projects p
      JOIN tasks t ON p.id = t.project_id
      WHERE t.id = task_id
      UNION
      SELECT p.client_id FROM projects p
      JOIN tasks t ON p.id = t.project_id
      WHERE t.id = task_id
    )
  );
CREATE POLICY "Users can update their own comments" ON "public"."task_comments"
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON "public"."task_comments"
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for task_attachments
ALTER TABLE "public"."task_attachments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view task attachments" ON "public"."task_attachments"
  FOR SELECT USING (
    auth.uid() IN (
      SELECT p.manager_id FROM projects p
      JOIN tasks t ON p.id = t.project_id
      WHERE t.id = task_id
      UNION
      SELECT p.client_id FROM projects p
      JOIN tasks t ON p.id = t.project_id
      WHERE t.id = task_id
    )
  );
CREATE POLICY "Users can upload attachments for tasks" ON "public"."task_attachments"
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT p.manager_id FROM projects p
      JOIN tasks t ON p.id = t.project_id
      WHERE t.id = task_id
      UNION
      SELECT p.client_id FROM projects p
      JOIN tasks t ON p.id = t.project_id
      WHERE t.id = task_id
    )
  );
CREATE POLICY "Users can delete their own attachments" ON "public"."task_attachments"
  FOR DELETE USING (auth.uid() = uploaded_by);

-- Add RLS policies for task_templates
ALTER TABLE "public"."task_templates" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view global templates and their own templates" ON "public"."task_templates"
  FOR SELECT USING (is_global OR auth.uid() = user_id);
CREATE POLICY "Users can create templates" ON "public"."task_templates"
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON "public"."task_templates"
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON "public"."task_templates"
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to set completed_at when a task is moved to Done column
CREATE OR REPLACE FUNCTION public.set_task_completed_at()
RETURNS TRIGGER AS $$
DECLARE
  column_name TEXT;
BEGIN
  -- Get the column name
  SELECT name INTO column_name FROM public.kanban_columns WHERE id = NEW.column_id;
  
  -- If the task was moved to a "Done" column, set completed_at
  IF column_name ILIKE '%done%' OR column_name ILIKE '%complete%' THEN
    NEW.completed_at := COALESCE(NEW.completed_at, now());
    NEW.status := 'done';
  -- If the task was moved out of a "Done" column, unset completed_at
  ELSIF OLD.status = 'done' AND NEW.status != 'done' THEN
    NEW.completed_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set completed_at when a task is moved to Done
DROP TRIGGER IF EXISTS set_task_completed ON public.tasks;
CREATE TRIGGER set_task_completed
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  WHEN (OLD.column_id IS DISTINCT FROM NEW.column_id OR OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.set_task_completed_at();

-- Create function to update assigned_at when assigned_to is changed
CREATE OR REPLACE FUNCTION public.set_task_assigned_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
    NEW.assigned_at := now();
    NEW.assigned_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update assigned_at when a task is assigned
DROP TRIGGER IF EXISTS set_task_assigned ON public.tasks;
CREATE TRIGGER set_task_assigned
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  WHEN (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to)
  EXECUTE FUNCTION public.set_task_assigned_at();