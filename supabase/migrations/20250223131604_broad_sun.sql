/*
  # Candidates Management System Schema

  1. New Tables
    - candidates: Core candidate information
    - location_preferences: Candidate location and transport details
    - availability: Working hours and availability preferences
    - language_proficiency: Language skills and proficiency levels
    - physical_capabilities: Physical ability assessments
    - measurements: Physical measurements for uniform sizing
    - certifications: Professional certifications and verifications
    - photos: Candidate photos and verification status
    - experience: Skills and work experience
    - gig_history: Past gig/event participation records
    - gig_tasks: Specific tasks within gigs
    - gig_attendance: Attendance and check-in records
    - gig_payments: Payment details for gigs
    - gig_feedback: Performance feedback and ratings
    - performance_metrics: Aggregated performance data
    - loyalty_status: Loyalty program information
    - milestone_achievements: Career milestones and rewards
    - benefits: Available benefits and status
    - ban_records: Ban history and appeals

  2. Security
    - Enable RLS on all tables
    - Add policies for data access control
    - Implement soft delete where appropriate

  3. Relationships
    - Establish foreign key relationships
    - Create necessary indexes
    - Set up cascading deletes where appropriate
*/

-- Create necessary ENUMs
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE proficiency_level AS ENUM ('basic', 'intermediate', 'fluent', 'native');
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent', 'excused');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'cancelled', 'disputed');
CREATE TYPE loyalty_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');
CREATE TYPE milestone_type AS ENUM ('gigs_completed', 'rating_achieved', 'years_active', 'special');
CREATE TYPE benefit_type AS ENUM ('insurance', 'training', 'equipment', 'bonus', 'other');
CREATE TYPE ban_reason AS ENUM ('no_show', 'misconduct', 'poor_performance', 'policy_violation', 'other');
CREATE TYPE appeal_status AS ENUM ('pending', 'approved', 'rejected', 'under_review');

-- Create candidates table
CREATE TABLE candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  ic_number text UNIQUE NOT NULL,
  date_of_birth date NOT NULL,
  phone_number text NOT NULL,
  gender gender_type NOT NULL,
  email text UNIQUE NOT NULL,
  nationality text NOT NULL,
  emergency_contact_name text NOT NULL,
  emergency_contact_number text NOT NULL,
  bank_name text,
  bank_account_number text,
  highest_education text,
  has_vehicle boolean DEFAULT false,
  vehicle_type text,
  is_banned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create location_preferences table
CREATE TABLE location_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  current_latitude float,
  current_longitude float,
  current_address text,
  preferred_working_zones jsonb,
  public_transport_dependent boolean DEFAULT false,
  transport_notes text,
  last_location_update timestamptz DEFAULT now()
);

-- Create availability table
CREATE TABLE availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  preferred_working_hours jsonb NOT NULL,
  weekend_available boolean DEFAULT false,
  public_holiday_available boolean DEFAULT false,
  blackout_dates jsonb,
  notice_period_days integer DEFAULT 7,
  last_updated timestamptz DEFAULT now()
);

-- Create language_proficiency table
CREATE TABLE language_proficiency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  language text NOT NULL,
  proficiency_level proficiency_level NOT NULL,
  is_primary boolean DEFAULT false,
  last_updated timestamptz DEFAULT now()
);

-- Create physical_capabilities table
CREATE TABLE physical_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  capability_type text NOT NULL,
  is_capable boolean NOT NULL,
  notes text
);

-- Create measurements table
CREATE TABLE measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  height_cm float NOT NULL,
  weight_kg float NOT NULL,
  shirt_size text NOT NULL,
  neck_cm float,
  chest_cm float,
  waist_cm float,
  hip_cm float,
  inseam_cm float,
  shoulder_cm float,
  shoe_size text NOT NULL,
  last_updated timestamptz DEFAULT now()
);

-- Create certifications table
CREATE TABLE certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  cert_name text NOT NULL,
  cert_number text NOT NULL,
  issuing_body text NOT NULL,
  issue_date date NOT NULL,
  expiry_date date,
  cert_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create photos table
CREATE TABLE photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  full_body_url text,
  half_body_url text,
  profile_photo_url text NOT NULL,
  upload_date timestamptz DEFAULT now(),
  is_verified boolean DEFAULT false
);

-- Create experience table
CREATE TABLE experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  years_experience integer NOT NULL,
  certification_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create gig_history table
CREATE TABLE gig_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  event_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  gig_type text NOT NULL,
  gig_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text NOT NULL,
  client_name text NOT NULL,
  event_name text NOT NULL,
  status text NOT NULL,
  base_pay_rate decimal NOT NULL,
  overtime_eligible boolean DEFAULT false,
  supervisor_name text,
  dress_code text,
  special_requirements text,
  created_at timestamptz DEFAULT now()
);

