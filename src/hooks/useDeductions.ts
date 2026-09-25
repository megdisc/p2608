import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { DeductionItem } from '../types';

export function useDeductions() {
  const [items, setItems] = useState<DeductionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDeductions = useCallback(async (officeId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('deductions')
        .select('*');

      if (officeId) {
        query = query.eq('office_id', officeId);
      }

      const { data, error } = await query.order('name', { ascending: true });
      
      if (error) throw error;
      
      const formatted: DeductionItem[] = (data || []).map(d => ({
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

  const batchSaveDeductions = async (drafts: DeductionItem[], deletedIds: string[], officeId?: string) => {
    try {
      setLoading(true);
      
      if (deletedIds.length > 0) {
        const realDeletedIds = deletedIds.filter(id => !id.startsWith('DED-'));
        if (realDeletedIds.length > 0) {
          const { error } = await supabase.from('allowance_deduction_items').update({ deleted_at: new Date().toISOString() }).in('id', realDeletedIds);
          if (error) throw error;
        }
      }

      const activeItems = drafts.filter(item => !deletedIds.includes(item.id));
      const upserts = activeItems.map(item => ({
        ...(item.id.startsWith('DED-') ? {} : { id: item.id }),
        ...(officeId ? { office_id: officeId } : {}),
        name: item.name,
        item_category: 'deduction',
        occurrence_type: item.occurrence_type,
        unit_price: item.default_unit_price,
      }));

      if (upserts.length > 0) {
        const { error } = await supabase.from('allowance_deduction_items').upsert(upserts);
        if (error) throw error;
      }

      await fetchDeductions(officeId);
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

