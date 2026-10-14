import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib';
import type { BaseWageItem, MemberWageAssignmentGridRow, MemberWageSettingItem } from '../types';
import { getPreviousMonth } from '../utils';

export function useBaseWageAssignments() {
  const [items, setItems] = useState<MemberWageAssignmentGridRow[]>([]);
  const [baseWages, setBaseWages] = useState<BaseWageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const currentOfficeIdRef = useRef<string | undefined>(undefined);

  const fetchAssignments = useCallback(async (officeId?: string) => {
    currentOfficeIdRef.current = officeId;
    try {
      setLoading(true);

      // Fetch base wages (filtered by selected office)
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
        .select('*')
        .or('is_deleted.eq.false,is_deleted.is.null')
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

      // Fetch member wage settings history
      let settingsData: any[] = [];
      const { data: sData, error: settingsError } = await supabase
        .from('member_wage_settings')
        .select('*')
        .or('is_deleted.eq.false,is_deleted.is.null')
        .order('start_period', { ascending: false });

      if (settingsError) {
        console.warn('Could not fetch from member_wage_settings, falling back to member_wage_evaluations:', settingsError);
        const { data: fallbackData } = await supabase
          .from('member_wage_evaluations')
          .select('*');
        settingsData = fallbackData || [];
      } else {
        settingsData = sData || [];
      }

      const formatted: MemberWageAssignmentGridRow[] = targetMembers.map((m: any) => {
        const memberWageSettings: MemberWageSettingItem[] = settingsData
          .filter((s: any) => s.member_id === m.id && !s.is_deleted)
          .map((s: any) => ({
            id: s.id,
            memberId: s.member_id,
            wageRateId: s.wage_rate_id,
            startPeriod: s.start_period || '',
            endPeriod: s.end_period || '',
            remarks: s.remarks || '',
          }));

        return {
          id: m.id,
          code: m.code || '',
          name: m.name || '',
          yomigana: m.yomigana || '',
          wageSettings: memberWageSettings,
        };
      });

      setBaseWages((wagesData || []).map((w: any) => ({
        id: w.id,
        wage: Number(w.wage),
        description: w.description || '',
      })));

      setItems(formatted);
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveAssignments = async (drafts: MemberWageAssignmentGridRow[], deletedIds: string[]) => {
    const officeId = currentOfficeIdRef.current;
    try {
      const nowIso = new Date().toISOString();

      // Handle deletions (logical deletion)
      if (deletedIds.length > 0) {
        const idsToDelete = deletedIds.filter(id => !id.startsWith('WAG-') && id.includes('-'));
        if (idsToDelete.length > 0) {
          const { error: delError } = await supabase
            .from('member_wage_settings')
            .update({ deleted_at: nowIso, updated_at: nowIso })
            .in('id', idsToDelete);
          if (delError) throw delError;
        }
      }

      // Handle upserts
      for (const draft of drafts) {
        const memberId = draft.id;
        if (!draft.wageSettings || draft.wageSettings.length === 0) continue;

        // Filter valid settings not marked for deletion
        const activeSettings = draft.wageSettings
          .filter(setting => !deletedIds.includes(setting.id) && !!setting.wageRateId);

        // Sort ascending by startPeriod (oldest to newest) to calculate end_period
        const sortedActive = [...activeSettings].sort((a, b) => {
          const aP = a.startPeriod || '9999-99';
          const bP = b.startPeriod || '9999-99';
          return aP.localeCompare(bP);
        });

        // Compute end_period for each active setting
        const computedEndPeriods = new Map<string, string | null>();
        for (let i = 0; i < sortedActive.length; i++) {
          const curr = sortedActive[i];
          const isLatest = i === sortedActive.length - 1;
          if (isLatest) {
            computedEndPeriods.set(curr.id, null);
          } else {
            const next = sortedActive[i + 1];
            computedEndPeriods.set(curr.id, next.startPeriod ? getPreviousMonth(next.startPeriod) : null);
          }
        }

        for (const setting of activeSettings) {
          const endPeriod = computedEndPeriods.get(setting.id) ?? (setting.endPeriod || null);

          const upsertData: any = {
            member_id: memberId,
            wage_rate_id: setting.wageRateId,
            start_period: setting.startPeriod || nowIso.substring(0, 7),
            end_period: endPeriod,
            remarks: setting.remarks || null,
            updated_at: nowIso,
          };

          if (!setting.id.startsWith('WAG-')) {
            upsertData.id = setting.id;
          }

          const { error: upsertErr } = await supabase
            .from('member_wage_settings')
            .upsert(upsertData);

          if (upsertErr) throw upsertErr;
        }
      }

      await fetchAssignments(officeId);
    } catch (err) {
      console.error('batchSaveAssignments failed:', err);
      throw err;
    }
  };

  return {
    items,
    baseWages,
    loading,
    fetchAssignments,
    batchSaveAssignments,
  };
}
