import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { AllowanceItem } from '../types';

export function useAllowances() {
  const [items, setItems] = useState<AllowanceItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllowances = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('allowances')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      const formatted: AllowanceItem[] = (data || []).map(d => ({
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

  const batchSaveAllowances = async (drafts: AllowanceItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      
      if (deletedIds.length > 0) {
        // IDがDB存在ID（ALW-始まりでない）の場合は削除
        const realDeletedIds = deletedIds.filter(id => !id.startsWith('ALW-'));
        if (realDeletedIds.length > 0) {
          const { error } = await supabase.from('allowance_items').update({ deleted_at: new Date().toISOString() }).in('id', realDeletedIds);
          if (error) throw error;
        }
      }

      const activeItems = drafts.filter(item => !deletedIds.includes(item.id));
      const upserts = activeItems.map(item => ({
        id: item.id.startsWith('ALW-') ? undefined : item.id,
        name: item.name,
        occurrence_type: item.occurrence_type,
        default_unit_price: item.default_unit_price,
        is_active: item.is_active ?? true,
      }));

      if (upserts.length > 0) {
        const { error } = await supabase.from('allowances').upsert(upserts);
        if (error) throw error;
      }

      await fetchAllowances();
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
    fetchAllowances,
    batchSaveAllowances
  };
}
