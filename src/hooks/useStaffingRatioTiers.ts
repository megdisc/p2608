import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type StaffingRatioTierItem = {
  id: string;
  service_type_name: string;
  code: string;
  name: string;
  ratio_value: number;
  display_order?: number;
  valid_from: string;
  valid_to: string | null;
};

const DEFAULT_STAFFING_RATIO_TIERS: StaffingRatioTierItem[] = [
  { id: 'srt-1', service_type_name: '就労継続支援B型', code: 'RATIO_7_5_1', name: '7.5:1配置', ratio_value: 7.5, display_order: 1, valid_from: '2024-04-01', valid_to: null },
  { id: 'srt-2', service_type_name: '就労継続支援B型', code: 'RATIO_10_1', name: '10:1配置', ratio_value: 10.0, display_order: 2, valid_from: '2024-04-01', valid_to: null },
  { id: 'srt-3', service_type_name: '就労継続支援B型', code: 'RATIO_6_1', name: '6:1配置', ratio_value: 6.0, display_order: 3, valid_from: '2024-04-01', valid_to: null },
];

export function useStaffingRatioTiers() {
  const [items, setItems] = useState<StaffingRatioTierItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStaffingRatioTiers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staffing_ratio_tiers')
        .select('*, service_types(name)')
        .order('code', { ascending: true });

      if (error || !data || data.length === 0) {
        setItems(DEFAULT_STAFFING_RATIO_TIERS);
        return;
      }

      setItems((data as Array<{ id: string; code: string; name: string; ratio_value: number | string; display_order?: number | string; valid_from?: string; valid_to?: string | null; service_types?: { name?: string } }>).map((d) => ({
        id: d.id,
        service_type_name: d.service_types?.name || '就労継続支援B型',
        code: d.code,
        name: d.name,
        ratio_value: Number(d.ratio_value) || 0,
        display_order: d.display_order ? Number(d.display_order) : undefined,
        valid_from: d.valid_from || '2024-04-01',
        valid_to: d.valid_to || null,
      })));
    } catch (err) {
      console.warn('Error fetching staffing ratio tiers, using fallback:', err);
      setItems(DEFAULT_STAFFING_RATIO_TIERS);
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, loading, fetchStaffingRatioTiers };
}
