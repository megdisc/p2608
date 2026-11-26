import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type BaseRewardAllocationItem = {
  id: string;
  service_type_name: string;
  capacity_tier_name: string;
  staffing_ratio_tier_name: string;
  wage_achievement_tier_name: string;
  base_units: number;
  valid_from: string;
  valid_to: string | null;
};

const DEFAULT_ALLOCATIONS: BaseRewardAllocationItem[] = [
  { id: 'bra-01', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '7.5:1配置', wage_achievement_tier_name: '4万5千円以上', base_units: 584, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-02', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '7.5:1配置', wage_achievement_tier_name: '4万円以上4万5千円未満', base_units: 554, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-03', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '7.5:1配置', wage_achievement_tier_name: '3万5千円以上4万円未満', base_units: 531, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-04', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '7.5:1配置', wage_achievement_tier_name: '3万円以上3万5千円未満', base_units: 508, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-05', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '7.5:1配置', wage_achievement_tier_name: '2万5千円以上3万円未満', base_units: 485, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-06', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '7.5:1配置', wage_achievement_tier_name: '2万円以上2万5千円未満', base_units: 462, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-07', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '7.5:1配置', wage_achievement_tier_name: '1万5千円以上2万円未満', base_units: 439, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-08', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '7.5:1配置', wage_achievement_tier_name: '1万円以上1万5千円未満', base_units: 416, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-09', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '7.5:1配置', wage_achievement_tier_name: '1万円未満', base_units: 393, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-10', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '10:1配置', wage_achievement_tier_name: '4万5千円以上', base_units: 520, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-11', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '10:1配置', wage_achievement_tier_name: '4万円以上4万5千円未満', base_units: 490, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-12', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '10:1配置', wage_achievement_tier_name: '3万5千円以上4万円未満', base_units: 467, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-13', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '10:1配置', wage_achievement_tier_name: '3万円以上3万5千円未満', base_units: 444, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-14', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '10:1配置', wage_achievement_tier_name: '2万5千円以上3万円未満', base_units: 421, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-15', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '10:1配置', wage_achievement_tier_name: '2万円以上2万5千円未満', base_units: 398, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-16', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '10:1配置', wage_achievement_tier_name: '1万5千円以上2万円未満', base_units: 375, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-17', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '10:1配置', wage_achievement_tier_name: '1万円以上1万5千円未満', base_units: 352, valid_from: '2024-04-01', valid_to: null },
  { id: 'bra-18', service_type_name: '就労継続支援B型', capacity_tier_name: '20人以下', staffing_ratio_tier_name: '10:1配置', wage_achievement_tier_name: '1万円未満', base_units: 329, valid_from: '2024-04-01', valid_to: null },
];

export function useBaseRewardAllocations() {
  const [items, setItems] = useState<BaseRewardAllocationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllocations = useCallback(async () => {
    try {
      setLoading(true);
      // base_reward_allocations からの取得を試みる
      const { data, error } = await supabase
        .from('base_reward_allocations')
        .select(`
          id,
          base_units,
          valid_from,
          valid_to,
          service_types(name),
          capacity_tiers(name),
          staffing_ratio_tiers(name),
          wage_achievement_tiers(name)
        `)
        .order('base_units', { ascending: false });

      if (error || !data || data.length === 0) {
        // base_reward_items からフォールバックを試みる
        const fallbackRes = await supabase.from('base_reward_items').select('*').order('base_units', { ascending: false });
        if (!fallbackRes.error && fallbackRes.data && fallbackRes.data.length > 0) {
          setItems((fallbackRes.data as Array<{ id: string; capacity_tier?: string; staffing_ratio?: string; wage_achievement_tier?: string; base_units: number | string; valid_from?: string; valid_to?: string | null }>).map((d) => ({
            id: d.id,
            service_type_name: '就労継続支援B型',
            capacity_tier_name: d.capacity_tier || '20人以下',
            staffing_ratio_tier_name: d.staffing_ratio || '7.5:1',
            wage_achievement_tier_name: d.wage_achievement_tier || '4万5千円以上',
            base_units: Number(d.base_units) || 0,
            valid_from: d.valid_from || '2024-04-01',
            valid_to: d.valid_to || null,
          })));
          return;
        }
        setItems(DEFAULT_ALLOCATIONS);
        return;
      }

      setItems((data as Array<{
        id: string;
        base_units: number | string;
        valid_from?: string;
        valid_to?: string | null;
        service_types?: { name?: string };
        capacity_tiers?: { name?: string };
        staffing_ratio_tiers?: { name?: string };
        wage_achievement_tiers?: { name?: string };
      }>).map((d) => ({
        id: d.id,
        service_type_name: d.service_types?.name || '就労継続支援B型',
        capacity_tier_name: d.capacity_tiers?.name || '-',
        staffing_ratio_tier_name: d.staffing_ratio_tiers?.name || '-',
        wage_achievement_tier_name: d.wage_achievement_tiers?.name || '-',
        base_units: Number(d.base_units) || 0,
        valid_from: d.valid_from || '2024-04-01',
        valid_to: d.valid_to || null,
      })));
    } catch (err) {
      console.warn('Error fetching base reward allocations, using fallback:', err);
      setItems(DEFAULT_ALLOCATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, loading, fetchAllocations };
}
