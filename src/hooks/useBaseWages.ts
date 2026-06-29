import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { BaseWageItem } from '../types';

export function useBaseWages() {
  const [items, setItems] = useState<BaseWageItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBaseWages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('base_wages')
        .select('*')
        .eq('is_deleted', false)
        .order('wage', { ascending: true });
      
      if (error) throw error;
      
      const formatted = (data || []).map(d => ({
        id: d.id,
        wage: d.wage,
        description: d.description || ''
      }));
      setItems(formatted);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveBaseWages = async (drafts: BaseWageItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('base_wages').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      const activeItems = drafts.filter(item => !deletedIds.includes(item.id));
      const upserts = activeItems.map(item => ({
        id: item.id.startsWith('BWG-') ? undefined : item.id,
        wage: item.wage,
        description: item.description
      }));

      if (upserts.length > 0) {
        const { error } = await supabase.from('base_wages').upsert(upserts);
        if (error) throw error;
      }

      await fetchBaseWages();
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
    fetchBaseWages,
    batchSaveBaseWages
  };
}
