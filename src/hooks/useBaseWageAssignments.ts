import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { MemberItem, BaseWageItem } from '../types';

export function useBaseWageAssignments() {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [baseWages, setBaseWages] = useState<BaseWageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch members (role='利用者')
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .eq('is_deleted', false)
        .eq('role', '利用者')
        .order('yomigana', { ascending: true });

      if (membersError) throw membersError;

      // Fetch base wages
      const { data: wagesData, error: wagesError } = await supabase
        .from('base_wages')
        .select('*')
        .eq('is_deleted', false)
        .order('wage', { ascending: true });

      if (wagesError) throw wagesError;

      setBaseWages((wagesData || []).map(w => ({
        id: w.id,
        wage: w.wage,
        description: w.description || ''
      })));

      setItems((membersData || []).map(m => ({
        id: m.id,
        name: m.name,
        yomigana: m.yomigana || '',
        role: m.role,
        email: m.email || '',
        baseWageId: m.base_wage_id || undefined
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveAssignments = async (drafts: MemberItem[]) => {
    const { error } = await supabase
      .from('members')
      .upsert(drafts.map(d => ({
        id: d.id,
        name: d.name,
        yomigana: d.yomigana,
        role: d.role,
        email: d.email,
        base_wage_id: d.baseWageId || null,
        updated_at: new Date().toISOString()
      })));

    if (error) throw error;
    await fetchAssignments();
  };

  return {
    items,
    baseWages,
    loading,
    fetchAssignments,
    batchSaveAssignments
  };
}
