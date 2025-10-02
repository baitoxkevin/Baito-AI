-- Temporarily disable RLS for the receipts table for demo purposes
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;

-- Create an admin policy to allow all access for the demo
CREATE POLICY "Admin policy" 
ON receipts
FOR ALL
USING (true)
WITH CHECK (true);

-- Add a trigger function to automatically set user_id for new receipts
-- This is for demo purposes when user_id is not explicitly set
CREATE OR REPLACE FUNCTION set_user_id_for_receipts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    -- Get the current authenticated user, or use a demo user ID
    NEW.user_id = COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER set_user_id_before_insert
BEFORE INSERT ON receipts
FOR EACH ROW
EXECUTE FUNCTION set_user_id_for_receipts();