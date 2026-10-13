import { useState, useEffect } from 'react';
import { Button, CurrencyInput, Pagination, Tooltip, MultiRowHeader, RadioButton, type HeaderCell } from '../components/ui';
import { TABLE_COLUMNS, MESSAGES, BUTTON_LABELS, WORDS_PROJECT } from '../constants';
import { isProjectFinished, formatSummaryDescription } from '../utils';

import { useAlert } from '../contexts/AlertContext';

import { useBudgetPlanning, type DetailItem, type ProjectDraft } from '../hooks';

const getExpenseSortOrder = (subject: string): number => {
  if (subject === WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL || subject.startsWith('材料費')) {
    return 1;
  }
  if (subject === WORDS_PROJECT.SUBJECT_EXPENSE_OTHER || subject.startsWith('経費') || subject.startsWith('その他経費')) {
    return 2;
  }
  if (subject.startsWith('外注加工費') || subject === WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE) {
    return 3;
  }
  if (subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER || subject.startsWith('労務費（利用者工賃以外）')) {
    return 4;
  }
  if (subject.startsWith('労務費（利用者工賃') || subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER) {
    return 5;
  }
  return 6;
};

export function BudgetPlanningPage() {
  const { drafts, setDrafts, originalDrafts, loading, fetchBudgetPlanning, batchSaveBudgets } = useBudgetPlanning();
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'code', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const { showAlert } = useAlert();


  useEffect(() => {
    fetchBudgetPlanning().catch(() => {
      showAlert(MESSAGES.FETCH_ERROR, 'error');
    });
  }, [fetchBudgetPlanning, showAlert]);

  const handleBatchSave = async () => {
    try {
      await batchSaveBudgets(drafts);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (error) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleChange = (pIndex: number, category: keyof ProjectDraft, itemIndex: number, newAmount: string | number) => {
    setDrafts(prev => {
      const next = [...prev];
      const draft = { ...next[pIndex] };
      const items = [...(draft[category] as DetailItem[])];
      items[itemIndex] = { ...items[itemIndex], amount: Number(newAmount) || 0 };
      (draft as any)[category] = items;
      next[pIndex] = draft;
      return next;
    });
  };

  const handleProjectTypeChange = (pIndex: number, newType: string) => {
    setDrafts(prev => {
      const next = [...prev];
      const draft = { ...next[pIndex] };
      draft.project = { ...draft.project, projectType: newType as any };
      next[pIndex] = draft;
      return next;
    });
  };

  const isModified = JSON.stringify(drafts) !== JSON.stringify(originalDrafts);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current && current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedDrafts = [...drafts].sort((a, b) => {
    if (!sortConfig) return 0;
    let aVal = '';
    let bVal = '';
    if (sortConfig.key === 'code') {
      aVal = a.project.code || '';
      bVal = b.project.code || '';
    } else if (sortConfig.key === 'name') {
      aVal = a.project.name || '';
      bVal = b.project.name || '';
    } else if (sortConfig.key === 'projectType') {
      aVal = a.project.projectType === 'ongoing' ? '0' : (a.project.projectType === 'その他' ? '2' : '1');
      bVal = b.project.projectType === 'ongoing' ? '0' : (b.project.projectType === 'その他' ? '2' : '1');
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedDrafts.length / pageSize);
  const paginatedDrafts = sortedDrafts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  const headerRows: HeaderCell[][] = [
    [
      { label: TABLE_COLUMNS.PROJECT_ID, width: '90px', sortKey: 'code' },
      { label: TABLE_COLUMNS.PROJECT_NAME, width: '160px', sortKey: 'name' },
      { label: TABLE_COLUMNS.PROJECT_TYPE, width: '150px', sortKey: 'projectType' },
      { label: '取引区分', width: '120px' },
      { label: '勘定科目', width: '220px' },
      { label: '摘要', width: '160px' },
      { label: '金額', width: '120px' },
      { label: '備考', width: '140px' },
      { label: TABLE_COLUMNS.RESTRICTION, width: '50px' },
    ]
  ];

  return (
    <>
      <div className="table-container">
        <table className="inventory-table">
          <MultiRowHeader rows={headerRows} sortConfig={sortConfig} onSort={handleSort} />
          {paginatedDrafts.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={9} className="empty-message">{MESSAGES.EMPTY_BUDGET}</td>
              </tr>
            </tbody>
          ) : (
              paginatedDrafts.map((draft) => {
                const draftIndex = drafts.findIndex(d => d.project.id === draft.project.id);
                const isFinished = isProjectFinished(draft.project);
                const sum = (items: DetailItem[]) => items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                const sumRevenues = sum(draft.revenues);
                const sumExpenses = sum(draft.expenses);
                const sumReserves = sum(draft.reserves);
                const totalSurplus = sumRevenues - (sumExpenses + sumReserves);

                const renderProjectTypeRadio = () => (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', height: '42px' }}>
                    <RadioButton
                      label="毎月"
                      name={`projectType_${draft.project.id}`}
                      value="ongoing"
                      checked={draft.project.projectType === 'ongoing'}
                      onChange={() => handleProjectTypeChange(draftIndex, 'ongoing')}
                      disabled={isFinished}
                    />
                    <RadioButton
                      label="案件終了時"
                      name={`projectType_${draft.project.id}`}
                      value="one-off"
                      checked={draft.project.projectType !== 'ongoing'}
                      onChange={() => handleProjectTypeChange(draftIndex, 'one-off')}
                      disabled={isFinished}
                    />
                  </div>
                );

                type RowItem = {
                  categoryType: 'revenue' | 'expense' | 'reserve' | 'surplus';
                  categoryLabel: string;
                  subject: string;
                  amount: number;
                  summary: string;
                  remarks: string;
                  categoryKey?: 'revenues' | 'expenses' | 'reserves';
                  itemIndex?: number;
                };

                const items: RowItem[] = [];

                draft.revenues.forEach((rev, idx) => {
                  const client = rev.summary || draft.project.clientName;
                  items.push({
                    categoryType: 'revenue',
                    categoryLabel: WORDS_PROJECT.CATEGORY_REVENUE,
                    subject: rev.subject,
                    amount: rev.amount,
                    summary: formatSummaryDescription({ billingDest: client }),
                    remarks: rev.remarks || '-',
                    categoryKey: 'revenues',
                    itemIndex: idx,
                  });
                });

                const sortedExpenses = draft.expenses
                  .map((exp, originalIdx) => ({ exp, originalIdx }))
                  .sort((a, b) => getExpenseSortOrder(a.exp.subject) - getExpenseSortOrder(b.exp.subject));

                sortedExpenses.forEach(({ exp, originalIdx }) => {
                  let displaySubject = exp.subject;
                  let rawTaskName = exp.summary && exp.summary !== '-' ? exp.summary : '';

                  if (displaySubject.startsWith('外注加工費')) {
                    if (!rawTaskName && displaySubject.includes('（')) {
                      const m = displaySubject.match(/^[（\(]?外注加工費[（\(](.*?)[）\)]+$/);
                      if (m) rawTaskName = m[1];
                    }
                    displaySubject = WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE;
                  } else if (displaySubject.startsWith('労務費（利用者工賃以外）')) {
                    displaySubject = WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER;
                  } else if (displaySubject.startsWith('労務費（利用者工賃')) {
                    if (!rawTaskName && displaySubject.includes('・')) {
                      const parts = displaySubject.replace(/[）\)]+$/, '').split('・');
                      if (parts.length > 1) rawTaskName = parts.slice(1).join('・');
                    }
                    displaySubject = WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER;
                  }

                  const isStaff = displaySubject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER;
                  const displaySummary = formatSummaryDescription({
                    task: isStaff ? undefined : rawTaskName,
                    isStaff,
                  });

                  items.push({
                    categoryType: 'expense',
                    categoryLabel: WORDS_PROJECT.CATEGORY_EXPENSE,
                    subject: displaySubject,
                    amount: exp.amount,
                    summary: displaySummary,
                    remarks: exp.remarks || '-',
                    categoryKey: 'expenses',
                    itemIndex: originalIdx,
                  });
                });

                draft.reserves.forEach((res, idx) => {
                  items.push({
                    categoryType: 'reserve',
                    categoryLabel: WORDS_PROJECT.CATEGORY_RESERVE,
                    subject: res.subject,
                    amount: res.amount,
                    summary: res.summary || '-',
                    remarks: res.remarks || '-',
                    categoryKey: 'reserves',
                    itemIndex: idx,
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
                      key={`${draft.project.id}-${rowItem.categoryType}-${idx}`}
                      style={{ backgroundColor: rowBg }}
                    >
                      <td style={{ borderBottom: rowBorderBottom }}>
                        {isFirstRow ? draft.project.code : ''}
                      </td>
                      <td style={{ borderBottom: rowBorderBottom }}>
                        {isFirstRow ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isFinished ? (
                              <Tooltip text="案件終了のため変更不可" as="span">
                                <span>{draft.project.name}</span>
                              </Tooltip>
                            ) : (
                              <span>{draft.project.name}</span>
                            )}
                          </div>
                        ) : ''}
                      </td>
                      <td
                        className={isFirstRow && !isFinished ? "bg-input-highlight" : undefined}
                        style={{ borderBottom: rowBorderBottom }}
                      >
                        {isFirstRow ? renderProjectTypeRadio() : ''}
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
                          !isSurplusRow
                            ? (!isFinished
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
                        {isSurplusRow ? (
                          <strong style={{ color: totalSurplus !== 0 ? 'var(--color-error)' : 'inherit', fontVariantNumeric: 'tabular-nums' }}>
                            ¥{totalSurplus.toLocaleString()}
                          </strong>
                        ) : (
                          <CurrencyInput
                            value={rowItem.amount}
                            onChange={(val) => handleChange(draftIndex, rowItem.categoryKey!, rowItem.itemIndex!, val)}
                            disabled={isFinished}
                          />
                        )}
                      </td>
                      <td style={{ color: isSurplusRow && totalSurplus !== 0 ? 'var(--color-error)' : 'inherit', fontSize: isSurplusRow ? '12px' : undefined }}>
                        {rowItem.remarks}
                      </td>
                      <td className="sticky-right" style={{ textAlign: 'center', borderBottom: rowBorderBottom }}>
                        {isFirstRow && isFinished && (
                          <Tooltip text="案件終了のため変更不可">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                          </Tooltip>
                        )}
                      </td>
                    </tr>
                  );
                });

                if (isFinished) {
                  return (
                    <Tooltip as="tbody" key={draft.project.id} text="案件終了のため変更不可">
                      {rows}
                    </Tooltip>
                  );
                }

                if (totalSurplus !== 0) {
                  return (
                    <Tooltip as="tbody" key={draft.project.id} text="余剰が¥0になるように、金額を調整してください。">
                      {rows}
                    </Tooltip>
                  );
                }
                return <tbody key={draft.project.id} style={{ display: 'contents' }}>{rows}</tbody>;
              })
          )}
        </table>
      </div>

      <div className="action-bar">
        <div className="filter-controls"></div>
        <div className="action-buttons">
          <Button variant="secondary" onClick={() => setDrafts(JSON.parse(JSON.stringify(originalDrafts)))} disabled={!isModified}>
            {BUTTON_LABELS.CANCEL || '取消'}
          </Button>
          <Button variant="primary" onClick={handleBatchSave} disabled={!isModified}>
            {BUTTON_LABELS.SAVE || '確定'}
          </Button>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
}
