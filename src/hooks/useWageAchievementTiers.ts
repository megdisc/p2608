import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type WageAchievementTierItem = {
  id: string;
  service_type_name: string;
  code: string;
  name: string;
  tier_rank: number;
  min_wage: number;
  max_wage: number | null;
  display_order?: number;
  valid_from: string;
  valid_to: string | null;
};

const DEFAULT_WAGE_ACHIEVEMENT_TIERS: WageAchievementTierItem[] = [
  { id: 'wat-1', service_type_name: '就労継続支援B型', code: 'WAGE_TIER_1', name: '4万5千円以上', tier_rank: 1, min_wage: 45000, max_wage: null, display_order: 1, valid_from: '2024-04-01', valid_to: null },
  { id: 'wat-2', service_type_name: '就労継続支援B型', code: 'WAGE_TIER_2', name: '4万円以上4万5千円未満', tier_rank: 2, min_wage: 40000, max_wage: 44999, display_order: 2, valid_from: '2024-04-01', valid_to: null },
  { id: 'wat-3', service_type_name: '就労継続支援B型', code: 'WAGE_TIER_3', name: '3万5千円以上4万円未満', tier_rank: 3, min_wage: 35000, max_wage: 39999, display_order: 3, valid_from: '2024-04-01', valid_to: null },
  { id: 'wat-4', service_type_name: '就労継続支援B型', code: 'WAGE_TIER_4', name: '3万円以上3万5千円未満', tier_rank: 4, min_wage: 30000, max_wage: 34999, display_order: 4, valid_from: '2024-04-01', valid_to: null },
  { id: 'wat-5', service_type_name: '就労継続支援B型', code: 'WAGE_TIER_5', name: '2万5千円以上3万円未満', tier_rank: 5, min_wage: 25000, max_wage: 29999, display_order: 5, valid_from: '2024-04-01', valid_to: null },
  { id: 'wat-6', service_type_name: '就労継続支援B型', code: 'WAGE_TIER_6', name: '2万円以上2万5千円未満', tier_rank: 6, min_wage: 20000, max_wage: 24999, display_order: 6, valid_from: '2024-04-01', valid_to: null },
  { id: 'wat-7', service_type_name: '就労継続支援B型', code: 'WAGE_TIER_7', name: '1万5千円以上2万円未満', tier_rank: 7, min_wage: 15000, max_wage: 19999, display_order: 7, valid_from: '2024-04-01', valid_to: null },
  { id: 'wat-8', service_type_name: '就労継続支援B型', code: 'WAGE_TIER_8', name: '1万円以上1万5千円未満', tier_rank: 8, min_wage: 10000, max_wage: 14999, display_order: 8, valid_from: '2024-04-01', valid_to: null },
  { id: 'wat-9', service_type_name: '就労継続支援B型', code: 'WAGE_TIER_9', name: '1万円未満', tier_rank: 9, min_wage: 0, max_wage: 9999, display_order: 9, valid_from: '2024-04-01', valid_to: null },
];

export function useWageAchievementTiers() {
  const [items, setItems] = useState<WageAchievementTierItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWageAchievementTiers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wage_achievement_tiers')
        .select('*, service_types(name)')
        .order('code', { ascending: true });

      if (error || !data || data.length === 0) {
        setItems(DEFAULT_WAGE_ACHIEVEMENT_TIERS);
        return;
      }

      setItems((data as Array<{ id: string; code: string; name: string; tier_rank: number | string; min_wage: number | string; max_wage: number | string | null; display_order?: number | string; valid_from?: string; valid_to?: string | null; service_types?: { name?: string } }>).map((d) => ({
        id: d.id,
        service_type_name: d.service_types?.name || '就労継続支援B型',
        code: d.code,
        name: d.name,
        tier_rank: Number(d.tier_rank) || 0,
        min_wage: Number(d.min_wage) || 0,
        max_wage: d.max_wage !== null && d.max_wage !== undefined ? Number(d.max_wage) : null,
        display_order: d.display_order ? Number(d.display_order) : undefined,
        valid_from: d.valid_from || '2024-04-01',
        valid_to: d.valid_to || null,
      })));
    } catch (err) {
      console.warn('Error fetching wage achievement tiers, using fallback:', err);
      setItems(DEFAULT_WAGE_ACHIEVEMENT_TIERS);
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, loading, fetchWageAchievementTiers };
}
