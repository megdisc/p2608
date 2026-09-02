import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { DeductionItem } from '../types';

export function useDeductions() {
  const [items, setItems] = useState<DeductionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDeductions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deductions')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      const formatted: DeductionItem[] = (data || []).map(d => ({
        id: d.id,
        name: d.name || '',
        occurrence_type: d.occurrence_type || 'daily',
        default_unit_price: Number(d.default_unit_price) || 0,
        is_active: d.is_active ?? true,
      }));
      setItems(formatted);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveDeductions = async (drafts: DeductionItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      
      if (deletedIds.length > 0) {
        const realDeletedIds = deletedIds.filter(id => !id.startsWith('DED-'));
        if (realDeletedIds.length > 0) {
          const { error } = await supabase.from('deduction_items').update({ deleted_at: new Date().toISOString() }).in('id', realDeletedIds);
          if (error) throw error;
        }
      }

      const activeItems = drafts.filter(item => !deletedIds.includes(item.id));
      const upserts = activeItems.map(item => ({
        id: item.id.startsWith('DED-') ? undefined : item.id,
        name: item.name,
        occurrence_type: item.occurrence_type,
        default_unit_price: item.default_unit_price,
        is_active: item.is_active ?? true,
      }));

      if (upserts.length > 0) {
        const { error } = await supabase.from('deductions').upsert(upserts);
        if (error) throw error;
      }

      await fetchDeductions();
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
    fetchDeductions,
    batchSaveDeductions
  };
}
