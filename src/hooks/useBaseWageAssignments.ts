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

      // Fetch member wage evaluations
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('member_wage_evaluations')
        .select('*')
        .order('created_at', { ascending: false });

      if (evaluationsError) throw evaluationsError;

      // Map latest evaluation to each member
      const memberWageMap: Record<string, string> = {};
      (evaluationsData || []).forEach((ev: any) => {
        if (!memberWageMap[ev.member_id]) {
          memberWageMap[ev.member_id] = ev.wage_rate_id;
        }
      });

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
        baseWageId: memberWageMap[m.id] || undefined
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveAssignments = async (drafts: MemberItem[]) => {
    for (const d of drafts) {
      if (d.baseWageId) {
        const { data: existing } = await supabase
          .from('member_wage_evaluations')
          .select('id')
          .eq('member_id', d.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (existing && existing.length > 0) {
          const { error } = await supabase
            .from('member_wage_evaluations')
            .update({
              wage_rate_id: d.baseWageId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing[0].id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('member_wage_evaluations')
            .insert({
              member_id: d.id,
              wage_rate_id: d.baseWageId
            });

          if (error) throw error;
        }
      }
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
