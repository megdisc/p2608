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

      const validWageRateIds = new Set((wagesData || []).map((w: any) => w.id));

      // Map latest office-specific evaluation to each member
      const memberWageMap: Record<string, string> = {};
      (evaluationsData || []).forEach((ev: any) => {
        if (!memberWageMap[ev.member_id]) {
          if (!officeId || validWageRateIds.has(ev.wage_rate_id)) {
            memberWageMap[ev.member_id] = ev.wage_rate_id;
          }
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
    const officeId = currentOfficeIdRef.current;

    // Fetch valid wage_rate_ids for the target office
    let wageQuery = supabase
      .from('wage_rates')
      .select('id, office_id')
      .eq('is_deleted', false);
    if (officeId) {
      wageQuery = wageQuery.or(`office_id.eq.${officeId},office_id.is.null`);
    }
    const { data: currentOfficeWages } = await wageQuery;
    const officeWageIds = new Set((currentOfficeWages || []).map((w: any) => w.id));

    // Fetch existing member wage evaluations for the drafts
    const draftMemberIds = drafts.map(d => d.id);
    let existingEvals: any[] = [];
    if (draftMemberIds.length > 0) {
      const { data: evals } = await supabase
        .from('member_wage_evaluations')
        .select('id, member_id, wage_rate_id')
        .in('member_id', draftMemberIds)
        .order('created_at', { ascending: false });
      existingEvals = evals || [];
    }

    for (const d of drafts) {
      const existingForOffice = existingEvals.find((ev: any) =>
        ev.member_id === d.id && (!officeId || officeWageIds.has(ev.wage_rate_id))
      );

      if (d.baseWageId) {
        if (existingForOffice) {
          const { error } = await supabase
            .from('member_wage_evaluations')
            .update({
              wage_rate_id: d.baseWageId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingForOffice.id);

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
      } else {
        if (existingForOffice) {
          const { error } = await supabase
            .from('member_wage_evaluations')
            .delete()
            .eq('id', existingForOffice.id);

          if (error) throw error;
        }
      }
    }
    await fetchAssignments(officeId);
  };

  return {
    items,
    baseWages,
    loading,
    fetchAssignments,
    batchSaveAssignments
  };
}
