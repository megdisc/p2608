import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib';
import type { MemberItem, BaseWageItem } from '../types';
import { WORDS_PERSON } from '../constants';

export function useBaseWageAssignments() {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [baseWages, setBaseWages] = useState<BaseWageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const currentOfficeIdRef = useRef<string | undefined>(undefined);

  const fetchAssignments = useCallback(async (officeId?: string) => {
    currentOfficeIdRef.current = officeId;
    try {
      setLoading(true);
      // Fetch base wages
      let wageQuery = supabase
        .from('wage_rates')
        .select('*')
        .eq('is_deleted', false);
      if (officeId) {
        wageQuery = wageQuery.or(`office_id.eq.${officeId},office_id.is.null`);
      }
      const { data: wagesData, error: wagesError } = await wageQuery.order('wage', { ascending: true });

      if (wagesError) throw wagesError;

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*, users(email, role)')
        .eq('is_deleted', false)
        .order('yomigana', { ascending: true });

      if (membersError) throw membersError;

      // Filter members for target office
      let memberIdsForOffice: Set<string> | null = null;
      if (officeId) {
        memberIdsForOffice = new Set<string>();
        const [settingsRes, certRes] = await Promise.all([
          supabase.from('office_member_settings').select('member_id').eq('office_id', officeId),
          supabase.from('member_recipient_certificates').select('member_id').eq('copayment_office_id', officeId).or('is_deleted.eq.false,is_deleted.is.null')
        ]);
        (settingsRes.data || []).forEach(s => memberIdsForOffice!.add(s.member_id));
        (certRes.data || []).forEach(c => memberIdsForOffice!.add(c.member_id));
      }

      const targetMembers = (membersData || []).filter((m: any) => {
        if (!memberIdsForOffice) return true;
        return memberIdsForOffice.has(m.id);
      });

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

      setBaseWages((wagesData || []).map((w: any) => ({
        id: w.id,
        wage: w.wage,
        description: w.description || ''
      })));

      setItems(targetMembers.map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        code: m.code || '',
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
    await fetchAssignments(currentOfficeIdRef.current);
  };

  return {
    items,
    baseWages,
    loading,
    fetchAssignments,
    batchSaveAssignments
  };
}
