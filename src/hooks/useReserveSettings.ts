import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { ReserveSettingItem } from '../types';

export function useReserveSettings() {
  const [items, setItems] = useState<ReserveSettingItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReserveSettings = useCallback(async (officeId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('reserve_items')
        .select('*')
        .eq('is_deleted', false);

      if (officeId) {
        query = query.eq('office_id', officeId);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;

      const formatted: ReserveSettingItem[] = (data || []).map(d => ({
        id: d.id,
        reserveType: d.name || '',
        method: d.occurrence_type === 'monthly' ? '毎月定額積立' : '日次積立',
        calculationBase: `月額 ${Number(d.default_unit_price || 0).toLocaleString()}円`,
        targetAmount: Number(d.default_unit_price) || 0,
        autoExecution: true,
        description: d.name || '',
        office_id: d.office_id,
      }));
      setItems(formatted);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveReserveSettings = async (drafts: ReserveSettingItem[], deletedIds: string[], officeId?: string) => {
    try {
      setLoading(true);

      if (deletedIds.length > 0) {
        const realDeletedIds = deletedIds.filter(id => !id.startsWith('RSV-'));
        if (realDeletedIds.length > 0) {
          const { error } = await supabase
            .from('reserve_items')
            .update({ deleted_at: new Date().toISOString() })
            .in('id', realDeletedIds);
          if (error) throw error;
        }
      }

      const activeItems = drafts.filter(item => !deletedIds.includes(item.id));
      const upserts = activeItems.map(item => ({
        ...(item.id.startsWith('RSV-') ? {} : { id: item.id }),
        ...(officeId ? { office_id: officeId } : {}),
        name: item.reserveType,
        occurrence_type: 'monthly',
        default_unit_price: item.targetAmount || 0,
      }));

      if (upserts.length > 0) {
        const { error } = await supabase.from('reserve_items').upsert(upserts);
        if (error) throw error;
      }

      await fetchReserveSettings(officeId);
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
    fetchReserveSettings,
    batchSaveReserveSettings
  };
}
