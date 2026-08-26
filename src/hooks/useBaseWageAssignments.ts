import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { MemberItem, BaseWageItem } from '../types';
import { WORDS_PERSON } from '../constants';

export function useBaseWageAssignments() {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [baseWages, setBaseWages] = useState<BaseWageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*, users(email, role)')
        .eq('is_deleted', false)
        .order('yomigana', { ascending: true });

      if (membersError) throw membersError;

      // Fetch base wages
      const { data: wagesData, error: wagesError } = await supabase
        .from('wage_rates')
        .select('*')
        .eq('is_deleted', false)
        .order('wage', { ascending: true });

      if (wagesError) throw wagesError;

      setBaseWages((wagesData || []).map(w => ({
        id: w.id,
        wage: w.wage,
        description: w.description || ''
      })));

      setItems((membersData || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        name: m.name,
        yomigana: m.yomigana || '',
        role: m.users?.role === 'Member' ? WORDS_PERSON.ROLE_MEMBER : m.users?.role || WORDS_PERSON.ROLE_MEMBER,
        email: m.users?.email || '',
        baseWageId: m.wage_rate_id || undefined
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveAssignments = async (drafts: MemberItem[]) => {
    for (const d of drafts) {
      const { error } = await supabase
        .from('members')
        .update({
          wage_rate_id: d.baseWageId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', d.id);

      if (error) throw error;
    }
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
