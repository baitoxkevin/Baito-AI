-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can insert own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can update own attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can manage all attendance" ON attendance;

-- Recreate RLS policies for attendance
CREATE POLICY "Users can view own attendance"
  ON attendance FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Users can insert own attendance"
  ON attendance FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Users can update own attendance"
  ON attendance FOR UPDATE
  USING (auth.uid() = candidate_id);

CREATE POLICY "Admins can view all attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage all attendance"
  ON attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );
