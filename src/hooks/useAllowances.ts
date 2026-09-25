import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { AllowanceItem } from '../types';

export function useAllowances() {
  const [items, setItems] = useState<AllowanceItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllowances = useCallback(async (officeId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('allowances')
        .select('*')
        .eq('is_deleted', false);

      if (officeId) {
        query = query.eq('office_id', officeId);
      }

      const { data, error } = await query.order('name', { ascending: true });
      
      if (error) throw error;
      
      const formatted: AllowanceItem[] = (data || []).map(d => ({
        id: d.id,
        name: d.name || '',
        occurrence_type: d.occurrence_type || 'daily',
        default_unit_price: Number(d.default_unit_price || d.unit_price || 0),
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

  const batchSaveAllowances = async (drafts: AllowanceItem[], deletedIds: string[], officeId?: string) => {
    try {
      setLoading(true);
      
      if (deletedIds.length > 0) {
        const realDeletedIds = deletedIds.filter(id => !id.startsWith('ALW-'));
        if (realDeletedIds.length > 0) {
          const { error } = await supabase.from('allowance_deduction_items').update({ deleted_at: new Date().toISOString() }).in('id', realDeletedIds);
          if (error) throw error;
        }
      }

      const activeItems = drafts.filter(item => !deletedIds.includes(item.id));
      const upserts = activeItems.map(item => ({
        ...(item.id.startsWith('ALW-') ? {} : { id: item.id }),
        ...(officeId ? { office_id: officeId } : {}),
        name: item.name,
        item_category: 'allowance',
        occurrence_type: item.occurrence_type,
        unit_price: item.default_unit_price,
      }));

      if (upserts.length > 0) {
        const { error } = await supabase.from('allowance_deduction_items').upsert(upserts);
        if (error) throw error;
      }

      await fetchAllowances(officeId);
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

