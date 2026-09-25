import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { ReserveSettingItem } from '../types';
import { WORDS_PROJECT } from '../constants';

const FIXED_RESERVE_TYPES = [
  WORDS_PROJECT.SUBJECT_RESERVE_WAGE,
  WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT,
];

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

      const formatted: ReserveSettingItem[] = FIXED_RESERVE_TYPES.map(reserveTypeName => {
        const existing = (data || []).find(d => d.name === reserveTypeName);
        if (existing) {
          return {
            id: existing.id,
            reserveType: reserveTypeName,
            calcType: existing.calc_type === 'fixed_rate' ? 'fixed_rate' : 'fixed_amount',
            fixedAmount: Number(existing.fixed_amount || existing.default_unit_price || 0),
            fixedRate: Number(existing.fixed_rate || 0),
            description: reserveTypeName,
            office_id: existing.office_id,
          };
        }
        return {
          id: `RSV-${reserveTypeName}-${officeId || 'default'}`,
          reserveType: reserveTypeName,
          calcType: 'fixed_amount',
          fixedAmount: 0,
          fixedRate: 0,
          description: reserveTypeName,
          office_id: officeId,
        };
      });

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
        calc_type: item.calcType,
        fixed_amount: Number(item.fixedAmount || 0),
        fixed_rate: Number(item.fixedRate || 0),
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