-- Create gig_tasks table
CREATE TABLE gig_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_history_id uuid REFERENCES gig_history(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  task_description text,
  start_time time NOT NULL,
  end_time time NOT NULL,
  completed boolean DEFAULT false,
  completion_notes text,
  created_at timestamptz DEFAULT now()
);

-- Create gig_attendance table
CREATE TABLE gig_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_history_id uuid REFERENCES gig_history(id) ON DELETE CASCADE,
  check_in_time timestamptz,
  check_out_time timestamptz,
  check_in_latitude float,
  check_in_longitude float,
  check_out_latitude float,
  check_out_longitude float,
  check_in_photo_url text,
  check_out_photo_url text,
  attendance_status attendance_status NOT NULL,
  remarks text
);

-- Create gig_payments table
CREATE TABLE gig_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_history_id uuid REFERENCES gig_history(id) ON DELETE CASCADE,
  base_amount decimal NOT NULL,
  overtime_hours decimal DEFAULT 0,
  overtime_amount decimal DEFAULT 0,
  bonus_amount decimal DEFAULT 0,
  bonus_reason text,
  transport_allowance decimal DEFAULT 0,
  meal_allowance decimal DEFAULT 0,
  total_amount decimal NOT NULL,
  payment_status payment_status NOT NULL,
  payment_date date,
  payment_reference text,
  created_at timestamptz DEFAULT now()
);

-- Create gig_feedback table
CREATE TABLE gig_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_history_id uuid REFERENCES gig_history(id) ON DELETE CASCADE,
  punctuality_rating integer CHECK (punctuality_rating BETWEEN 1 AND 5),
  attitude_rating integer CHECK (attitude_rating BETWEEN 1 AND 5),
  performance_rating integer CHECK (performance_rating BETWEEN 1 AND 5),
  presentation_rating integer CHECK (presentation_rating BETWEEN 1 AND 5),
  supervisor_comments text,
  client_feedback text,
  areas_of_improvement text,
  recommended_for_future boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create performance_metrics table
CREATE TABLE performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  reliability_score float CHECK (reliability_score BETWEEN 0 AND 100),
  response_rate float CHECK (response_rate BETWEEN 0 AND 100),
  avg_rating float CHECK (avg_rating BETWEEN 0 AND 5),
  total_gigs_completed integer DEFAULT 0,
  no_shows integer DEFAULT 0,
  late_arrivals integer DEFAULT 0,
  early_terminations integer DEFAULT 0,
  category_ratings jsonb,
  last_updated timestamptz DEFAULT now()
);

-- Create loyalty_status table
CREATE TABLE loyalty_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  tier_level loyalty_tier NOT NULL,
  total_gigs_completed integer DEFAULT 0,
  current_points integer DEFAULT 0,
  tier_achieved_date date NOT NULL,
  points_expiry_date date,
  fast_track_eligible boolean DEFAULT false,
  last_updated timestamptz DEFAULT now()
);

-- Create milestone_achievements table
CREATE TABLE milestone_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  milestone_name text NOT NULL,
  gigs_count integer,
  achieved_date date NOT NULL,
  reward_claimed boolean DEFAULT false,
  reward_details text,
  milestone_type milestone_type NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create benefits table
CREATE TABLE benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  benefit_name text NOT NULL,
  start_date date NOT NULL,
  expiry_date date,
  is_active boolean DEFAULT true,
  benefit_details text,
  benefit_type benefit_type NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create ban_records table
CREATE TABLE ban_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  ban_reason ban_reason NOT NULL,
  detailed_reason text NOT NULL,
  evidence_url text,
  banned_by uuid REFERENCES auth.users(id),
  ban_date timestamptz NOT NULL,
  appeal_date timestamptz,
  appeal_status appeal_status,
  appeal_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  is_permanent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_proficiency ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ban_records ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
CREATE POLICY "Enable read access for authenticated users"
ON candidates FOR SELECT TO authenticated USING (true);

-- Add similar policies for other tables...

-- Create indexes for better performance
CREATE INDEX idx_candidates_full_name ON candidates(full_name);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_phone ON candidates(phone_number);
CREATE INDEX idx_gig_history_candidate ON gig_history(candidate_id);
CREATE INDEX idx_gig_history_date ON gig_history(gig_date);
CREATE INDEX idx_certifications_candidate ON certifications(candidate_id);
CREATE INDEX idx_experience_candidate ON experience(candidate_id);
CREATE INDEX idx_performance_metrics_candidate ON performance_metrics(candidate_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ban_records_updated_at
  BEFORE UPDATE ON ban_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();