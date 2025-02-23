-- Create documents table with required fields
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  folder TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  shared_with TEXT[] DEFAULT '{}',
  storage_path TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  document_type TEXT CHECK (document_type IN ('project_pl', 'project_claim', 'project_proposal', 'briefing_deck')),
  project_id UUID REFERENCES projects(id)
);

-- Add RLS policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins can do everything"
ON documents
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
  )
);

-- Users can read documents shared with them
CREATE POLICY "Users can read shared documents"
ON documents
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() OR
  auth.uid()::text = ANY(shared_with)
);

-- Users can manage their own documents
CREATE POLICY "Users can manage their documents"
ON documents
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());
