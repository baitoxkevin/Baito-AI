-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;

-- Create documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  size integer NOT NULL,
  folder text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  shared_with text[] DEFAULT '{}',
  storage_path text,
  owner_id uuid REFERENCES users(id)
);

-- Create indexes with unique names
CREATE INDEX IF NOT EXISTS documents_folder_idx_20250214 ON documents(folder);
CREATE INDEX IF NOT EXISTS documents_owner_id_idx_20250214 ON documents(owner_id);
CREATE INDEX IF NOT EXISTS documents_created_at_idx_20250214 ON documents(created_at);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "enable_read_for_all" ON documents;
DROP POLICY IF EXISTS "enable_insert_for_authenticated" ON documents;
DROP POLICY IF EXISTS "enable_update_for_owner" ON documents;
DROP POLICY IF EXISTS "enable_delete_for_owner" ON documents;

-- Create new RLS policies with unique names
CREATE POLICY "documents_select_policy"
  ON documents
  FOR SELECT
  USING (true);

CREATE POLICY "documents_insert_policy"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "documents_update_policy"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "documents_delete_policy"
  ON documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger with IF NOT EXISTS
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();
