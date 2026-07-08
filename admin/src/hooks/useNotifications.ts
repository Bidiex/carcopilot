import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'system' | 'promotional';
  segment: 'all' | 'free' | 'trial' | 'pro' | 'city';
  segment_value: string | null;
  destination_type: 'app_screen' | 'external_url' | 'none' | null;
  destination_value: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  recipient_count: number;
  created_by: string;
  created_at: string;
  recurrence_type?: 'once' | 'daily' | 'weekly';
  send_time?: string | null;
  send_day_of_week?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  next_send_at?: string | null;
  last_sent_at?: string | null;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications((data as AppNotification[]) || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const createNotification = async (notif: Partial<AppNotification>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .insert([{ ...notif, created_by: userData.user.id }]);

      if (error) throw error;
      await fetchNotifications();
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  };

  const sendNotificationNow = async (notificationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: { notification_id: notificationId }
      });
      if (error) throw error;
      await fetchNotifications();
      return { success: true, sent: data?.sent || 0 };
    } catch (error) {
      console.error('Error sending notification manually:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return {
    notifications,
    loading,
    createNotification,
    sendNotificationNow,
    refresh: fetchNotifications
  };
}
