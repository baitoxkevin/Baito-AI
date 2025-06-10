export type UserRole = 'super_admin' | 'admin' | 'manager' | 'client' | 'staff';

export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'done';

export type AdminRole = 'super_admin' | 'admin';

export interface AdminUser extends User {
  role: AdminRole;
  is_super_admin: boolean;
}

// Client interface can represent either a dedicated clients table entry or a users table entry with role='client'
export interface Client {
  id: string;
  full_name: string;
  company_name?: string;
  email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  deleted_by?: string;
}

export interface ContactPerson {
  id?: string;
  company_id?: string;
  name: string;
  designation?: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  id: string;
  company_name: string; // Actual database column name
  company_email: string; // Actual database column name
  company_phone_no: string; // Actual database column name
  address?: string;
  parent_id?: string | null; // For hierarchical relationships
  pic_name?: string; // Legacy field for backward compatibility
  pic_designation?: string; // Legacy field for backward compatibility
  pic_email?: string; // Legacy field for backward compatibility
  pic_phone?: string; // Legacy field for backward compatibility
  logo_url?: string; // Company logo image URL
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_by?: string;
  
  // These properties are for backward compatibility with existing code
  name?: string; // Alias for company_name  
  contact_email?: string; // Alias for company_email
  contact_phone?: string; // Alias for company_phone_no
  
  // Additional properties for linked data
  contacts?: ContactPerson[];
  parent_company?: Company;
  child_companies?: Company[];
}

export interface Invite {
  id: string;
  email: string;
  role: UserRole;
  company_id?: string;
  expires_at: string;
  created_at: string;
  created_by: string;
  status: 'pending' | 'accepted' | 'expired';
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_super_admin: boolean;
  company_name?: string;
  contact_phone?: string;
  avatar_url?: string;
  avatar_seed?: string;
  username?: string;
  created_at: string;
  updated_at: string;
  raw_user_meta_data?: Record<string, unknown>;
  raw_app_meta_data?: Record<string, unknown>;
}

export interface UserProfile extends User {
  username: string;
  avatar_seed?: string;
  last_login?: string;
  preferences?: Record<string, unknown>;
}

export interface Candidate {
  id: string;
  full_name: string;
  ic_number?: string;
  date_of_birth?: string;
  phone_number: string;
  gender?: string;
  email?: string;
  nationality?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  emergency_contact_relationship?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  bank_account_relationship?: string;
  not_own_account?: boolean;
  highest_education?: string;
  field_of_study?: string;
  work_experience?: string;
  has_vehicle?: boolean;
  vehicle_type?: string;
  is_banned?: boolean;
  status?: string;
  unique_id?: string;
  profile_photo?: string;
  full_body_photos?: unknown;
  half_body_photos?: unknown;
  address_business?: unknown;
  address_mailing?: unknown;
  home_address?: string;
  business_address?: string;
  shirt_size?: string;
  languages_spoken?: string;
  race?: string;
  passport_number?: string;
  custom_fields?: unknown;
  created_at: string;
  updated_at: string;
  created_by?: string;
  created_by_user_id?: string;
  address?: string;
  address_home?: string;
  performance_metrics?: {
    reliability_score: number;
    response_rate: number;
    avg_rating: number;
    total_gigs_completed: number;
    no_shows: number;
    late_arrivals: number;
    early_terminations: number;
    category_ratings: Record<string, number>;
  };
  loyalty_status?: {
    tier_level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    current_points: number;
    total_gigs_completed: number;
    tier_achieved_date: string;
    points_expiry_date: string;
    fast_track_eligible: boolean;
  };
  latest_ban?: {
    ban_reason: string;
    ban_date: string;
    is_permanent: boolean;
  };
}

export interface ProjectLocation {
  id?: string;
  project_id?: string;
  address: string;
  date: string; // ISO string
  is_primary: boolean;
  notes?: string;
}

export interface ProjectStaffMember {
  id: string;
  name: string;
  designation?: string;
  photo?: string;
  status: 'confirmed' | 'pending' | 'kiv' | 'rejected';
  appliedDate?: string;
  applyType?: 'full' | 'specific';
  workingDates?: Date[] | string[];
}

export interface Project {
  id: string;
  title: string;
  client_id?: string;
  manager_id?: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string | null;
  crew_count: number;
  filled_positions: number;
  working_hours_start: string;
  working_hours_end: string;
  event_type: string;
  project_type?: 'recruitment' | 'internal_event' | 'custom';
  venue_address: string;
  venue_details?: string;
  supervisors_required: number;
  color: string;
  logo_url?: string;
  brand_logo?: string;
  budget?: number;
  deleted_at?: string;
  deleted_by?: string;
  created_at: string;
  updated_at: string;
  client?: User;
  manager?: User;
  
  // Staff management
  confirmed_staff?: ProjectStaffMember[];
  applicants?: ProjectStaffMember[];
  
  // For recurring schedules
  schedule_type?: 'single' | 'recurring' | 'multiple';
  recurrence_pattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurrence_days?: number[]; // 0-6 for days of week (0 = Sunday)
  
  // For multiple locations
  locations?: ProjectLocation[];
}

// Removed KanbanBoard interface

// Removed KanbanColumn interface

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  created_at: string;
  uploader?: User;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  priority: 'high' | 'medium' | 'low';
  estimated_hours?: number;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  project_id: string;
  status: TaskStatus;
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  assigned_to?: string;
  assigned_by?: string;
  assigned_at?: string;
  position?: number;
  column_id?: string;
  board_id?: string;
  estimated_hours?: number;
  completed_at?: string;
  labels?: string[];
  template_id?: string;
  created_at: string;
  updated_at: string;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  assignee?: User;
}