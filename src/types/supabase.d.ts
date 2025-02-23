export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_super_admin?: boolean;
  company_name?: string;
  contact_phone?: string;
  created_at: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  folder: string;
  created_at: string;
  updated_at: string;
  shared_with: string[];
  storage_path: string;
  owner_id: string;
  document_type?: 'project_pl' | 'project_claim' | 'project_proposal' | 'briefing_deck';
  project_id?: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  status: 'available' | 'unavailable' | 'pending';
  rating: number;
  skills: string[];
  experience_years: number;
  preferred_locations: string[];
  created_at: string;
  last_active_at: string;
  completed_projects: number;
}
