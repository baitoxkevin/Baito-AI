export interface User {
  id: string;
  email: string;
  role: string;
  is_super_admin?: boolean;
}

export interface AuthResponse {
  data: {
    user: User | null;
    session: any;
  };
  error: Error | null;
}
