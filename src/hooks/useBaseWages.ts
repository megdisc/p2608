import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { BaseWageItem } from '../types';

export function useBaseWages() {
  const [items, setItems] = useState<BaseWageItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBaseWages = useCallback(async (officeId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('wage_rates')
        .select('*')
        .eq('is_deleted', false);

      if (officeId) {
        query = query.eq('office_id', officeId);
      }

      const { data, error } = await query.order('wage', { ascending: true });
      
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

  const batchSaveBaseWages = async (drafts: BaseWageItem[], deletedIds: string[], officeId?: string) => {
    try {
      setLoading(true);
      
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('wage_rate_items').update({ deleted_at: new Date().toISOString() }).in('id', deletedIds);
        if (error) throw error;
      }

      const activeItems = drafts.filter(item => !deletedIds.includes(item.id));
      const upserts = activeItems.map(item => ({
        ...(item.id.startsWith('BWG-') ? {} : { id: item.id }),
        ...(officeId ? { office_id: officeId } : {}),
        wage: item.wage,
        description: item.description
      }));

      if (upserts.length > 0) {
        const { error } = await supabase.from('wage_rate_items').upsert(upserts);
        if (error) throw error;
      }

      await fetchBaseWages(officeId);
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

