import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, CurrencyInput, MultiRowHeader, type HeaderCell, Tooltip, MonthInput } from '../components/ui';
import { TABLE_COLUMNS, MESSAGES, BUTTON_LABELS, WORDS_PROJECT } from '../constants';
import { getCurrentJSTMonth, getProjectFinishedMonth, isProjectFinished as checkProjectFinished } from '../utils';
import { useAlert } from '../contexts';
import { useProgressRecords } from '../hooks/useProgressRecords';
import { useMonthlyFinancials, type MonthlyFinancialRecord } from '../hooks/useMonthlyFinancials';
import { useBudgetPlanning } from '../hooks/useBudgetPlanning';
import { supabase } from '../lib';

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

  useEffect(() => {
    Promise.all([
      fetchProgressMasters(),
      fetchBudgetPlanning()
    ]).then(() => {
      fetchProgress(currentMonth);
      fetchFinancials(currentMonth);
    }).catch(console.error);
  }, [currentMonth, fetchProgress, fetchProgressMasters, fetchFinancials, fetchBudgetPlanning]);

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
      const { data, error } = await supabase.from('monthly_incentive_allocations').select('year_month').eq('is_confirmed', true);
      if (!error && data && data.length > 0) {
        const dbMonths = data.map(d => d.year_month);
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
          period: currentMonth
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
        { year_month: currentMonth, is_confirmed: true, confirmed_at: new Date().toISOString() },
        { onConflict: 'year_month' }
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
      await supabase.from('monthly_incentive_confirmations').delete().eq('year_month', currentMonth);
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
      { label: TABLE_COLUMNS.PROJECT_ID, rowSpan: 2, width: '90px', sortKey: 'projectCode' },
      { label: TABLE_COLUMNS.PROJECT_NAME, rowSpan: 2, width: '150px', sortKey: 'projectName' },
      { label: '収益　A', colSpan: 3 },
      { label: '費用　B', colSpan: 3 },
      { label: '積立金　C', colSpan: 2 },
      { label: '余剰　A-（B+C）', colSpan: 2 },
    ],
    [
      { label: TABLE_COLUMNS.SUBJECT }, { label: '請求先', width: '120px' }, { label: TABLE_COLUMNS.AMOUNT },
      { label: TABLE_COLUMNS.SUBJECT }, { label: '支払先', width: '120px' }, { label: TABLE_COLUMNS.AMOUNT },
      { label: TABLE_COLUMNS.SUBJECT }, { label: TABLE_COLUMNS.AMOUNT },
      { label: TABLE_COLUMNS.SUBJECT }, { label: TABLE_COLUMNS.AMOUNT }
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
      const recs = allExpenseRecords.filter(r => r.project_id === pid && r.subject === subj);
      let amount = 0;
      if (isOngoing) {
        amount = recs.filter(r => r.period && r.period.startsWith(currentMonth)).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
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
        const pureTaskName = b.subject
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
          taskName: pureTaskName || b.subject,
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
    let hasInternalTasks = false;

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
        hasInternalTasks = true;
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

      const subjectName = `労務費（利用者工賃・${cleanTaskName}）`;

      memberRecords.forEach(m => {
        const customVal = allocationDrafts[m.id];
        laborExpenses.push({
          id: m.id,
          subject: subjectName,
          payee: m.userName,
          amount: customVal !== undefined ? customVal : memberPerPerson,
          type: 'labor',
          isAutoCalculated: false
        });
      });

      outsourceRecords.forEach(o => {
        const customVal = allocationDrafts[o.id];
        laborExpenses.push({
          id: o.id,
          subject: `外注加工費（${cleanTaskName}）`,
          payee: o.userName,
          amount: customVal !== undefined ? customVal : budgetAmount,
          type: 'labor',
          isAutoCalculated: false
        });
      });
    });

    if (hasInternalTasks || totalProjectStaffAlloc > 0 || allocationDrafts[`STAFF_ALLOC_${pid}`] !== undefined) {
      const staffKey = `STAFF_ALLOC_${pid}`;
      const customStaffVal = allocationDrafts[staffKey];

      laborExpenses.push({
        id: staffKey,
        subject: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER,
        payee: '（職員等）',
        amount: customStaffVal !== undefined ? customStaffVal : totalProjectStaffAlloc,
        type: 'labor',
        isAutoCalculated: false
      });
    }

    const materialExpense = nonLaborExpenses.find(e => e.subject === WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL);
    const otherExpense = nonLaborExpenses.find(e => e.subject === WORDS_PROJECT.SUBJECT_EXPENSE_OTHER);
    const restNonLabor = nonLaborExpenses.filter(e => e.subject !== WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL && e.subject !== WORDS_PROJECT.SUBJECT_EXPENSE_OTHER);

    const internalLabor = laborExpenses.filter(e => !e.subject.startsWith('外注加工費'));
    const externalLabor = laborExpenses.filter(e => e.subject.startsWith('外注加工費'));

    const expenses: any[] = [];
    if (materialExpense) expenses.push(materialExpense);
    expenses.push(...internalLabor);
    expenses.push(...externalLabor);
    if (otherExpense) expenses.push(otherExpense);
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
            <tbody><tr><td colSpan={12} className="empty-message">{MESSAGES.EMPTY_PROGRESS_RECORD}</td></tr></tbody>
          ) : (
            displayProjects.map(proj => {
              const maxRows = Math.max(1, proj.revenues.length, proj.expenses.length, proj.reserves.length);
              
              const sumRev = proj.revenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
              const sumExp = proj.expenses.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
              const sumRes = proj.reserves.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
              const totalSurplus = sumRev - sumExp - sumRes;

              const rows = [];

              if (maxRows === 0) {
                rows.push(
                  <tr key={`${proj.id}-total`}>
                    <td style={{ borderBottom: 'none' }}>
                      {proj.code}
                    </td>
                    <td style={{ borderBottom: 'none' }}>
                      {proj.name}
                    </td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)' }}></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <strong>¥{sumRev.toLocaleString()}</strong>
                    </td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)' }}></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <strong>¥{sumExp.toLocaleString()}</strong>
                    </td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <strong>¥{sumRes.toLocaleString()}</strong>
                    </td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums', paddingRight: '8px' }}>
                      <strong style={{ color: totalSurplus !== 0 ? 'var(--color-error)' : 'inherit' }}>
                        ¥{totalSurplus.toLocaleString()}
                      </strong>
                    </td>
                  </tr>
                );
              } else {
                for (let i = 0; i < maxRows; i++) {
                  const rev = proj.revenues[i];
                  const exp = proj.expenses[i];
                  const res = proj.reserves[i];

                  const prevExp = i > 0 ? proj.expenses[i - 1] : null;
                  const nextExp = i < proj.expenses.length - 1 ? proj.expenses[i + 1] : null;
                  const isFirstInSubjectGroup = exp && (!prevExp || prevExp.subject !== exp.subject);
                  const isLastInSubjectGroup = exp && (!nextExp || nextExp.subject !== exp.subject);
  
                  rows.push(
                    <tr key={`proj-${proj.id}-${i}`}>
                    <td style={{ borderBottom: 'none' }}>
                      {i === 0 ? proj.code : ''}
                    </td>
                    <td style={{ borderBottom: 'none' }}>
                      {i === 0 ? proj.name : ''}
                    </td>
                      
                      {/* Revenue */}
                      <td>{rev?.subject || ''}</td>
                      <td>{rev ? (rev.billingDest || <span style={{ color: 'var(--color-text-muted)' }}>(未設定)</span>) : ''}</td>
                      <td className={rev ? (!isConfirmed ? (totalSurplus !== 0 ? 'bg-error-highlight' : 'bg-input-highlight') : undefined) : undefined}>
                        {rev ? <CurrencyInput disabled={isConfirmed} value={rev.amount} onChange={val => handleFinChange(proj.id, 'revenue', rev.subject, val)} /> : null}
                      </td>
  
                      {/* Expense */}
                      <td style={{ borderBottom: (exp && !isLastInSubjectGroup) ? 'none' : undefined }}>
                        {isFirstInSubjectGroup ? exp.subject : ''}
                      </td>
                      <td>{exp?.payee || ''}</td>
                      <td className={exp ? (exp.isAutoCalculated || isConfirmed ? undefined : (totalSurplus !== 0 ? 'bg-error-highlight' : 'bg-input-highlight')) : undefined}>
                        {exp ? (
                          exp.type === 'labor' ? (
                            <CurrencyInput disabled={isConfirmed} value={exp.amount} onChange={val => handleAllocationChange(exp.id, val)} />
                          ) : exp.isAutoCalculated ? (
                            <span style={{ fontVariantNumeric: 'tabular-nums', display: 'block', textAlign: 'right', paddingRight: '4px' }}>
                              ¥{exp.amount.toLocaleString()}
                            </span>
                          ) : (
                            <CurrencyInput disabled={isConfirmed} value={exp.amount} onChange={val => handleFinChange(proj.id, 'expense', exp.subject, val)} />
                          )
                        ) : null}
                      </td>
  
                      {/* Reserve */}
                      <td>{res?.subject || ''}</td>
                      <td className={res ? (!isConfirmed ? (totalSurplus !== 0 ? 'bg-error-highlight' : 'bg-input-highlight') : undefined) : undefined}>
                        {res ? <CurrencyInput disabled={isConfirmed} value={res.amount} onChange={val => handleFinChange(proj.id, 'reserve', res.subject, val)} /> : null}
                      </td>
  
                      {/* Surplus */}
                      <td></td>
                      <td></td>
                    </tr>
                  );
                }
                
                // Add a total row just like BudgetPlanning
                rows.push(
                  <tr key={`proj-${proj.id}-total`}>
                    <td></td>
                    <td></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)' }}></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}><strong>¥{sumRev.toLocaleString()}</strong></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)' }}></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}><strong>¥{sumExp.toLocaleString()}</strong></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}><strong>¥{sumRes.toLocaleString()}</strong></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                    <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums', paddingRight: '8px' }}>
                      <strong style={{ color: totalSurplus !== 0 ? 'var(--color-error)' : 'inherit' }}>¥{totalSurplus.toLocaleString()}</strong>
                    </td>
                  </tr>
                );
              }

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
