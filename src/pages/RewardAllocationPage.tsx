import { useState, useEffect, useMemo } from 'react';
import { Button, CurrencyInput, MultiRowHeader, type HeaderCell, Tooltip } from '../components/ui';
import { TABLE_COLUMNS, MESSAGES, BUTTON_LABELS, WORDS_PROJECT } from '../constants';
import { useAlert } from '../contexts';
import { useProgressRecords } from '../hooks/useProgressRecords';
import { useMonthlyFinancials, type MonthlyFinancialRecord } from '../hooks/useMonthlyFinancials';
import { useBudgetPlanning } from '../hooks/useBudgetPlanning';

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

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'projectType', direction: 'asc' });

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
    const allocs: Record<string, number> = {};
    progressRecords.forEach(r => {
      if (r.userId) {
        allocs[r.id] = r.allocationAmount || 0;
      }
    });
    setAllocationDrafts(allocs);
  }, [progressRecords]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) setCurrentMonth(e.target.value);
  };

  const handleFinChange = (projectId: string, type: 'revenue' | 'expense' | 'reserve', subject: string, value: string | number) => {
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
    setAllocationDrafts(prev => ({ ...prev, [id]: Number(value) || 0 }));
  };

  const isAutoCalculatedSubject = (subject: string) => {
    return subject === WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL || subject === WORDS_PROJECT.SUBJECT_EXPENSE_OTHER;
  };

  const isModified = useMemo(() => {
    for (const f of financialDrafts) {
      if (isAutoCalculatedSubject(f.subject)) continue;
      const orig = financials.find(o => o.id === f.id);
      if (!orig && f.amount !== 0) return true;
      if (orig && orig.amount !== f.amount) return true;
    }
    for (const f of financials) {
      if (isAutoCalculatedSubject(f.subject)) continue;
      if (!financialDrafts.find(d => d.id === f.id)) return true;
    }
    for (const r of progressRecords) {
      if (r.userId) {
        if ((allocationDrafts[r.id] || 0) !== (r.allocationAmount || 0)) return true;
      }
    }
    return false;
  }, [financialDrafts, financials, allocationDrafts, progressRecords]);

  const handleBatchSave = async () => {
    try {
      const upsertFin = financialDrafts.filter(f => 
        !isAutoCalculatedSubject(f.subject) &&
        (!f.id.startsWith('TEMP') || f.amount > 0)
      );
      await saveFinancials(upsertFin, []);
      
      const modifiedProgressRecords = progressRecords.map(r => ({
        ...r,
        allocationAmount: allocationDrafts[r.id] !== undefined ? allocationDrafts[r.id] : r.allocationAmount
      }));
      await batchSaveProgressRecords(modifiedProgressRecords, []);
      
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
      await fetchFinancials(currentMonth);
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleCancel = () => {
    setFinancialDrafts(JSON.parse(JSON.stringify(financials)));
    const allocs: Record<string, number> = {};
    progressRecords.forEach(r => {
      if (r.userId) allocs[r.id] = r.allocationAmount || 0;
    });
    setAllocationDrafts(allocs);
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
      { label: TABLE_COLUMNS.PROJECT_TYPE, rowSpan: 2, width: '80px', sortKey: 'projectType' },
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
    const projFin = financialDrafts.filter(f => f.project_id === pid);
    const firstRec = projRecords[0];
    const budgetDraft = budgetDrafts.find(b => b.project.id === pid);
    const projDbInfo = dbProjects.find(p => p.id === pid);
    const clientName = dbClients.find(c => c.id === projDbInfo?.customerId)?.name || '';
    const isOngoing = projDbInfo?.projectType === 'ongoing';
    
    const revenues = (budgetDraft?.revenues || []).map(b => {
      const actual = projFin.find(f => f.type === 'revenue' && f.subject === b.subject);
      return {
        subject: b.subject,
        billingDest: clientName,
        amount: actual?.amount || 0
      };
    });

    const nonLaborExpenses = (budgetDraft?.expenses || [])
      .filter(b => !b.taskId)
      .map(b => {
        const isAuto = isAutoCalculatedSubject(b.subject);
        let amount = 0;
        if (isAuto) {
          const recs = allExpenseRecords.filter(r => r.project_id === pid && r.subject === b.subject);
          if (isOngoing) {
            amount = recs.filter(r => r.period && r.period.startsWith(currentMonth)).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
          } else {
            amount = recs.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
          }
        } else {
          const actual = projFin.find(f => f.type === 'expense' && f.subject === b.subject);
          amount = actual?.amount || 0;
        }

        return {
          id: b.subject,
          subject: b.subject,
          payee: '',
          amount,
          type: 'non-labor',
          isAutoCalculated: isAuto
        };
      });

    // Ensure material & expense subjects are included if recorded in financial_records
    const existingSubjects = new Set(nonLaborExpenses.map(e => e.subject));
    [WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL, WORDS_PROJECT.SUBJECT_EXPENSE_OTHER].forEach(subj => {
      if (!existingSubjects.has(subj)) {
        const recs = allExpenseRecords.filter(r => r.project_id === pid && r.subject === subj);
        let amount = 0;
        if (isOngoing) {
          amount = recs.filter(r => r.period && r.period.startsWith(currentMonth)).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        } else {
          amount = recs.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        }
        if (amount > 0) {
          nonLaborExpenses.push({
            id: subj,
            subject: subj,
            payee: '',
            amount,
            type: 'non-labor',
            isAutoCalculated: true
          });
        }
      }
    });

    const laborExpenses = projRecords.filter(r => r.userId).map(r => {
      return {
        id: r.id, 
        subject: r.assigneeType === '外注先' ? `外注加工費（${r.taskName}）` : `労務費（${r.taskName}）`,
        payee: r.userName,
        amount: allocationDrafts[r.id] || 0,
        type: 'labor',
        isAutoCalculated: false
      };
    });

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
      const actual = projFin.find(f => f.type === 'reserve' && f.subject === b.subject);
      return {
        subject: b.subject,
        amount: actual?.amount || 0
      };
    });

    const [yearStr, monthStr] = currentMonth.split('-');
    const formattedProjectName = (isOngoing && yearStr && monthStr) 
      ? `${firstRec.projectName}（${yearStr}年${monthStr}月分）`
      : firstRec.projectName;

    return {
      id: pid,
      name: formattedProjectName,
      yomigana: firstRec.projectYomigana,
      projectType: firstRec.projectType,
      projectTypeSortKey: firstRec.projectTypeSortKey,
      revenues,
      expenses,
      reserves
    };
  });

  displayProjects.sort((a, b) => {
    if (!sortConfig) return 0;
    let aVal = ''; let bVal = '';
    if (sortConfig.key === 'projectType') {
      aVal = a.projectTypeSortKey; bVal = b.projectTypeSortKey;
    } else if (sortConfig.key === 'projectName') {
      aVal = a.yomigana || a.name; bVal = b.yomigana || b.name;
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
                      {proj.projectType === 'その他' ? 'その他' : (proj.projectType === 'ongoing' ? WORDS_PROJECT.PROJECT_TYPE_ONGOING : WORDS_PROJECT.PROJECT_TYPE_ONE_OFF)}
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
  
                  rows.push(
                    <tr key={`proj-${proj.id}-${i}`}>
                      <td style={{ borderBottom: 'none' }}>
                        {i === 0 ? (proj.projectType === 'その他' ? 'その他' : (proj.projectType === 'ongoing' ? WORDS_PROJECT.PROJECT_TYPE_ONGOING : WORDS_PROJECT.PROJECT_TYPE_ONE_OFF)) : ''}
                      </td>
                      <td style={{ borderBottom: 'none' }}>
                        {i === 0 ? proj.name : ''}
                      </td>
                      
                      {/* Revenue */}
                      <td>{rev?.subject || ''}</td>
                      <td>{rev ? (rev.billingDest || <span style={{ color: 'var(--color-text-muted)' }}>(未設定)</span>) : ''}</td>
                      <td className={rev ? (totalSurplus !== 0 ? 'bg-error-highlight' : 'bg-input-highlight') : undefined}>
                        {rev ? <CurrencyInput value={rev.amount} onChange={val => handleFinChange(proj.id, 'revenue', rev.subject, val)} /> : null}
                      </td>
  
                      {/* Expense */}
                      <td>{exp?.subject || ''}</td>
                      <td>{exp?.payee || ''}</td>
                      <td className={exp ? (exp.isAutoCalculated ? undefined : (totalSurplus !== 0 ? 'bg-error-highlight' : 'bg-input-highlight')) : undefined}>
                        {exp ? (
                          exp.type === 'labor' ? (
                            <CurrencyInput value={exp.amount} onChange={val => handleAllocationChange(exp.id, val)} />
                          ) : exp.isAutoCalculated ? (
                            <span style={{ fontVariantNumeric: 'tabular-nums', display: 'block', textAlign: 'right', paddingRight: '4px' }}>
                              ¥{exp.amount.toLocaleString()}
                            </span>
                          ) : (
                            <CurrencyInput value={exp.amount} onChange={val => handleFinChange(proj.id, 'expense', exp.subject, val)} />
                          )
                        ) : null}
                      </td>
  
                      {/* Reserve */}
                      <td>{res?.subject || ''}</td>
                      <td className={res ? (totalSurplus !== 0 ? 'bg-error-highlight' : 'bg-input-highlight') : undefined}>
                        {res ? <CurrencyInput value={res.amount} onChange={val => handleFinChange(proj.id, 'reserve', res.subject, val)} /> : null}
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

              if (totalSurplus !== 0) {
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
          <input
            type="month"
            value={currentMonth}
            onChange={handleMonthChange}
            className="date-filter-pill"
          />
        </div>
        <div className="action-buttons">
          <Button variant="secondary" onClick={handleCancel} disabled={!isModified}>
            {BUTTON_LABELS.CANCEL || '取消'}
          </Button>
          <Button variant="primary" onClick={handleBatchSave} disabled={!isModified}>
            {BUTTON_LABELS.SAVE || '確定'}
          </Button>
        </div>
        <div style={{ flex: 1 }}></div>
      </div>
    </>
  );
}
