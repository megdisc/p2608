import { useState, useEffect } from 'react';
import { Button, CurrencyInput, Pagination, Tooltip, MultiRowHeader, RadioButton, type HeaderCell } from '../components/ui';
import { TABLE_COLUMNS, MESSAGES, WORDS_PROJECT, BUTTON_LABELS } from '../constants';
import { isProjectFinished } from '../utils';

import { useAlert } from '../contexts/AlertContext';

import { useBudgetPlanning, type DetailItem, type ProjectDraft } from '../hooks';

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
      { label: TABLE_COLUMNS.PROJECT_ID, rowSpan: 2, width: '90px', sortKey: 'code' },
      { label: TABLE_COLUMNS.PROJECT_NAME, rowSpan: 2, width: '150px', sortKey: 'name' },
      { label: TABLE_COLUMNS.PROJECT_TYPE, rowSpan: 2, width: '160px', sortKey: 'projectType' },
      { label: '収益　A', colSpan: 2 },
      { label: '費用　B', colSpan: 2 },
      { label: '積立金　C', colSpan: 2 },
      { label: '余剰　A-（B+C）', colSpan: 2 },
      { label: TABLE_COLUMNS.RESTRICTION, rowSpan: 2, width: '60px' },
    ],
    [
      { label: TABLE_COLUMNS.SUBJECT },
      { label: TABLE_COLUMNS.AMOUNT },
      { label: TABLE_COLUMNS.SUBJECT },
      { label: TABLE_COLUMNS.AMOUNT },
      { label: TABLE_COLUMNS.SUBJECT },
      { label: TABLE_COLUMNS.AMOUNT },
      { label: TABLE_COLUMNS.SUBJECT },
      { label: TABLE_COLUMNS.AMOUNT },
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
                <td colSpan={12} className="empty-message">{MESSAGES.EMPTY_BUDGET}</td>
              </tr>
            </tbody>
          ) : (
              paginatedDrafts.map((draft) => {
                const draftIndex = drafts.findIndex(d => d.project.id === draft.project.id);
                const isFinished = isProjectFinished(draft.project);
                const maxRows = Math.max(draft.revenues.length, draft.expenses.length, draft.reserves.length);
                const sum = (items: DetailItem[]) => items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                const sumRevenues = sum(draft.revenues);
                const sumExpenses = sum(draft.expenses);
                const sumReserves = sum(draft.reserves);
                const totalSurplus = sumRevenues - (sumExpenses + sumReserves);

                const rows = [];

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

                if (maxRows === 0) {
                  rows.push(
                    <tr key={`${draft.project.id}-total`}>
                      <td>
                        {draft.project.code}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isFinished ? (
                            <Tooltip text="案件終了のため変更不可" as="span">
                              <span>{draft.project.name}</span>
                            </Tooltip>
                          ) : (
                            <span>{draft.project.name}</span>
                          )}
                        </div>
                      </td>
                      <td className={isFinished ? undefined : "bg-input-highlight"}>
                        {renderProjectTypeRadio()}
                      </td>
                      <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <strong>¥{sumRevenues.toLocaleString()}</strong>
                      </td>
                      <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <strong>¥{sumExpenses.toLocaleString()}</strong>
                      </td>
                      <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <strong>¥{sumReserves.toLocaleString()}</strong>
                      </td>
                      <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ 
                        backgroundColor: 'var(--color-bg-subtle, #f9fafb)',
                        fontWeight: 'bold', 
                        WebkitTextStroke: '0.5px currentColor', 
                        textAlign: 'right', 
                        fontVariantNumeric: 'tabular-nums', 
                        paddingRight: '8px'
                      }}>
                        <strong style={{ color: totalSurplus !== 0 ? 'var(--color-error)' : 'inherit' }}>
                          ¥{totalSurplus.toLocaleString()}
                        </strong>
                      </td>
                      <td className="sticky-right" style={{ textAlign: 'center' }}>
                        {isFinished && (
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
                } else {
                  // Details
                  for (let i = 0; i < maxRows; i++) {
                    const rev = draft.revenues[i];
                    const exp = draft.expenses[i];
                    const res = draft.reserves[i];
                    rows.push(
                      <tr key={`${draft.project.id}-detail-${i}`}>
                            <td style={{ borderBottom: 'none' }}>
                              {i === 0 ? draft.project.code : ''}
                            </td>
                            <td style={{ borderBottom: 'none' }}>
                              {i === 0 ? (
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
                            <td className={isFinished ? undefined : "bg-input-highlight"} style={{ borderBottom: 'none' }}>
                              {i === 0 ? renderProjectTypeRadio() : ''}
                            </td>
                        <td>{rev?.subject || ''}</td>
                        <td className={rev ? (!isFinished ? (totalSurplus !== 0 ? 'bg-error-highlight' : 'bg-input-highlight') : undefined) : undefined}>
                          {rev ? (
                            <CurrencyInput
                              value={rev.amount}
                              onChange={(val) => handleChange(draftIndex, 'revenues', i, val)}
                              disabled={isFinished}
                            />
                          ) : null}
                        </td>
                        <td>{exp?.subject || ''}</td>
                        <td className={exp ? (!isFinished ? (totalSurplus !== 0 ? 'bg-error-highlight' : 'bg-input-highlight') : undefined) : undefined}>
                          {exp ? (
                            <CurrencyInput
                              value={exp.amount}
                              onChange={(val) => handleChange(draftIndex, 'expenses', i, val)}
                              disabled={isFinished}
                            />
                          ) : null}
                        </td>
                        <td>{res?.subject || ''}</td>
                        <td className={res ? (!isFinished ? (totalSurplus !== 0 ? 'bg-error-highlight' : 'bg-input-highlight') : undefined) : undefined}>
                          {res ? (
                            <CurrencyInput
                              value={res.amount}
                              onChange={(val) => handleChange(draftIndex, 'reserves', i, val)}
                              disabled={isFinished}
                            />
                          ) : null}
                        </td>
                        <td></td>
                        <td></td>
                        <td className="sticky-right" style={{ textAlign: 'center', borderBottom: 'none' }}>
                          {i === 0 && isFinished && (
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
                  }

                  // Total
                  rows.push(
                    <tr key={`${draft.project.id}-total`}>
                      <td></td>
                      <td></td>
                      <td className={isFinished ? undefined : "bg-input-highlight"}></td>
                      <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <strong>¥{sumRevenues.toLocaleString()}</strong>
                      </td>
                      <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <strong>¥{sumExpenses.toLocaleString()}</strong>
                      </td>
                      <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <strong>¥{sumReserves.toLocaleString()}</strong>
                      </td>
                      <td style={{ backgroundColor: 'var(--color-bg-subtle, #f9fafb)', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ 
                        backgroundColor: 'var(--color-bg-subtle, #f9fafb)',
                        fontWeight: 'bold', 
                        WebkitTextStroke: '0.5px currentColor', 
                        textAlign: 'right', 
                        fontVariantNumeric: 'tabular-nums', 
                        paddingRight: '8px'
                      }}>
                        <strong style={{ color: totalSurplus !== 0 ? 'var(--color-error)' : 'inherit' }}>
                          ¥{totalSurplus.toLocaleString()}
                        </strong>
                      </td>
                      <td className="sticky-right" style={{ textAlign: 'center' }}></td>
                    </tr>
                  );
                }

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
