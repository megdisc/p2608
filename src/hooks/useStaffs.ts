import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { StaffItem } from '../types';

export function useStaffs() {
  const [items, setItems] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStaffs = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('staffs').select('*').eq('is_deleted', false).order('yomigana', { ascending: true });
      if (error) throw error;
      if (data) setItems(data);
    } catch (error) {
      console.error('Error fetching staffs:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveStaffs = async (drafts: StaffItem[], deletedIds: string[]) => {
    try {
      setLoading(true);

      if (deletedIds.length > 0) {
        const { error } = await supabase.from('staffs').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      for (const item of drafts) {
        if (!deletedIds.includes(item.id)) {
          const cleanName = item.name.replace(/[\s　]+/g, '');
          if (item.id.startsWith('STF-')) {
            const { error } = await supabase.rpc('create_staff_user', {
              email: item.email || '',
              password: item.password || '',
              name: cleanName,
              yomigana: item.yomigana || '',
              role: item.role
            });
            if (error) throw error;
          } else {
            const { error: staffError } = await supabase.from('staffs').update({
              name: cleanName,
              yomigana: item.yomigana || '',
              email: item.email,
              role: item.role
            }).eq('id', item.id);
            if (staffError) throw staffError;

            if (item.password) {
              const { error: passError } = await supabase.rpc('update_staff_password', {
                user_id: item.id,
                new_password: item.password
              });
              if (passError) throw passError;
            }
          }
        }
      }

      await fetchStaffs();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    loading,
    fetchStaffs,
    batchSaveStaffs
  };
}
