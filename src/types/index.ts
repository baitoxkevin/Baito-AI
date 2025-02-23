import type { Database } from './supabase';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

export interface UserMetadata {
  is_super_admin: boolean;
  full_name: string;
  email_verified: boolean;
}

export interface User extends Database['public']['Tables']['users']['Row'] {
  raw_user_meta_data: UserMetadata;
}
