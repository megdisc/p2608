import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, CurrencyInput, MultiRowHeader, type HeaderCell, Tooltip, MonthInput } from '../components/ui';
import { TABLE_COLUMNS, MESSAGES, BUTTON_LABELS, WORDS_PROJECT } from '../constants';
import { getCurrentJSTMonth, getProjectFinishedMonth, isProjectFinished as checkProjectFinished, formatSummaryDescription } from '../utils';
import { useAlert } from '../contexts';
import { useProgressRecords } from '../hooks/useProgressRecords';
import { useMonthlyFinancials, type MonthlyFinancialRecord } from '../hooks/useMonthlyFinancials';
import { useBudgetPlanning } from '../hooks/useBudgetPlanning';
import { supabase } from '../lib';

/**
 * 労務費（利用者工賃）の備考欄に表示する基本工賃の内訳テキストを計算する
 * 表示フォーマット: 基本工賃：NNNN円（@nnnn円*hh時間）
 * - 毎月精算案件の場合: 当該年月 (currentMonth) の作業時間のみ集計
 * - 案件終了後精算案件の場合: 全期間の作業時間を集計
 * - 対象期間中に工賃単価の改定（期間変動）がある場合は内訳を合成
 */
export function formatBaseWageRemark({
  memberId,
  taskId,
  isOngoing,
  currentMonth,
  workRecords,
  wageSettings,
  wageRates,
}: {
  memberId: string;
  taskId: string;
  isOngoing: boolean;
  currentMonth: string;
  workRecords: { member_id: string; task_id: string; work_time: number; target_period: string }[];
  wageSettings: { member_id: string; wage_rate_id: string; start_period: string; end_period?: string | null }[];
  wageRates: { id: string; wage: number }[];
}): string {
  // 1. 対象レコードの絞り込み
  const matchedRecords = workRecords.filter(r => {
    if (r.member_id !== memberId || r.task_id !== taskId) return false;
    const hours = Number(r.work_time) || 0;
    if (hours <= 0) return false;

    if (isOngoing) {
      // 毎月精算の場合は当該年月のみ
      const rMonth = String(r.target_period || '').substring(0, 7);
      return rMonth === currentMonth;
    }
    // 案件終了後の精算案件の場合は全期間
    return true;
  });

  // 単価マップ
  const wageRateMap = new Map<string, number>();
  wageRates.forEach(w => wageRateMap.set(w.id, Number(w.wage) || 0));

  // 利用者の単価設定（start_period 降順）
  const memberSettings = wageSettings
    .filter(s => s.member_id === memberId)
    .sort((a, b) => (b.start_period || '').localeCompare(a.start_period || ''));

  // 指定年月における適用単価を取得
  const getWageForPeriod = (ym: string): number => {
    if (!ym) return 0;
    const setting = memberSettings.find(s => {
      const start = s.start_period || '';
      const end = s.end_period || '';
      if (start && ym < start) return false;
      if (end && ym > end) return false;
      return true;
    });

    if (setting && wageRateMap.has(setting.wage_rate_id)) {
      return wageRateMap.get(setting.wage_rate_id)!;
    }

    if (memberSettings.length > 0 && wageRateMap.has(memberSettings[0].wage_rate_id)) {
      return wageRateMap.get(memberSettings[0].wage_rate_id)!;
    }

    return 0;
  };

  // 作業記録がない（0時間）場合
  if (matchedRecords.length === 0) {
    const currentWage = getWageForPeriod(currentMonth);
    return `基本工賃：0円（@${currentWage.toLocaleString()}円*0時間）`;
  }

  // 単価ごとの時間集計
  const wageHoursMap = new Map<number, number>();
  let totalBaseWage = 0;

  matchedRecords.forEach(r => {
    const ym = String(r.target_period || '').substring(0, 7);
    const wage = getWageForPeriod(ym);
    const hours = Number(r.work_time) || 0;

    wageHoursMap.set(wage, (wageHoursMap.get(wage) || 0) + hours);
    totalBaseWage += wage * hours;
  });

  // 単価昇順でソート
  const sortedWages = Array.from(wageHoursMap.keys()).sort((a, b) => a - b);

  let detailsStr = '';
  if (sortedWages.length === 1) {
    const w = sortedWages[0];
    const h = wageHoursMap.get(w)!;
    detailsStr = `@${w.toLocaleString()}円*${h}時間`;
  } else {
    // 期間変動により複数単価にまたがっている場合
    detailsStr = sortedWages
      .map(w => {
        const h = wageHoursMap.get(w)!;
        return `@${w.toLocaleString()}円*${h}時間`;
      })
      .join(' + ');
  }

  return `基本工賃：${totalBaseWage.toLocaleString()}円（${detailsStr}）`;
}

