export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: string;
          is_super_admin: boolean;
          raw_user_meta_data: {
            is_super_admin: boolean;
            full_name: string;
            email_verified: boolean;
          };
          created_at: string;
          updated_at: string;
        };
      };
      candidates: {
        Row: {
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
        };
      };
    };
    Enums: {
      user_role: 'admin' | 'user';
      candidate_status: 'available' | 'unavailable' | 'pending';
    };
  };
}
