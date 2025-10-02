/*
  # Make tables publicly accessible
  
  1. Changes
    - Modifies RLS policies to allow public read access
    - Maintains write protection for authenticated users
    - Simplifies access control across all tables
  
  2. Security
    - Read operations are public
    - Write operations still require authentication
    - Maintains data integrity while increasing accessibility
*/

-- Temporarily disable RLS
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE crew_assignments DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users on projects" ON projects;
DROP POLICY IF EXISTS "Enable full access for super admins" ON users;
DROP POLICY IF EXISTS "Enable user profile creation" ON users;
DROP POLICY IF EXISTS "Enable self profile management" ON users;
DROP POLICY IF EXISTS "Enable self profile updates" ON users;
DROP POLICY IF EXISTS "Enable basic user info access" ON users;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on candidates" ON candidates;
DROP POLICY IF EXISTS "Super admins can manage all companies" ON companies;
DROP POLICY IF EXISTS "Regular users can view non-deleted companies" ON companies;

-- Create new simplified policies for projects
CREATE POLICY "Allow public read access to projects"
  ON projects FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to modify projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new simplified policies for users
CREATE POLICY "Allow public read access to users"
  ON users FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to modify users"
  ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new simplified policies for candidates
CREATE POLICY "Allow public read access to candidates"
  ON candidates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to modify candidates"
  ON candidates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new simplified policies for companies
CREATE POLICY "Allow public read access to companies"
  ON companies FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to modify companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new simplified policies for crew assignments
CREATE POLICY "Allow public read access to crew assignments"
  ON crew_assignments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to modify crew assignments"
  ON crew_assignments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_assignments ENABLE ROW LEVEL SECURITY;