export function RewardAllocationPage() {
  const {
    displayData: progressRecords,
    loading: loadingProgress,
    currentMonth,
    setCurrentMonth,
    fetchRecords: fetchProgress,
    fetchMasters: fetchProgressMasters,
    batchSaveProgressRecords,
    dbClients,
    dbProjects
  } = useProgressRecords();

  const {
    drafts: budgetDrafts,
    loading: loadingBudget,
    fetchBudgetPlanning
  } = useBudgetPlanning();

  const {
    financials,
    allExpenseRecords,
    loadingFinancials,
    fetchFinancials,
    saveFinancials
  } = useMonthlyFinancials();

  const { showAlert } = useAlert();

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'projectCode', direction: 'desc' });

  const [financialDrafts, setFinancialDrafts] = useState<MonthlyFinancialRecord[]>([]);
  
  const [allocationDrafts, setAllocationDrafts] = useState<Record<string, number>>({});

  const [wageRates, setWageRates] = useState<{ id: string; wage: number }[]>([]);
  const [memberWageSettings, setMemberWageSettings] = useState<{
    member_id: string;
    wage_rate_id: string;
    start_period: string;
    end_period?: string | null;
  }[]>([]);
  const [allWorkRecords, setAllWorkRecords] = useState<{
    member_id: string;
    task_id: string;
    work_time: number;
    target_period: string;
  }[]>([]);

  const fetchWageAndWorkRecords = useCallback(async () => {
    try {
      const [wagesRes, settingsRes, worksRes] = await Promise.all([
        supabase.from('wage_rates').select('id, wage').eq('is_deleted', false),
        supabase.from('member_wage_settings')
          .select('id, member_id, wage_rate_id, start_period, end_period')
          .or('is_deleted.eq.false,is_deleted.is.null')
          .order('start_period', { ascending: false }),
        supabase.from('daily_work_records')
          .select('member_id, task_id, work_time, target_period'),
      ]);

      if (wagesRes.data) setWageRates(wagesRes.data.map(w => ({ id: w.id, wage: Number(w.wage) || 0 })));
      if (settingsRes.data) setMemberWageSettings(settingsRes.data);
      if (worksRes.data) setAllWorkRecords(worksRes.data.map(r => ({
        member_id: r.member_id,
        task_id: r.task_id,
        work_time: Number(r.work_time) || 0,
        target_period: String(r.target_period || '')
      })));
    } catch (err) {
      console.error('Error fetching wage and work records:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchProgressMasters(),
      fetchBudgetPlanning(),
      fetchWageAndWorkRecords()
    ]).then(() => {
      fetchProgress(currentMonth);
      fetchFinancials(currentMonth);
    }).catch(console.error);
  }, [currentMonth, fetchProgress, fetchProgressMasters, fetchFinancials, fetchBudgetPlanning, fetchWageAndWorkRecords]);

  useEffect(() => {
    setFinancialDrafts(JSON.parse(JSON.stringify(financials)));
  }, [financials]);

  useEffect(() => {
    try {
      const savedAllocs = localStorage.getItem(`monthly_allocation_drafts_${currentMonth}`);
      if (savedAllocs) {
        setAllocationDrafts(JSON.parse(savedAllocs));
      } else {
        const allocs: Record<string, number> = {};
        progressRecords.forEach(r => {
          if (r.userId && r.allocationAmount > 0) {
            allocs[r.id] = r.allocationAmount;
          }
        });
        setAllocationDrafts(allocs);
      }
    } catch {
      const allocs: Record<string, number> = {};
      progressRecords.forEach(r => {
        if (r.userId && r.allocationAmount > 0) allocs[r.id] = r.allocationAmount;
      });
      setAllocationDrafts(allocs);
    }
  }, [currentMonth, progressRecords]);

  const [confirmedMonths, setConfirmedMonths] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('monthly_settlement_confirmed');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2027-07'];
  });

  const fetchMonthlyConfirmations = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('monthly_incentive_confirmations').select('target_period').eq('is_confirmed', true);
      if (!error && data && data.length > 0) {
        const dbMonths = data.map(d => d.target_period);
        setConfirmedMonths(prev => Array.from(new Set([...prev, ...dbMonths])));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchMonthlyConfirmations();
  }, [fetchMonthlyConfirmations]);

  const isConfirmed = useMemo(() => {
    return confirmedMonths.includes(currentMonth);
  }, [confirmedMonths, currentMonth]);


  const handleFinChange = (projectId: string, type: 'revenue' | 'expense' | 'reserve', subject: string, value: string | number) => {
    if (isConfirmed) return;
    setFinancialDrafts(prev => {
      const existing = prev.find(f => f.project_id === projectId && f.type === type && f.subject === subject);
      if (existing) {
        return prev.map(f => f.id === existing.id ? { ...f, amount: Number(value) || 0 } : f);
      } else {
        return [...prev, {
          id: `TEMP-${Date.now()}-${Math.random()}`,
          project_id: projectId,
          type,
          subject,
          amount: Number(value) || 0,
          target_period: currentMonth
        }];
      }
    });
  };

  const handleAllocationChange = (id: string, value: string | number) => {
    if (isConfirmed) return;
    setAllocationDrafts(prev => ({ ...prev, [id]: Number(value) || 0 }));
  };

  const isAutoCalculatedSubject = (subject: string) => {
    return subject === WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL || subject === WORDS_PROJECT.SUBJECT_EXPENSE_OTHER;
  };

  const isModified = useMemo(() => {
    if (isConfirmed) return false;
    for (const f of Object.values(financialDrafts)) {
      const orig = financials.find(o => o.id === f.id || (o.project_id === f.project_id && o.type === f.type && o.subject === f.subject));
      if (!orig) {
        if (f.amount > 0) return true;
      } else {
        if (f.amount !== orig.amount) return true;
      }
    }
    let savedAllocs: Record<string, number> = {};
    try {
      const savedStr = localStorage.getItem(`monthly_allocation_drafts_${currentMonth}`);
      if (savedStr) savedAllocs = JSON.parse(savedStr);
    } catch {}
    for (const [id, val] of Object.entries(allocationDrafts)) {
      const savedVal = savedAllocs[id] ?? 0;
      if (val !== savedVal) return true;
    }
    return false;
  }, [financialDrafts, financials, allocationDrafts, isConfirmed, currentMonth]);

  const isValidUuid = (str: any): boolean => {
    return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  };

  const handleBatchSave = async () => {
    try {
      const upsertFin = Object.values(financialDrafts).filter(f => 
        f &&
        f.subject &&
        !isAutoCalculatedSubject(f.subject) &&
        (isValidUuid(f.id) || Number(f.amount) > 0)
      );
      await saveFinancials(upsertFin, []);
      
      try {
        localStorage.setItem(`monthly_allocation_drafts_${currentMonth}`, JSON.stringify(allocationDrafts));
      } catch (e) {
        console.warn('localStorage save warning:', e);
      }

      try {
        const modifiedProgressRecords = progressRecords.map(r => ({
          ...r,
          allocationAmount: allocationDrafts[r.id] !== undefined ? allocationDrafts[r.id] : r.allocationAmount
        }));
        await batchSaveProgressRecords(modifiedProgressRecords, []);
      } catch (e) {
        console.warn('batchSaveProgressRecords warning:', e);
      }
      
      try {
        await fetchFinancials(currentMonth);
        await fetchProgress(currentMonth);
      } catch (e) {
        console.warn('Re-fetch warning:', e);
      }

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error('Error in handleBatchSave:', err);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    }
  };

  const handleCancel = () => {
    setFinancialDrafts(JSON.parse(JSON.stringify(financials)));
    try {
      const savedStr = localStorage.getItem(`monthly_allocation_drafts_${currentMonth}`);
      if (savedStr) {
        setAllocationDrafts(JSON.parse(savedStr));
        return;
      }
    } catch {}
    const allocs: Record<string, number> = {};
    progressRecords.forEach(r => {
      if (r.userId && r.allocationAmount > 0) allocs[r.id] = r.allocationAmount;
    });
    setAllocationDrafts(allocs);
  };

  const handleConfirm = async () => {
    const hasSurplusError = displayProjects.some(proj => {
      const sumRev = proj.revenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const sumExp = proj.expenses.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const sumRes = proj.reserves.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      return (sumRev - sumExp - sumRes) !== 0;
    });

    if (hasSurplusError) {
      showAlert('余剰が¥0でない案件があるため、確定できません。金額を調整してください。', 'error');
      return;
    }

    if (isModified) {
      await handleBatchSave();
    }

    try {
      await supabase.from('monthly_incentive_confirmations').upsert(
        { target_period: currentMonth, is_confirmed: true, confirmed_at: new Date().toISOString() },
        { onConflict: 'target_period' }
      );
    } catch {}

    setConfirmedMonths(prev => {
      if (prev.includes(currentMonth)) return prev;
      const next = [...prev, currentMonth];
      localStorage.setItem('monthly_incentive_allocation_confirmed', JSON.stringify(next));
      return next;
    });

    showAlert(`${currentMonth}の月次インセンティブ分配を確定しました。`, 'success');
  };

  const handleUnconfirm = async () => {
    try {
      await supabase.from('monthly_incentive_confirmations').delete().eq('target_period', currentMonth);
    } catch {}

    setConfirmedMonths(prev => {
      const next = prev.filter(m => m !== currentMonth);
      localStorage.setItem('monthly_incentive_allocation_confirmed', JSON.stringify(next));
      return next;
    });
    showAlert(`${currentMonth}の確定を解除しました。`, 'success');
  };

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current && current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  if (loadingProgress || loadingFinancials || loadingBudget) return <div>{MESSAGES.LOADING}</div>;

  const headerRows: HeaderCell[][] = [
    [
      { label: TABLE_COLUMNS.PROJECT_ID, width: '90px', sortKey: 'projectCode' },
      { label: TABLE_COLUMNS.PROJECT_NAME, width: '160px', sortKey: 'projectName' },
      { label: TABLE_COLUMNS.PROJECT_TYPE, width: '150px', sortKey: 'projectType' },
      { label: '取引区分', width: '120px' },
      { label: '勘定科目', width: '220px' },
      { label: '摘要', width: '160px' },
      { label: '金額', width: '120px' },
      { label: '備考', width: '260px' },
      { label: TABLE_COLUMNS.RESTRICTION, width: '50px' },
    ]
  ];

  const projectIds = Array.from(new Set(progressRecords.map(r => r.projectId)));
  const displayProjects = projectIds.map(pid => {
    const projRecords = progressRecords.filter(r => r.projectId === pid);
    const firstRec = projRecords[0];
    const budgetDraft = budgetDrafts.find(b => b.project.id === pid);
    const projDbInfo = dbProjects.find(p => p.id === pid);
    const clientName = dbClients.find(c => c.id === projDbInfo?.customerId)?.name || '';
    const isOngoing = projDbInfo?.projectType === 'ongoing';
    
    const revenues = (budgetDraft?.revenues || []).map(b => {
      const fin = financialDrafts.find(f => f.project_id === pid && f.type === 'revenue' && f.subject === b.subject);
      return {
        subject: b.subject,
        billingDest: clientName,
        amount: fin !== undefined ? Number(fin.amount || 0) : Number(b.amount || 0)
      };
    });

    const nonLaborExpenses = [WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL, WORDS_PROJECT.SUBJECT_EXPENSE_OTHER].map(subj => {
      const recs = allExpenseRecords.filter(r => r.project_id === pid && (r.subject === subj || (subj === WORDS_PROJECT.SUBJECT_EXPENSE_OTHER && r.subject === 'その他経費')));
      let amount = 0;
      if (isOngoing) {
        amount = recs.filter(r => r.target_period && r.target_period.startsWith(currentMonth)).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      } else {
        amount = recs.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      }

      return {
        id: subj,
        subject: subj,
        payee: '',
        amount,
        type: 'non-labor',
        isAutoCalculated: true
      };
    });

    const laborExpenses: any[] = [];
    const taskBudgetItems = (budgetDraft?.expenses || []).filter(b => b.taskId);

    const taskMap = new Map<string, { taskId: string, taskName: string, budgetAmount: number }>();
    taskBudgetItems.forEach(b => {
      if (b.taskId) {
        const rawTaskName = (b as any).summary && (b as any).summary !== '-' ? (b as any).summary : b.subject;
        const pureTaskName = rawTaskName
          .replace(/^労務費（利用者工賃・/, '')
          .replace(/^労務費（利用者工賃）/, '')
          .replace(/^労務費（利用者工賃以外）/, '')
          .replace(/^労務費・外注加工費/, '')
          .replace(/^労務費/, '')
          .replace(/^外注加工費/, '')
          .replace(/^[（\(]/, '')
          .replace(/[）\)]+$/, '')
          .trim();

        taskMap.set(b.taskId, {
          taskId: b.taskId,
          taskName: pureTaskName || rawTaskName,
          budgetAmount: Number(b.amount) || 0
        });
      }
    });

    projRecords.forEach(r => {
      if (r.taskId && !taskMap.has(r.taskId)) {
        const pureTaskName = r.taskName
          .replace(/^労務費（利用者工賃・/, '')
          .replace(/^労務費（利用者工賃）/, '')
          .replace(/^労務費（利用者工賃以外）/, '')
          .replace(/^労務費・外注加工費/, '')
          .replace(/^労務費/, '')
          .replace(/^外注加工費/, '')
          .replace(/^[（\(]/, '')
          .replace(/[）\)]+$/, '')
          .trim();

        taskMap.set(r.taskId, {
          taskId: r.taskId,
          taskName: pureTaskName || r.taskName,
          budgetAmount: 0
        });
      }
    });

    let totalProjectStaffAlloc = 0;

    taskMap.forEach(({ taskId, taskName, budgetAmount }) => {
      const taskRecords = projRecords.filter(r => r.taskId === taskId);
      const memberRecords = taskRecords.filter(r => r.assigneeType === '利用者');
      const outsourceRecords = taskRecords.filter(r => r.assigneeType === '外注先');

      const targetProjTask = dbProjects.flatMap(p => p.tasks || []).find(t => t.id === taskId);
      const isOutsourceTask = outsourceRecords.length > 0 || (targetProjTask as any)?.assigneeType === 'external';

      const numMembers = memberRecords.length;
      const hasStaffAssignees = (targetProjTask?.assigneeIds || []).some((id: string) => id.startsWith('staff_'));
      const memberRatio = (numMembers > 0 && hasStaffAssignees) ? 0.75 : 1.0;

      const memberPerPerson = numMembers > 0 
        ? Math.floor(((budgetAmount * memberRatio) / numMembers) / 1000) * 1000 
        : 0;
      const totalMemberAlloc = memberPerPerson * numMembers;
      
      if (!isOutsourceTask) {
        const staffAlloc = budgetAmount - totalMemberAlloc;
        totalProjectStaffAlloc += staffAlloc;
      }

      const cleanTaskName = taskName
        .replace(/^労務費（利用者工賃・/, '')
        .replace(/^労務費（利用者工賃）/, '')
        .replace(/^労務費（利用者工賃以外）/, '')
        .replace(/^労務費・外注加工費/, '')
        .replace(/^労務費/, '')
        .replace(/^外注加工費/, '')
        .replace(/^[（\(]/, '')
        .replace(/[）\)]+$/, '')
        .trim();

      const subjectName = WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER;

      memberRecords.forEach(m => {
        const customVal = allocationDrafts[m.id];
        const rawMemberId = m.userId.startsWith('member_') ? m.userId.replace('member_', '') : m.userId;

        const baseWageRemark = formatBaseWageRemark({
          memberId: rawMemberId,
          taskId: taskId,
          isOngoing,
          currentMonth,
          workRecords: allWorkRecords,
          wageSettings: memberWageSettings,
          wageRates,
        });

        laborExpenses.push({
          id: m.id,
          subject: subjectName,
          taskName: cleanTaskName,
          payee: m.userName,
          amount: customVal !== undefined ? customVal : memberPerPerson,
          type: 'labor',
          isAutoCalculated: false,
          remarks: baseWageRemark,
        });
      });

      outsourceRecords.forEach(o => {
        const customVal = allocationDrafts[o.id];
        laborExpenses.push({
          id: o.id,
          subject: WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE,
          taskName: cleanTaskName,
          payee: o.userName,
          amount: customVal !== undefined ? customVal : budgetAmount,
          type: 'labor',
          isAutoCalculated: false
        });
      });
    });

    const staffKey = `STAFF_ALLOC_${pid}`;
    const customStaffVal = allocationDrafts[staffKey];

    laborExpenses.push({
      id: staffKey,
      subject: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER,
      taskName: '',
      payee: '（職員等）',
      amount: customStaffVal !== undefined ? customStaffVal : totalProjectStaffAlloc,
      type: 'labor',
      isAutoCalculated: false
    });

    const materialExpense = nonLaborExpenses.find(e => e.subject === WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL);
    const otherExpense = nonLaborExpenses.find(e => e.subject === WORDS_PROJECT.SUBJECT_EXPENSE_OTHER);
    const restNonLabor = nonLaborExpenses.filter(e => e.subject !== WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL && e.subject !== WORDS_PROJECT.SUBJECT_EXPENSE_OTHER);

    const externalLabor = laborExpenses.filter(e => e.subject === WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE || e.subject.startsWith('外注加工費'));
    const staffLabor = laborExpenses.filter(e => e.subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER || e.subject.startsWith('労務費（利用者工賃以外）'));
    const memberLabor = laborExpenses.filter(e => e.subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER || (!e.subject.startsWith('外注加工費') && e.subject !== WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE && e.subject !== WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER && !e.subject.startsWith('労務費（利用者工賃以外）')));

    const expenses: any[] = [];
    // 1. 材料費
    if (materialExpense) expenses.push(materialExpense);
    // 2. 経費
    if (otherExpense) expenses.push(otherExpense);
    // 3. 外注加工費
    expenses.push(...externalLabor);
    // 4. 労務費（利用者工賃以外）
    expenses.push(...staffLabor);
    // 5. 労務費（利用者工賃）
    expenses.push(...memberLabor);
    // 残り
    expenses.push(...restNonLabor);

    const reserves = (budgetDraft?.reserves || []).map(b => {
      const fin = financialDrafts.find(f => f.project_id === pid && f.type === 'reserve' && f.subject === b.subject);
      return {
        subject: b.subject,
        amount: fin !== undefined ? Number(fin.amount || 0) : Number(b.amount || 0)
      };
    });

    const [yearStr, monthStr] = currentMonth.split('-');
    const formattedProjectName = (isOngoing && yearStr && monthStr) 
      ? `${firstRec.projectName}（${yearStr}年${monthStr}月分）`
      : firstRec.projectName;

    const projectTasks = projRecords.filter(r => r.isFirstInTask);
    const isFinished = projDbInfo 
      ? checkProjectFinished(projDbInfo) 
      : (firstRec?.projectStatus === 'completed' || 
         firstRec?.projectStatus === 'finished' || 
         firstRec?.projectStatus === WORDS_PROJECT.STATUS_FINISHED ||
         (projectTasks.length > 0 && projectTasks.every(t => t.taskStatus === 'completed' || t.taskStatus === 'canceled')));

    const finishedMonth = projDbInfo?.settlementYearMonth || (isFinished 
      ? (projDbInfo ? getProjectFinishedMonth(projDbInfo) : (() => {
          let maxDate = '';
          projectTasks.forEach(t => {
            if (t.taskCompletedAt && t.taskCompletedAt > maxDate) maxDate = t.taskCompletedAt;
          });
          const m = maxDate.match(/^(\d{4}-\d{2})/);
          return m ? m[1] : currentMonth;
        })())
      : null);

    const createdAtMonth = projDbInfo?.createdAt ? projDbInfo.createdAt.slice(0, 7) : undefined;

    return {
      id: pid,
      name: formattedProjectName,
      code: firstRec?.projectCode || projDbInfo?.code,
      projectType: firstRec?.projectType || projDbInfo?.projectType,
      projectTypeSortKey: firstRec?.projectTypeSortKey || projDbInfo?.projectTypeSortKey,
      isOngoing,
      isFinished,
      finishedMonth,
      createdAtMonth,
      revenues,
      expenses,
      reserves
    };
  }).filter(proj => {
    if (proj.isOngoing) {
      if (proj.createdAtMonth && currentMonth < proj.createdAtMonth) {
        return false;
      }
      if (proj.isFinished && proj.finishedMonth) {
        return currentMonth <= proj.finishedMonth;
      }
      return true;
    } else {
      if (!proj.isFinished || !proj.finishedMonth) {
        return false;
      }
      return currentMonth === proj.finishedMonth;
    }
  });

  displayProjects.sort((a, b) => {
    if (!sortConfig) return 0;
    let aVal = ''; let bVal = '';
    if (sortConfig.key === 'projectCode') {
      aVal = a.code || ''; bVal = b.code || '';
    } else if (sortConfig.key === 'projectName') {
      aVal = a.name || ''; bVal = b.name || '';
    } else if (sortConfig.key === 'projectType') {
      aVal = a.projectTypeSortKey || ''; bVal = b.projectTypeSortKey || '';
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <>
      <div className="table-container">
        <table className="inventory-table">
          <MultiRowHeader rows={headerRows} sortConfig={sortConfig} onSort={handleSort} />
          {displayProjects.length === 0 ? (
            <tbody><tr><td colSpan={9} className="empty-message">{MESSAGES.EMPTY_PROGRESS_RECORD}</td></tr></tbody>
          ) : (
            displayProjects.map(proj => {
              const sumRev = proj.revenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
              const sumExp = proj.expenses.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
              const sumRes = proj.reserves.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
              const totalSurplus = sumRev - sumExp - sumRes;

              type FinRowItem = {
                categoryType: 'revenue' | 'expense' | 'reserve' | 'surplus';
                categoryLabel: string;
                subject: string;
                amount: number;
                summary: string;
                remarks: string;
                expenseId?: string;
                isLabor?: boolean;
                isAutoCalculated?: boolean;
              };

              const items: FinRowItem[] = [];

              proj.revenues.forEach(rev => {
                items.push({
                  categoryType: 'revenue',
                  categoryLabel: WORDS_PROJECT.CATEGORY_REVENUE,
                  subject: rev.subject,
                  amount: rev.amount,
                  summary: formatSummaryDescription({ billingDest: rev.billingDest }),
                  remarks: '-',
                });
              });

              proj.expenses.forEach(exp => {
                const isStaff = exp.subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER || exp.payee === '（職員等）' || exp.payee === '職員給与等';
                const summary = formatSummaryDescription({
                  task: exp.taskName,
                  payee: exp.payee,
                  isStaff,
                });

                items.push({
                  categoryType: 'expense',
                  categoryLabel: WORDS_PROJECT.CATEGORY_EXPENSE,
                  subject: exp.subject,
                  amount: exp.amount,
                  summary,
                  remarks: exp.remarks || '-',
                  expenseId: exp.id,
                  isLabor: exp.type === 'labor',
                  isAutoCalculated: exp.isAutoCalculated,
                });
              });

              proj.reserves.forEach(res => {
                items.push({
                  categoryType: 'reserve',
                  categoryLabel: WORDS_PROJECT.CATEGORY_RESERVE,
                  subject: res.subject,
                  amount: res.amount,
                  summary: '-',
                  remarks: '-',
                });
              });

              items.push({
                categoryType: 'surplus',
                categoryLabel: WORDS_PROJECT.CATEGORY_SURPLUS,
                subject: '余剰',
                amount: totalSurplus,
                summary: '-',
                remarks: totalSurplus !== 0 ? '余剰が¥0になるように、金額を調整してください。' : '-',
              });

              const totalRows = items.length;

              const rows = items.map((rowItem, idx) => {
                const isFirstRow = idx === 0;
                const isLastRow = idx === totalRows - 1;
                const isSurplusRow = rowItem.categoryType === 'surplus';
                const rowBorderBottom = isLastRow ? undefined : 'none';
                const rowBg = isSurplusRow ? 'var(--color-bg-subtle, #f9fafb)' : undefined;

                const prevItem = idx > 0 ? items[idx - 1] : null;
                const nextItem = idx < totalRows - 1 ? items[idx + 1] : null;
                const isFirstInCategory = !prevItem || prevItem.categoryType !== rowItem.categoryType;
                const isLastInCategory = !nextItem || nextItem.categoryType !== rowItem.categoryType;

                return (
                  <tr
                    key={`proj-${proj.id}-${rowItem.categoryType}-${idx}`}
                    style={{ backgroundColor: rowBg }}
                  >
                    <td style={{ borderBottom: rowBorderBottom }}>
                      {isFirstRow ? proj.code : ''}
                    </td>
                    <td style={{ borderBottom: rowBorderBottom }}>
                      {isFirstRow ? proj.name : ''}
                    </td>
                    <td style={{ borderBottom: rowBorderBottom }}>
                      {isFirstRow ? (proj.isOngoing ? '毎月' : '案件終了時') : ''}
                    </td>
                    <td
                      style={{
                        fontWeight: isSurplusRow ? 'bold' : 'normal',
                        borderBottom: isLastInCategory ? undefined : 'none'
                      }}
                    >
                      {isFirstInCategory ? rowItem.categoryLabel : ''}
                    </td>
                    <td style={{ fontWeight: isSurplusRow ? 'bold' : 'normal' }}>
                      {rowItem.subject}
                    </td>
                    <td>
                      {rowItem.summary}
                    </td>
                    <td
                      className={
                        !isSurplusRow && !rowItem.isAutoCalculated
                          ? (!isConfirmed
                              ? (totalSurplus !== 0 ? 'bg-error-highlight' : 'bg-input-highlight')
                              : undefined)
                          : undefined
                      }
                      style={{
                        fontWeight: isSurplusRow ? 'bold' : 'normal',
                        textAlign: isSurplusRow ? 'right' : undefined,
                        paddingRight: isSurplusRow ? '8px' : undefined
                      }}
                    >
                      {rowItem.categoryType === 'revenue' ? (
                        <CurrencyInput
                          disabled={isConfirmed}
                          value={rowItem.amount}
                          onChange={val => handleFinChange(proj.id, 'revenue', rowItem.subject, val)}
                        />
                      ) : rowItem.categoryType === 'expense' ? (
                        rowItem.isLabor ? (
                          <CurrencyInput
                            disabled={isConfirmed}
                            value={rowItem.amount}
                            onChange={val => handleAllocationChange(rowItem.expenseId || '', val)}
                          />
                        ) : rowItem.isAutoCalculated ? (
                          <span style={{ fontVariantNumeric: 'tabular-nums', display: 'block', textAlign: 'right', paddingRight: '4px' }}>
                            ¥{rowItem.amount.toLocaleString()}
                          </span>
                        ) : (
                          <CurrencyInput
                            disabled={isConfirmed}
                            value={rowItem.amount}
                            onChange={val => handleFinChange(proj.id, 'expense', rowItem.subject, val)}
                          />
                        )
                      ) : rowItem.categoryType === 'reserve' ? (
                        <CurrencyInput
                          disabled={isConfirmed}
                          value={rowItem.amount}
                          onChange={val => handleFinChange(proj.id, 'reserve', rowItem.subject, val)}
                        />
                      ) : (
                        <strong style={{ color: totalSurplus !== 0 ? 'var(--color-error)' : 'inherit', fontVariantNumeric: 'tabular-nums' }}>
                          ¥{totalSurplus.toLocaleString()}
                        </strong>
                      )}
                    </td>
                    <td style={{
                      color: isSurplusRow && totalSurplus !== 0 ? 'var(--color-error)' : 'inherit',
                      fontSize: (isSurplusRow || (rowItem.remarks && rowItem.remarks.startsWith('基本工賃：'))) ? '12px' : undefined,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {rowItem.remarks}
                    </td>
                    <td className="sticky-right" style={{ textAlign: 'center', borderBottom: rowBorderBottom }}>
                      {isFirstRow && (isConfirmed ? (
                        <Tooltip text="確定済のため変更不可">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        </Tooltip>
                      ) : (proj.isFinished ? (
                        <Tooltip text="案件終了">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        </Tooltip>
                      ) : null))}
                    </td>
                  </tr>
                );
              });

              if (isConfirmed) {
                return (
                  <Tooltip as="tbody" key={proj.id} text="確定済のため変更不可">
                    {rows}
                  </Tooltip>
                );
              }

              if (!isConfirmed && totalSurplus !== 0) {
                return (
                  <Tooltip as="tbody" key={proj.id} text="余剰が¥0になるように、金額を調整してください。">
                    {rows}
                  </Tooltip>
                );
              }
              return (
                <tbody key={proj.id} style={{ display: 'contents' }}>
                  {rows}
                </tbody>
              );
            })
          )}
        </table>
      </div>

      <div className="action-bar">
        <div className="filter-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button 
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                if (currentMonth) {
                  const [y, m] = currentMonth.split('-');
                  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                  date.setMonth(date.getMonth() - 1);
                  const newY = date.getFullYear();
                  const newM = (date.getMonth() + 1).toString().padStart(2, '0');
                  setCurrentMonth(`${newY}-${newM}`);
                }
              }}
            >
              ＜
            </Button>
            <MonthInput 
              value={currentMonth || ''}
              onChange={(val) => {
                if (val) {
                  setCurrentMonth(val);
                }
              }}
              className="date-filter-pill"
              style={{ width: 'auto', minWidth: '140px' }}
            />
            <Button 
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                if (currentMonth) {
                  const [y, m] = currentMonth.split('-');
                  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                  date.setMonth(date.getMonth() + 1);
                  const newY = date.getFullYear();
                  const newM = (date.getMonth() + 1).toString().padStart(2, '0');
                  setCurrentMonth(`${newY}-${newM}`);
                }
              }}
            >
              ＞
            </Button>
            <Button 
              variant="secondary"
              style={{ 
                padding: '0 12px', height: '28px', fontSize: 'var(--text-caption)'
              }}
              onClick={() => {
                setCurrentMonth(getCurrentJSTMonth());
              }}
              disabled={currentMonth === getCurrentJSTMonth()}
            >
              今月
            </Button>
            {isConfirmed ? (
              <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                確定済
              </span>
            ) : (
              <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#fef3c7', color: '#92400e' }}>
                暫定
              </span>
            )}
          </div>
        </div>
        <div className="action-buttons">
          <Button variant="secondary" onClick={handleCancel} disabled={isConfirmed || !isModified}>
            {BUTTON_LABELS.CANCEL || '取消'}
          </Button>
          <Button variant="primary" onClick={handleBatchSave} disabled={isConfirmed || !isModified}>
            {BUTTON_LABELS.SAVE || '保存'}
          </Button>
          {!isConfirmed ? (
            <Button variant="primary" onClick={handleConfirm}>
              確定
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleUnconfirm}>
              解除
            </Button>
          )}
        </div>
        <div style={{ flex: 1 }}></div>
      </div>
    </>
  );
}
