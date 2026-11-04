import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { StaffRoleTableItem } from '../types/db';

export function useStaffRoles() {
  const [items, setItems] = useState<StaffRoleTableItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStaffRoles = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff_roles')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('code', { ascending: true });

      if (error) throw error;
      setItems((data as StaffRoleTableItem[]) || []);
    } catch (err) {
      console.error('Error fetching staff roles:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    items,
    loading,
    fetchStaffRoles,
  };
}

