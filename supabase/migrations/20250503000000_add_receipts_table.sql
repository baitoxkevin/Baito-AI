-- Create a new table for receipts
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  vendor VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  image_url TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Add RLS policies for receipts
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Policy for select - users can view their own receipts
CREATE POLICY "Users can view their own receipts" 
  ON receipts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for insert - users can add their own receipts
CREATE POLICY "Users can add their own receipts" 
  ON receipts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for update - users can update their own receipts
CREATE POLICY "Users can update their own receipts" 
  ON receipts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for delete - users can delete their own receipts (soft delete)
CREATE POLICY "Users can delete their own receipts" 
  ON receipts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_date ON receipts(date);
CREATE INDEX idx_receipts_project_id ON receipts(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_receipts_task_id ON receipts(task_id) WHERE task_id IS NOT NULL;

-- Create a function to update the updated_at field
CREATE OR REPLACE FUNCTION update_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at field
CREATE TRIGGER update_receipts_updated_at
BEFORE UPDATE ON receipts
FOR EACH ROW
EXECUTE FUNCTION update_receipts_updated_at();

-- Create a view for receipt summaries
CREATE OR REPLACE VIEW receipt_summaries AS
SELECT 
  user_id,
  DATE_TRUNC('month', date) AS month,
  SUM(amount) AS total_amount,
  COUNT(*) AS receipt_count,
  ARRAY_AGG(DISTINCT category) FILTER (WHERE category IS NOT NULL) AS categories
FROM receipts
WHERE deleted_at IS NULL
GROUP BY user_id, DATE_TRUNC('month', date);

-- Allow all authenticated users to view their own receipt summaries
CREATE POLICY "Users can view their own receipt summaries" 
  ON receipt_summaries
  FOR SELECT
  USING (auth.uid() = user_id);