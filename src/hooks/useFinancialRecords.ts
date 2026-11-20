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

export type FinancialRecordProjectOption = {
  id: string;
  name: string;
  code?: string;
  clientId?: string;
  isFinished?: boolean;
};

export const isManuallyEditableItem = (item: { id?: string; subject?: string; type?: string; projectId?: string; project_id?: string | null }) => {
  if (item.id && item.id.startsWith('draft-')) return true;
  if (item.subject === WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL || item.subject?.includes('材料費')) return true;
  if (item.subject === WORDS_PROJECT.SUBJECT_EXPENSE_OTHER || item.subject === 'その他経費' || item.subject === '経費') return true;
  if (
    item.subject === WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_OTHER ||
    item.subject === 'その他福祉事業費用' ||
    item.subject === 'その他事業費用' ||
    item.subject === '福祉事業費用' ||
    item.subject?.includes('福祉事業費用')
  ) {
    return true;
  }
  const pId = item.projectId !== undefined ? item.projectId : item.project_id;
  if (item.type === 'reserve' && (item.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT || item.subject?.includes('設備等修繕維持積立金')) && !pId) {
    return true;
  }
  return false;
};

type RawProjectData = {
  id: string;
  name: string;
  code?: string | null;
  is_deleted?: boolean | null;
  client_id?: string | null;
  project_tasks?: { id: string; is_completed?: boolean | null; is_deleted?: boolean | null }[] | null;
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
  const [projects, setProjects] = useState<FinancialRecordProjectOption[]>([]);
  const [staffs, setStaffs] = useState<{ id: string; name: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [totals, setTotals] = useState<Record<string, number>>({
    material: 0,
    other: 0,
    equipmentReserve: 0,
    welfareExpense: 0,
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

      if (!options.officeId) {
        setItems([]);
        setTotals({ material: 0, other: 0, equipmentReserve: 0, welfareExpense: 0, total: 0 });
        setTotalCount(0);
        setProjects([]);
        setStaffs([]);
        setClients([]);
        setLoading(false);
        return;
      }

      // 1. 確定状況の確認（月次財務確定）
      const closingsQuery = supabase
        .from('monthly_closings')
        .select('target_period, is_financial_confirmed')
        .eq('is_financial_confirmed', true)
        .eq('office_id', options.officeId);

      // 2. 実績レコードクエリ（月次実績層）
      let recQuery = supabase.from('financial_records').select(`
          id, target_period, type, subject, amount, remarks, activity_category, cost_category, office_id,
          project_id, client_id, recorded_by
        `).eq('office_id', options.officeId);

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
      let snapQuery = supabase.from('financial_snapshot').select(`
          id, target_period, type, subject, amount, remarks, activity_category, cost_category, office_id,
          project_id, client_id, recorded_by
        `).eq('office_id', options.officeId);

      if (currentYear && !options.disableYearFilter) {
        snapQuery = snapQuery.gte('target_period', `${currentYear}-01-01`).lte('target_period', `${currentYear}-12-31`);
      }
      if (options.type) {
        snapQuery = snapQuery.eq('type', options.type);
      }
      if (options.subjects && options.subjects.length > 0) {
        snapQuery = snapQuery.in('subject', options.subjects);
      }

      const projQuery = supabase
        .from('projects')
        .select(`
          id, name, code, is_deleted, office_id, client_id,
          project_tasks ( id, is_completed, is_deleted )
        `)
        .eq('office_id', options.officeId)
        .order('code', { ascending: true });

      // 4. 工賃スナップショットクエリ（労務費（利用者工賃）・実費控除の明細連携）
      let wageQuery = supabase
        .from('wage_snapshot')
        .select('id, target_period, payment_date, wage_total, service_fee_deduction, actual_expense_deduction, deduction_total, office_id, member_id')
        .eq('office_id', options.officeId);

      // 5. サービス費用スナップショットクエリ（訓練等給付費・サービス利用料の明細連携）
      let billingQuery = supabase
        .from('service_billing_snapshot')
        .select('id, target_period, benefit_billing_amount, final_copayment_amount, actual_expense_amount, office_id, member_id, status')
        .eq('office_id', options.officeId);

      const [
        { data: closingsData },
        { data: recData, error: recError },
        { data: snapData, error: snapError },
        { data: projData, error: projError },
        { data: staffData, error: staffError },
        { data: clientData, error: clientError },
        { data: wageData },
        { data: billingData },
        { data: memberData }
      ] = await Promise.all([
        closingsQuery,
        recQuery,
        snapQuery,
        projQuery,
        supabase.from('staffs').select('id, name, yomigana, is_deleted').order('yomigana', { ascending: true }),
        supabase.from('partners').select('id, name, yomigana, is_deleted').order('yomigana', { ascending: true }),
        wageQuery,
        billingQuery,
        supabase.from('members').select('id, name, yomigana, is_deleted').order('yomigana', { ascending: true })
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

      const membersMap = new Map<string, string>((memberData || []).map((m: any) => [m.id, m.name]));

      // 4. wage_snapshot から「労務費（利用者工賃）」および「実費控除」の確定明細を生成・合流
      (wageData || []).forEach((w: any) => {
        const memberName = membersMap.get(w.member_id) || '利用者';
        const dateStr = w.payment_date || (w.target_period ? `${w.target_period}-15` : '');

        // 4.1 労務費（利用者工賃）
        const wageAmt = Number(w.wage_total) || 0;
        if (wageAmt > 0) {
          mergedList.push({
            id: `wage-${w.id}`,
            target_period: dateStr,
            type: 'expense',
            subject: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER,
            amount: wageAmt,
            remarks: `工賃確定支給（${memberName} 様）`,
            activity_category: 'production',
            cost_category: 'manufacturing',
            office_id: w.office_id,
            project_id: null,
            client_id: null,
            recorded_by: null,
          });
        }

        // 4.2 実費控除（食事代・送迎代等）
        const deductAmt = Number(w.actual_expense_deduction) || 0;
        if (deductAmt > 0) {
          mergedList.push({
            id: `wage-deduct-${w.id}`,
            target_period: dateStr,
            type: 'revenue',
            subject: WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_DEDUCTION,
            amount: deductAmt,
            remarks: `実費控除（${memberName} 様）`,
            activity_category: 'welfare',
            cost_category: 'manufacturing',
            office_id: w.office_id,
            project_id: null,
            client_id: null,
            recorded_by: null,
          });
        }
      });

      // 5. service_billing_snapshot から「訓練等給付費」および「サービス利用料」の確定明細を生成・合流
      (billingData || []).forEach((b: any) => {
        const memberName = membersMap.get(b.member_id) || '利用者';
        const periodStr = b.target_period || '';

        // 5.1 訓練等給付費（翌月10日請求日）
        const benefitAmt = Number(b.benefit_billing_amount) || 0;
        if (benefitAmt > 0) {
          let claimDate = '';
          if (periodStr && periodStr.includes('-')) {
            const [y, m] = periodStr.split('-');
            const d = new Date(parseInt(y, 10), parseInt(m, 10), 10);
            const claimY = d.getFullYear();
            const claimM = (d.getMonth() + 1).toString().padStart(2, '0');
            claimDate = `${claimY}-${claimM}-10`;
          } else {
            claimDate = `${periodStr}-10`;
          }

          mergedList.push({
            id: `billing-benefit-${b.id}`,
            target_period: claimDate,
            type: 'revenue',
            subject: WORDS_PROJECT.SUBJECT_WELFARE_BENEFIT,
            amount: benefitAmt,
            remarks: `訓練等給付費請求（${memberName} 様）`,
            activity_category: 'welfare',
            cost_category: 'manufacturing',
            office_id: b.office_id,
            project_id: null,
            client_id: null,
            recorded_by: null,
          });
        }

        // 5.2 サービス利用料（当月末自己負担請求）
        const copayAmt = Number(b.final_copayment_amount) || 0;
        if (copayAmt > 0) {
          let copayDate = '';
          if (periodStr && periodStr.includes('-')) {
            const [y, m] = periodStr.split('-');
            const lastDay = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
            copayDate = `${periodStr}-${lastDay.toString().padStart(2, '0')}`;
          } else {
            copayDate = `${periodStr}-28`;
          }

          mergedList.push({
            id: `billing-copay-${b.id}`,
            target_period: copayDate,
            type: 'revenue',
            subject: WORDS_PROJECT.SUBJECT_WELFARE_USAGE_FEE,
            amount: copayAmt,
            remarks: `サービス利用料（${memberName} 様）`,
            activity_category: 'welfare',
            cost_category: 'manufacturing',
            office_id: b.office_id,
            project_id: null,
            client_id: null,
            recorded_by: null,
          });
        }
      });

      // 案件未紐付けの積立金出金のみに絞り込む（会計帳簿向け）
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
        welfareExpense: 0,
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
        } else if ((r.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT || r.subject?.includes('設備等修繕維持積立金')) && !r.project_id) {
          calculatedTotals.equipmentReserve += amt;
          calculatedTotals.total += amt;
        } else if (
          r.subject === WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_OTHER ||
          r.subject === 'その他福祉事業費用' ||
          r.subject === 'その他事業費用' ||
          r.subject === '福祉事業費用' ||
          r.subject?.includes('福祉事業費用')
        ) {
          calculatedTotals.welfareExpense += amt;
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
        const isConfirmed = confirmedMonths.has((r.target_period || '').substring(0, 7)) || r.id.startsWith('wage-') || r.id.startsWith('billing-');
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

      if (projData) {
        setProjects(projData.map((p: RawProjectData) => {
          const activeTasks = (p.project_tasks || []).filter(t => !t.is_deleted);
          const isFinished = activeTasks.length > 0 && activeTasks.every(t => t.is_completed);
          return {
            id: p.id,
            name: p.is_deleted ? `${p.name} (削除済)` : p.name,
            code: p.code || '',
            clientId: p.client_id || '',
            isFinished
          };
        }));
      }
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

    // Process new and updated records for manually editable items into financial_records
    const upserts = drafts
      .filter(d => isManuallyEditableItem(d))
      .map(d => {
        const isReserveWithdrawal = d.type === 'reserve' || d.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT;
        const isWelfareExpense = d.subject === WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_OTHER || d.activity_category === 'welfare';
        const isNonProject = isReserveWithdrawal || isWelfareExpense;

        return {
          ...(d.id.startsWith('draft-') ? {} : { id: d.id }),
          target_period: d.period || d.targetPeriod || today,
          office_id: options.officeId || null,
          project_id: isNonProject ? null : (d.projectId || null),
          client_id: isNonProject ? null : (d.clientId || null),
          type: isReserveWithdrawal ? 'reserve' : (d.type || 'expense'),
          subject: isReserveWithdrawal ? WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT : d.subject,
          amount: Number(d.amount) || 0,
          remarks: d.remarks || null,
          recorded_by: d.recordedBy || (staffs[0]?.id || null),
          activity_category: isWelfareExpense ? 'welfare' : (d.activity_category || 'production'),
          cost_category: d.costCategory || 'manufacturing'
        };
      });

    if (upserts.length > 0) {
      const { error: upsertError } = await supabase.from('financial_records').upsert(upserts);
      if (upsertError) throw upsertError;
    }

    // Process deletions: 手動入力行のみを対象とする
    const draftIds = drafts.map(d => d.id).filter(id => !id.startsWith('draft-'));
    const editableExistingIds = items
      .filter(i => !i.isLimited && isManuallyEditableItem(i))
      .map(i => i.id);
    const deletedIds = editableExistingIds.filter(id => !draftIds.includes(id));

    if (deletedIds.length > 0) {
      const { error: deleteError } = await supabase.from('financial_records').delete().in('id', deletedIds);
      if (deleteError) throw deleteError;
    }

    await fetchRecords();
  }, [items, fetchRecords, options.officeId, staffs]);

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