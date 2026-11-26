import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type RegionalGradeRateItem = {
  id: string;
  grade: string;
  premium_rate: number;
  display_order: number;
  valid_from: string;
  valid_to: string | null;
};

const DEFAULT_REGIONAL_GRADE_RATES: RegionalGradeRateItem[] = [
  { id: 'rgr-1', grade: '1級地', premium_rate: 0.2000, display_order: 1, valid_from: '2024-04-01', valid_to: null },
  { id: 'rgr-2', grade: '2級地', premium_rate: 0.1600, display_order: 2, valid_from: '2024-04-01', valid_to: null },
  { id: 'rgr-3', grade: '3級地', premium_rate: 0.1500, display_order: 3, valid_from: '2024-04-01', valid_to: null },
  { id: 'rgr-4', grade: '4級地', premium_rate: 0.1200, display_order: 4, valid_from: '2024-04-01', valid_to: null },
  { id: 'rgr-5', grade: '5級地', premium_rate: 0.1000, display_order: 5, valid_from: '2024-04-01', valid_to: null },
  { id: 'rgr-6', grade: '6級地', premium_rate: 0.0600, display_order: 6, valid_from: '2024-04-01', valid_to: null },
  { id: 'rgr-7', grade: '7級地', premium_rate: 0.0300, display_order: 7, valid_from: '2024-04-01', valid_to: null },
  { id: 'rgr-8', grade: 'その他', premium_rate: 0.0000, display_order: 8, valid_from: '2024-04-01', valid_to: null },
];

export function useRegionalGradeRates() {
  const [items, setItems] = useState<RegionalGradeRateItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('regional_grade_rates')
        .select('*')
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        setItems(DEFAULT_REGIONAL_GRADE_RATES);
        return;
      }
      setItems((data as Array<{ id: string; grade: string; premium_rate: number | string; display_order: number | string; valid_from: string; valid_to: string | null }>).map((d) => ({
        id: d.id,
        grade: d.grade,
        premium_rate: Number(d.premium_rate) || 0,
        display_order: Number(d.display_order) || 0,
        valid_from: d.valid_from || '2024-04-01',
        valid_to: d.valid_to || null,
      })));
    } catch (err) {
      console.warn('Error fetching regional grade rates, using fallback:', err);
      setItems(DEFAULT_REGIONAL_GRADE_RATES);
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, loading, fetchRates };
}
