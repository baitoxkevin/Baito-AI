import type { Database } from './supabase';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

export interface UserMetadata {
  is_super_admin: boolean;
  full_name: string;
  email_verified: boolean;
}

export interface User {
  id: string;
  email: string;
  role: string;
  is_super_admin: boolean;
  raw_user_meta_data: UserMetadata;
}
