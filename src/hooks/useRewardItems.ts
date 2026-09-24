import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type RewardItem = {
  id: string;
  service_type_id: string;
  service_type_name?: string;
  code: string;
  name: string;
  item_category: 'addition' | 'subtraction';
  occurrence_type: 'daily' | 'monthly';
  unit_value: number;
  calc_rate: number;
  monthly_limit_count: number | null;
  is_active: boolean;
};

export function useRewardItems() {
  const [items, setItems] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRewardItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reward_items')
        .select('*, service_types(name)')
        .eq('is_deleted', false)
        .order('code', { ascending: true });

      if (error) throw error;

      const formatted: RewardItem[] = (data || []).map((ri: any) => ({
        id: ri.id,
        service_type_id: ri.service_type_id || '',
        service_type_name: ri.service_types?.name || '就労継続支援B型',
        code: ri.code || '',
        name: ri.name || '',
        item_category: (ri.item_category === 'subtraction' || ri.item_category === 'reward_subtraction') ? 'subtraction' : 'addition',
        occurrence_type: ri.occurrence_type || 'daily',
        unit_value: ri.unit_value ?? 0,
        calc_rate: ri.calc_rate ?? 0,
        monthly_limit_count: ri.monthly_limit_count ?? null,
        is_active: ri.is_active ?? true
      }));

      setItems(formatted);
    } catch (err) {
      console.error('Error fetching reward items:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveRewardItems = async (drafts: RewardItem[], deletedIds: string[]) => {
    try {
      if (deletedIds.length > 0) {
        const { error } = await supabase
          .from('reward_items')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', deletedIds);
        if (error) throw error;
      }

      const activeItems = drafts.filter(i => !deletedIds.includes(i.id));
      for (const item of activeItems) {
        const upsertData: any = {
          service_type_id: item.service_type_id || '11111111-0000-0000-0000-000000000001',
          code: item.code.trim(),
          name: item.name,
          item_category: item.item_category || 'addition',
          occurrence_type: item.occurrence_type || 'daily',
          unit_value: Number(item.unit_value) || 0,
          calc_rate: Number(item.calc_rate) || 0,
          monthly_limit_count: item.monthly_limit_count ? Number(item.monthly_limit_count) : null,
          is_active: item.is_active ?? true,
        };
        if (!item.id.startsWith('REW-')) {
          upsertData.id = item.id;
        }

        const { error } = await supabase.from('reward_items').upsert(upsertData);
        if (error) throw error;
      }

      await fetchRewardItems();
    } catch (err) {
      console.error('Error saving reward items:', err);
      throw err;
    }
  };

  return {
    items,
    loading,
    fetchRewardItems,
    batchSaveRewardItems
  };
}
