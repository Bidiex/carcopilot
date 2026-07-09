import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ProfileWithVehicleCount } from '../types/database';

export function useUsers() {
  const [users, setUsers] = useState<ProfileWithVehicleCount[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*, vehicles(count)', { count: 'exact' });

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (accessFilter && accessFilter !== 'all') {
        query = query.eq('access_status', accessFilter);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, count, error } = await query;

      if (error) throw error;

      setUsers((data as unknown as ProfileWithVehicleCount[]) || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [search, accessFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserAccess = async (userId: string, newAccess: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ access_status: newAccess })
        .eq('id', userId);
        
      if (error) throw error;
      await fetchUsers(); // refresh
      return true;
    } catch (error) {
      console.error('Error updating access status:', error);
      return false;
    }
  };

  return {
    users,
    totalCount,
    loading,
    search,
    setSearch,
    accessFilter,
    setAccessFilter,
    page,
    setPage,
    pageSize,
    updateUserAccess,
    refresh: fetchUsers
  };
}
