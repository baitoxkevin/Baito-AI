import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UserInfo {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export function useUserInfo(userId: string | null | undefined): UserInfo | null {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (!userId) {
      setUserInfo(null);
      return;
    }

    async function fetchUserInfo() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url')
          .eq('id', userId)
          .single();

        if (error) {
          // Fallback to auth.users if users table doesn't have the info
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
          if (!authError && authUser) {
            setUserInfo({
              id: authUser.user.id,
              email: authUser.user.email || '',
              full_name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'Unknown',
              avatar_url: authUser.user.user_metadata?.avatar_url
            });
          } else {
            setUserInfo(null);
          }
        } else {
          setUserInfo(data);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        setUserInfo(null);
      }
    }

    fetchUserInfo();
  }, [userId]);

  return userInfo;
}