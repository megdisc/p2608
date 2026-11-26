import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { BaseRewardItemTableItem } from '../types';

export type BaseRewardItem = {
  id: string;
  service_type_id: string;
  service_code?: string;
  capacity_tier: string;
  staffing_ratio: string;
  wage_achievement_tier: string;
  base_units: number;
  valid_from: string;
  valid_to: string | null;
  service_type_name?: string;
};

const DEFAULT_BASE_REWARD_ITEMS: BaseRewardItem[] = [
  { id: 'br-01', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111111', capacity_tier: '20人以下', staffing_ratio: '7.5:1', wage_achievement_tier: '4万5千円以上', base_units: 584, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-02', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111112', capacity_tier: '20人以下', staffing_ratio: '7.5:1', wage_achievement_tier: '4万円以上4万5千円未満', base_units: 554, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-03', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111113', capacity_tier: '20人以下', staffing_ratio: '7.5:1', wage_achievement_tier: '3万5千円以上4万円未満', base_units: 531, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-04', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111114', capacity_tier: '20人以下', staffing_ratio: '7.5:1', wage_achievement_tier: '3万円以上3万5千円未満', base_units: 508, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-05', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111115', capacity_tier: '20人以下', staffing_ratio: '7.5:1', wage_achievement_tier: '2万5千円以上3万円未満', base_units: 485, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-06', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111116', capacity_tier: '20人以下', staffing_ratio: '7.5:1', wage_achievement_tier: '2万円以上2万5千円未満', base_units: 462, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-07', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111117', capacity_tier: '20人以下', staffing_ratio: '7.5:1', wage_achievement_tier: '1万5千円以上2万円未満', base_units: 439, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-08', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111118', capacity_tier: '20人以下', staffing_ratio: '7.5:1', wage_achievement_tier: '1万円以上1万5千円未満', base_units: 416, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-09', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111119', capacity_tier: '20人以下', staffing_ratio: '7.5:1', wage_achievement_tier: '1万円未満', base_units: 393, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-10', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111211', capacity_tier: '20人以下', staffing_ratio: '10:1', wage_achievement_tier: '4万5千円以上', base_units: 520, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-11', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111212', capacity_tier: '20人以下', staffing_ratio: '10:1', wage_achievement_tier: '4万円以上4万5千円未満', base_units: 490, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-12', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111213', capacity_tier: '20人以下', staffing_ratio: '10:1', wage_achievement_tier: '3万5千円以上4万円未満', base_units: 467, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-13', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111214', capacity_tier: '20人以下', staffing_ratio: '10:1', wage_achievement_tier: '3万円以上3万5千円未満', base_units: 444, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-14', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111215', capacity_tier: '20人以下', staffing_ratio: '10:1', wage_achievement_tier: '2万5千円以上3万円未満', base_units: 421, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-15', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111216', capacity_tier: '20人以下', staffing_ratio: '10:1', wage_achievement_tier: '2万円以上2万5千円未満', base_units: 398, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-16', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111217', capacity_tier: '20人以下', staffing_ratio: '10:1', wage_achievement_tier: '1万5千円以上2万円未満', base_units: 375, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-17', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111218', capacity_tier: '20人以下', staffing_ratio: '10:1', wage_achievement_tier: '1万円以上1万5千円未満', base_units: 352, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
  { id: 'br-18', service_type_id: '11111111-0000-0000-0000-000000000001', service_code: '111219', capacity_tier: '20人以下', staffing_ratio: '10:1', wage_achievement_tier: '1万円未満', base_units: 329, valid_from: '2024-04-01', valid_to: null, service_type_name: '就労継続支援B型' },
];

export function useBaseRewards() {
  const [items, setItems] = useState<BaseRewardItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBaseRewards = useCallback(async () => {
    try {
      setLoading(true);
      const [rewardRes, stRes] = await Promise.all([
        supabase.from('base_reward_items').select('*').order('service_code', { ascending: true }),
        supabase.from('service_types').select('id, name, code'),
      ]);

      if (rewardRes.error) {
        console.warn('base_reward_items fetch failed, using default items:', rewardRes.error);
        setItems(DEFAULT_BASE_REWARD_ITEMS);
        return;
      }

      const stMap = new Map<string, string>();
      if (stRes.data) {
        stRes.data.forEach((st: { id: string; name: string }) => stMap.set(st.id, st.name));
      }

      if (!rewardRes.data || rewardRes.data.length === 0) {
        setItems(DEFAULT_BASE_REWARD_ITEMS);
        return;
      }

      const formatted: BaseRewardItem[] = (rewardRes.data as BaseRewardItemTableItem[]).map((r) => ({
        id: r.id,
        service_type_id: r.service_type_id,
        service_code: r.service_code || '',
        capacity_tier: r.capacity_tier || '20人以下',
        staffing_ratio: r.staffing_ratio || '7.5:1',
        wage_achievement_tier: r.wage_achievement_tier || '4万5千円以上',
        base_units: Number(r.base_units) || 0,
        valid_from: r.valid_from || '2024-04-01',
        valid_to: r.valid_to || null,
        service_type_name: stMap.get(r.service_type_id) || '就労継続支援B型',
      }));

      setItems(formatted);
    } catch (err) {
      console.error('Error in fetchBaseRewards:', err);
      setItems(DEFAULT_BASE_REWARD_ITEMS);
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveBaseRewards = async (drafts: BaseRewardItem[], deletedIds: string[]) => {
    try {
      if (deletedIds.length > 0) {
        const realDeletedIds = deletedIds.filter(id => !id.startsWith('NEW-') && !id.startsWith('br-'));
        if (realDeletedIds.length > 0) {
          const { error } = await supabase.from('base_reward_items').delete().in('id', realDeletedIds);
          if (error) console.error('Delete error:', error);
        }
      }

      const activeItems = drafts.filter(i => !deletedIds.includes(i.id));
      for (const item of activeItems) {
        const idVal = (item.id.startsWith('NEW-') || item.id.startsWith('br-')) ? undefined : item.id;
        const rowData: Partial<BaseRewardItemTableItem> = {
          service_type_id: item.service_type_id,
          service_code: item.service_code,
          capacity_tier: item.capacity_tier,
          staffing_ratio: item.staffing_ratio,
          wage_achievement_tier: item.wage_achievement_tier,
          base_units: Number(item.base_units),
          valid_from: item.valid_from,
          valid_to: item.valid_to || null,
        };
        if (idVal) rowData.id = idVal;

        const { error } = await supabase.from('base_reward_items').upsert(rowData);
        if (error) console.error('Upsert error:', error);
      }

      await fetchBaseRewards();
    } catch (err) {
      console.error('Error saving base rewards:', err);
      throw err;
    }
  };

  return {
    items,
    loading,
    fetchBaseRewards,
    batchSaveBaseRewards,
  };
}
