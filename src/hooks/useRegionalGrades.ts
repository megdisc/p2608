import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { RegionalGradeTableItem } from '../types/db';

export function useRegionalGrades() {
  const [items, setItems] = useState<RegionalGradeTableItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRegionalGrades = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('regional_grades')
        .select('*')
        .eq('is_deleted', false)
        .order('prefecture', { ascending: true })
        .order('city', { ascending: true });

      if (error) throw error;
      setItems((data as RegionalGradeTableItem[]) || []);
    } catch (err) {
      console.error('Error fetching regional grades:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    items,
    loading,
    fetchRegionalGrades,
  };
}
