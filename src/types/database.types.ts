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
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'mention' | 'assignment' | 'update';
          task_id?: string;
          project_id?: string;
          title: string;
          message: string;
          read: boolean;
          created_at: string;
        };
      };
    };
    Enums: {};
  };
}
