import { supabase } from './supabase';
import type { Notification } from './types';

export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      ...notification,
      read: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw error;
};

export const getNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
