import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type RegionalGradeLocationItem = {
  id: string;
  prefecture: string;
  city: string;
  grade: string;
  valid_from: string;
  valid_to: string | null;
};

const DEFAULT_REGIONAL_GRADE_LOCATIONS: RegionalGradeLocationItem[] = [
  { id: 'rgl-01', prefecture: '広島県', city: '広島市', grade: '4級地', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-02', prefecture: '広島県', city: '呉市', grade: '5級地', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-03', prefecture: '広島県', city: '竹原市', grade: 'その他', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-04', prefecture: '広島県', city: '三原市', grade: '6級地', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-05', prefecture: '広島県', city: '尾道市', grade: '6級地', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-06', prefecture: '広島県', city: '福山市', grade: '5級地', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-07', prefecture: '広島県', city: '府中市', grade: 'その他', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-08', prefecture: '広島県', city: '三次市', grade: 'その他', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-09', prefecture: '広島県', city: '庄原市', grade: 'その他', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-10', prefecture: '広島県', city: '大竹市', grade: '5級地', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-11', prefecture: '広島県', city: '東広島市', grade: '5級地', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-12', prefecture: '広島県', city: '廿日市市', grade: '5級地', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-13', prefecture: '広島県', city: '安芸高田市', grade: 'その他', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-14', prefecture: '広島県', city: '江田島市', grade: 'その他', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-15', prefecture: '広島県', city: '安芸郡府中町', grade: '5級地', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-16', prefecture: '広島県', city: '安芸郡海田町', grade: '5級地', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-17', prefecture: '広島県', city: '安芸郡熊野町', grade: '6級地', valid_from: '2024-04-01', valid_to: null },
  { id: 'rgl-18', prefecture: '広島県', city: '安芸郡坂町', grade: '5級地', valid_from: '2024-04-01', valid_to: null },
];

export function useRegionalGradeLocations() {
  const [items, setItems] = useState<RegionalGradeLocationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      // まず regional_grade_locations から取得を試みる
      let { data, error } = await supabase
        .from('regional_grade_locations')
        .select('*')
        .order('prefecture', { ascending: true })
        .order('city', { ascending: true });

      // なければ既存の regional_grades テーブルからフォールバック
      if (error || !data || data.length === 0) {
        const fallbackRes = await supabase
          .from('regional_grades')
          .select('*')
          .eq('is_deleted', false)
          .order('prefecture', { ascending: true })
          .order('city', { ascending: true });
        if (!fallbackRes.error && fallbackRes.data && fallbackRes.data.length > 0) {
          data = fallbackRes.data;
          error = null;
        }
      }

      if (error || !data || data.length === 0) {
        setItems(DEFAULT_REGIONAL_GRADE_LOCATIONS);
        return;
      }

      setItems((data as Array<{ id: string; prefecture: string; city: string; grade: string; valid_from?: string; valid_to?: string | null }>).map((d) => ({
        id: d.id,
        prefecture: d.prefecture,
        city: d.city,
        grade: d.grade,
        valid_from: d.valid_from || '2024-04-01',
        valid_to: d.valid_to || null,
      })));
    } catch (err) {
      console.warn('Error fetching regional grade locations, using fallback:', err);
      setItems(DEFAULT_REGIONAL_GRADE_LOCATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, loading, fetchLocations };
}
