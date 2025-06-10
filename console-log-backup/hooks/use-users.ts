import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/types';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .order('full_name');
        
      if (error) throw error;
      
      // Generate avatar URLs from names since the database doesn't have avatar_url
      const usersWithAvatars = (data || []).map(user => ({
        ...user,
        avatar_url: null
      }));
      
      setUsers(usersWithAvatars);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch users'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, isLoading, error, refetch: fetchUsers };
}