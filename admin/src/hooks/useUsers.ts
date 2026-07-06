import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ProfileWithVehicleCount } from '../types/database';

export function useUsers() {
  const [users, setUsers] = useState<ProfileWithVehicleCount[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
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

      if (planFilter && planFilter !== 'all') {
        query = query.eq('plan', planFilter);
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
  }, [search, planFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserPlan = async (userId: string, newPlan: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plan: newPlan })
        .eq('id', userId);
        
      if (error) throw error;
      await fetchUsers(); // refresh
      return true;
    } catch (error) {
      console.error('Error updating plan:', error);
      return false;
    }
  };

  return {
    users,
    totalCount,
    loading,
    search,
    setSearch,
    planFilter,
    setPlanFilter,
    page,
    setPage,
    pageSize,
    updateUserPlan,
    refresh: fetchUsers
  };
}
