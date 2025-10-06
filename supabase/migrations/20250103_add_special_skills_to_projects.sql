-- Add special skills/requirements field to projects
-- Migration: 20250103_add_special_skills_to_projects

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS special_skills_required TEXT,
ADD COLUMN IF NOT EXISTS special_requirements JSONB DEFAULT '[]'::jsonb;

-- Index for searching by skills
CREATE INDEX IF NOT EXISTS idx_projects_special_skills ON projects USING gin(special_requirements);

-- Comments
COMMENT ON COLUMN projects.special_skills_required IS 'Free text description of special skills or requirements needed for this project';
COMMENT ON COLUMN projects.special_requirements IS 'Structured array of skill requirements with details (e.g., [{skill: "Bilingual", level: "required", notes: "English + Mandarin"}])';
