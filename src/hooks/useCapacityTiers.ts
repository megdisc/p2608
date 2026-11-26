import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type CapacityTierItem = {
  id: string;
  service_type_name: string;
  code: string;
  name: string;
  min_capacity: number;
  max_capacity: number | null;
  display_order: number;
  valid_from: string;
  valid_to: string | null;
};

const DEFAULT_CAPACITY_TIERS: CapacityTierItem[] = [
  { id: 'cap-1', service_type_name: '就労継続支援B型', code: 'CAP_20', name: '20人以下', min_capacity: 1, max_capacity: 20, display_order: 1, valid_from: '2024-04-01', valid_to: null },
  { id: 'cap-2', service_type_name: '就労継続支援B型', code: 'CAP_21_40', name: '21人以上40人以下', min_capacity: 21, max_capacity: 40, display_order: 2, valid_from: '2024-04-01', valid_to: null },
  { id: 'cap-3', service_type_name: '就労継続支援B型', code: 'CAP_41_60', name: '41人以上60人以下', min_capacity: 41, max_capacity: 60, display_order: 3, valid_from: '2024-04-01', valid_to: null },
  { id: 'cap-4', service_type_name: '就労継続支援B型', code: 'CAP_61_80', name: '61人以上80人以下', min_capacity: 61, max_capacity: 80, display_order: 4, valid_from: '2024-04-01', valid_to: null },
  { id: 'cap-5', service_type_name: '就労継続支援B型', code: 'CAP_81_PLUS', name: '81人以上', min_capacity: 81, max_capacity: null, display_order: 5, valid_from: '2024-04-01', valid_to: null },
];

export function useCapacityTiers() {
  const [items, setItems] = useState<CapacityTierItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCapacityTiers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('capacity_tiers')
        .select('*, service_types(name)')
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        setItems(DEFAULT_CAPACITY_TIERS);
        return;
      }

      setItems((data as Array<{ id: string; code: string; name: string; min_capacity: number | string; max_capacity: number | string | null; display_order: number | string; valid_from?: string; valid_to?: string | null; service_types?: { name?: string } }>).map((d) => ({
        id: d.id,
        service_type_name: d.service_types?.name || '就労継続支援B型',
        code: d.code,
        name: d.name,
        min_capacity: Number(d.min_capacity) || 0,
        max_capacity: d.max_capacity !== null && d.max_capacity !== undefined ? Number(d.max_capacity) : null,
        display_order: Number(d.display_order) || 0,
        valid_from: d.valid_from || '2024-04-01',
        valid_to: d.valid_to || null,
      })));
    } catch (err) {
      console.warn('Error fetching capacity tiers, using fallback:', err);
      setItems(DEFAULT_CAPACITY_TIERS);
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, loading, fetchCapacityTiers };
}
