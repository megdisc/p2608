import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { FinancialRecordItem } from '../types';
import { getCurrentJSTDateOnly } from '../utils';
import { WORDS_PROJECT } from '../constants';

export type UseFinancialRecordsOptions = {
  initialSort?: { key: string; direction: 'asc' | 'desc' };
  type?: string;
  subjects?: string[];
  officeId?: string;
  disableYearFilter?: boolean;
  onlyUnassignedReserves?: boolean;
};

type RawDbRecord = {
  id: string;
  target_period: string;
  type: string;
  subject: string;
  amount: number;
  remarks?: string | null;
  activity_category?: string | null;
  cost_category?: string | null;
  office_id?: string | null;
  project_id?: string | null;
  client_id?: string | null;
  recorded_by?: string | null;
};

export function useFinancialRecords(options: UseFinancialRecordsOptions = {}) {
  const initialSort = options.initialSort || { key: 'targetPeriod', direction: 'desc' };
  const [items, setItems] = useState<FinancialRecordItem[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [staffs, setStaffs] = useState<{ id: string; name: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [totals, setTotals] = useState<Record<string, number>>({
    material: 0,
    other: 0,
    equipmentReserve: 0,
    total: 0
  });

  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>(initialSort);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear().toString());

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);

      // 1. 確定状況の確認（月次財務確定）
      let closingsQuery = supabase
        .from('monthly_financial_closings')
        .select('target_period, is_confirmed')
        .eq('is_confirmed', true);
      if (options.officeId) {
        closingsQuery = closingsQuery.eq('office_id', options.officeId);
      }

      // 2. 実績レコードクエリ（月次実績層）
      let recQuery = supabase.from('general_financial_records').select(`
          id, target_period, type, subject, amount, remarks, activity_category, cost_category, office_id,
          project_id, client_id, recorded_by
        `);
      if (options.officeId) {
        recQuery = recQuery.or(`office_id.eq.${options.officeId},office_id.is.null`);
      }
      if (currentYear && !options.disableYearFilter) {
        recQuery = recQuery.gte('target_period', `${currentYear}-01-01`).lte('target_period', `${currentYear}-12-31`);
      }
      if (options.type) {
        recQuery = recQuery.eq('type', options.type);
      }
      if (options.subjects && options.subjects.length > 0) {
        recQuery = recQuery.in('subject', options.subjects);
      }

      // 3. 確定スナップショットクエリ（スナップショット層）
      let snapQuery = supabase.from('general_financial_snapshot_details').select(`
          id, target_period, type, subject, amount, remarks, activity_category, cost_category, office_id,
          project_id, client_id, recorded_by
        `);
      if (options.officeId) {
        snapQuery = snapQuery.or(`office_id.eq.${options.officeId},office_id.is.null`);
      }
      if (currentYear && !options.disableYearFilter) {
        snapQuery = snapQuery.gte('target_period', `${currentYear}-01-01`).lte('target_period', `${currentYear}-12-31`);
      }
      if (options.type) {
        snapQuery = snapQuery.eq('type', options.type);
      }
      if (options.subjects && options.subjects.length > 0) {
        snapQuery = snapQuery.in('subject', options.subjects);
      }

      let projQuery = supabase.from('projects').select('id, name, code, is_deleted, office_id').order('code', { ascending: true });
      if (options.officeId) {
        projQuery = projQuery.or(`office_id.eq.${options.officeId},office_id.is.null`);
      }

      const [
        { data: closingsData },
        { data: recData, error: recError },
        { data: snapData, error: snapError },
        { data: projData, error: projError },
        { data: staffData, error: staffError },
        { data: clientData, error: clientError },
      ] = await Promise.all([
        closingsQuery,
        recQuery,
        snapQuery,
        projQuery,
        supabase.from('staffs').select('id, name, yomigana, is_deleted').order('yomigana', { ascending: true }),
        supabase.from('partners').select('id, name, yomigana, is_deleted').order('yomigana', { ascending: true })
      ]);

      if (recError && snapError) throw recError || snapError;
      if (projError) throw projError;
      if (staffError) throw staffError;
      if (clientError) throw clientError;

      // 確定済み月のセット作成
      const confirmedMonths = new Set<string>((closingsData || []).map((c: { target_period: string }) => c.target_period));
      try {
        const saved = localStorage.getItem('monthly_financial_confirmations') || localStorage.getItem('monthly_wage_confirmations');
        if (saved) {
          JSON.parse(saved).forEach((m: string) => confirmedMonths.add(m));
        }
      } catch {
        // ignore JSON parse error
      }

      const rawRecs: RawDbRecord[] = (recData || []) as RawDbRecord[];
      const rawSnaps: RawDbRecord[] = (snapData || []) as RawDbRecord[];

      // 各月ごとに確定済み月はスナップショット、未確定月はレコード系を採用
      const snapMonthSet = new Set(rawSnaps.map(s => s.target_period ? s.target_period.substring(0, 7) : ''));
      const recMonthSet = new Set(rawRecs.map(r => r.target_period ? r.target_period.substring(0, 7) : ''));
      const allMonths = new Set([...snapMonthSet, ...recMonthSet]);

      const mergedList: RawDbRecord[] = [];
      const seenIds = new Set<string>();

      allMonths.forEach(month => {
        const isClosed = confirmedMonths.has(month);
        if (isClosed && snapMonthSet.has(month)) {
          // 確定済み: スナップショットを採用
          rawSnaps.filter(s => s.target_period && s.target_period.startsWith(month)).forEach(item => {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              mergedList.push(item);
            }
          });
        } else if (recMonthSet.has(month)) {
          // 未確定: レコード系を採用
          rawRecs.filter(r => r.target_period && r.target_period.startsWith(month)).forEach(item => {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              mergedList.push(item);
            }
          });
        } else {
          // フォールバック
          rawSnaps.filter(s => s.target_period && s.target_period.startsWith(month)).forEach(item => {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              mergedList.push(item);
            }
          });
        }
      });

      // 案件未紐付けの積立金出金のみに絞り込む（費用帳簿向け）
      let filteredList = mergedList;
      if (options.onlyUnassignedReserves) {
        filteredList = filteredList.filter(item => {
          if (item.type === 'reserve' || item.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT || item.subject?.includes('積立金')) {
            return !item.project_id;
          }
          return true;
        });
      }

      // 並び替え (ソート)
      let dbSortKey: keyof RawDbRecord = 'target_period';
      if (sortConfig.key === 'projectId') dbSortKey = 'project_id';
      else if (sortConfig.key === 'clientId') dbSortKey = 'client_id';
      else if (sortConfig.key === 'recordedBy') dbSortKey = 'recorded_by';
      else if (['period', 'targetPeriod'].includes(sortConfig.key)) dbSortKey = 'target_period';
      else if (['type', 'subject', 'amount', 'remarks', 'activity_category', 'cost_category'].includes(sortConfig.key)) {
        dbSortKey = sortConfig.key as keyof RawDbRecord;
      }

      filteredList.sort((a, b) => {
        const valA = a[dbSortKey] ?? '';
        const valB = b[dbSortKey] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        return sortConfig.direction === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });

      // 全件での累計金額サマリ集計
      const calculatedTotals = {
        material: 0,
        other: 0,
        equipmentReserve: 0,
        total: 0
      };
      filteredList.forEach(r => {
        const amt = Number(r.amount) || 0;
        if (r.subject === WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL || r.subject?.includes('材料費')) {
          calculatedTotals.material += amt;
          calculatedTotals.total += amt;
        } else if (r.subject === WORDS_PROJECT.SUBJECT_EXPENSE_OTHER || r.subject?.includes('経費')) {
          calculatedTotals.other += amt;
          calculatedTotals.total += amt;
        } else if (r.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT || r.subject?.includes('設備等修繕維持積立金')) {
          calculatedTotals.equipmentReserve += amt;
          calculatedTotals.total += amt;
        } else {
          calculatedTotals.total += amt;
        }
      });
      setTotals(calculatedTotals);

      setTotalCount(filteredList.length);

      // ページネーション
      const startIdx = (page - 1) * pageSize;
      const pagedRecords = filteredList.slice(startIdx, startIdx + pageSize);

      const mapped: FinancialRecordItem[] = pagedRecords.map(r => {
        const isConfirmed = confirmedMonths.has((r.target_period || '').substring(0, 7));
        return {
          id: r.id,
          targetPeriod: r.target_period || '',
          period: r.target_period || '',
          recordedDate: r.target_period || '',
          projectId: r.project_id || '',
          clientId: r.client_id || '',
          type: (r.type === 'expense' || r.type === 'reserve' ? r.type : 'revenue') as 'revenue' | 'expense' | 'reserve',
          subject: r.subject,
          amount: Number(r.amount) || 0,
          remarks: r.remarks || '',
          recordedBy: r.recorded_by || '',
          activity_category: (r.activity_category === 'welfare' ? 'welfare' : 'production') as 'production' | 'welfare',
          costCategory: (r.cost_category === 'sga' ? 'sga' : 'manufacturing') as 'manufacturing' | 'sga',
          isLimited: isConfirmed
        };
      });
      setItems(mapped);

      if (projData) setProjects(projData.map((p: { id: string; name: string; is_deleted?: boolean | null }) => ({ id: p.id, name: p.is_deleted ? `${p.name} (削除済)` : p.name })));
      if (staffData) setStaffs(staffData.map((s: { id: string; name: string; is_deleted?: boolean | null }) => ({ id: s.id, name: s.is_deleted ? `${s.name} (削除済)` : s.name })));
      if (clientData) setClients(clientData.map((c: { id: string; name: string; is_deleted?: boolean | null }) => ({ id: c.id, name: c.is_deleted ? `${c.name} (削除済)` : c.name })));
    } catch (error) {
      console.error('Error fetching financial records:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortConfig, currentYear, options.type, options.subjects, options.officeId, options.disableYearFilter, options.onlyUnassignedReserves]);

  const batchSaveRecords = useCallback(async (drafts: FinancialRecordItem[]) => {
    const today = getCurrentJSTDateOnly();

    // Process new and updated records into general_financial_records
    const upserts = drafts.map(d => ({
      ...(d.id.startsWith('draft-') ? {} : { id: d.id }),
      target_period: d.period || d.targetPeriod || today,
      office_id: options.officeId || null,
      project_id: d.projectId || null,
      client_id: d.clientId || null,
      type: d.type || 'revenue',
      subject: d.subject || '',
      amount: d.amount || 0,
      remarks: d.remarks || null,
      recorded_by: d.recordedBy || null,
      activity_category: d.activity_category || 'production',
      cost_category: d.costCategory || 'manufacturing'
    }));

    if (upserts.length > 0) {
      const { error: upsertError } = await supabase.from('general_financial_records').upsert(upserts);
      if (upsertError) throw upsertError;
    }

    // Process deletions
    const draftIds = drafts.map(d => d.id).filter(id => !id.startsWith('draft-'));
    const existingIds = items.map(i => i.id);
    const deletedIds = existingIds.filter(id => !draftIds.includes(id));

    if (deletedIds.length > 0) {
      const { error: deleteError } = await supabase.from('general_financial_records').delete().in('id', deletedIds);
      if (deleteError) throw deleteError;
    }

    await fetchRecords();
  }, [items, fetchRecords, options.officeId]);

  const handleSortChange = useCallback((newConfig: { key: string; direction: 'asc' | 'desc' }) => {
    setSortConfig(newConfig);
    setPage(1);
  }, []);

  const handleYearChange = useCallback((year: string) => {
    setCurrentYear(year);
    setPage(1);
  }, []);

  return {
    items,
    totalCount,
    totals,
    page,
    setPage,
    currentYear,
    sortConfig,
    handleSortChange,
    handleYearChange,
    projects,
    staffs,
    clients,
    loading,
    fetchRecords,
    batchSaveRecords
  };
}