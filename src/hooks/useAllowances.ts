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
        office_id: d.office_id,
        name: d.name || '',
        occurrence_type: d.occurrence_type || 'daily',
        calc_trigger_basis: d.calc_trigger_basis || 'manual',
        threshold_value: d.threshold_value !== null && d.threshold_value !== undefined ? Number(d.threshold_value) : null,
        threshold_unit: d.threshold_unit || '',
        threshold_operator: d.threshold_operator || '',
        is_auto_applied: Boolean(d.is_auto_applied),
        unit_price: Number(d.unit_price ?? d.default_unit_price ?? 0),
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
        calc_trigger_basis: item.calc_trigger_basis || 'manual',
        threshold_value: item.threshold_value === null || item.threshold_value === undefined || (item.threshold_value as any) === '' ? null : Number(item.threshold_value),
        threshold_unit: item.threshold_unit || null,
        threshold_operator: item.threshold_operator || null,
        is_auto_applied: Boolean(item.is_auto_applied),
        unit_price: Number(item.unit_price || 0),
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

