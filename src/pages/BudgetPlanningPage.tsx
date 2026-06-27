import { useState, useEffect } from 'react';
import { Button, CurrencyInput, Pagination, Tooltip, MultiRowHeader, type HeaderCell } from '../components/ui';
import { PAGE_NAMES, TABLE_COLUMNS, MESSAGES, WORDS_PROJECT, BUTTON_LABELS } from '../constants';
import { useAlert } from '../contexts/AlertContext';
import { useBudgetPlanning, type DetailItem, type ProjectDraft } from '../hooks';

export function BudgetPlanningPage() {
  const { drafts, setDrafts, originalDrafts, loading, fetchBudgetPlanning, batchSaveBudgets } = useBudgetPlanning();
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'projectType', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
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
    if (sortConfig.key === 'projectType') {
      aVal = a.project.projectType === 'ongoing' ? '0' : '1';
      bVal = b.project.projectType === 'ongoing' ? '0' : '1';
    } else if (sortConfig.key === 'name') {
      aVal = a.project.yomigana || a.project.name || '';
      bVal = b.project.yomigana || b.project.name || '';
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
      { label: TABLE_COLUMNS.PROJECT_TYPE, rowSpan: 2, width: '80px', sortKey: 'projectType' },
      { label: TABLE_COLUMNS.PROJECT_NAME, rowSpan: 2, width: '150px', sortKey: 'name' },
      { label: '収益　A', colSpan: 2 },
      { label: '費用　B', colSpan: 2 },
      { label: '積立金　C', colSpan: 2 },
      { label: '余剰　A-（B+C）', colSpan: 2 },
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{PAGE_NAMES.BUDGET_PLANNING}</h2>
      </div>

      <div className="table-container">
        <table className="inventory-table">
          <MultiRowHeader rows={headerRows} sortConfig={sortConfig} onSort={handleSort} />
          {paginatedDrafts.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={10} className="empty-message">{MESSAGES.EMPTY_BUDGET}</td>
              </tr>
            </tbody>
          ) : (
              paginatedDrafts.map((draft) => {
                const draftIndex = drafts.findIndex(d => d.project.id === draft.project.id);
                const maxRows = Math.max(draft.revenues.length, draft.expenses.length, draft.reserves.length);
                const sum = (items: DetailItem[]) => items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                const sumRevenues = sum(draft.revenues);
                const sumExpenses = sum(draft.expenses);
                const sumReserves = sum(draft.reserves);
                const totalSurplus = sumRevenues - (sumExpenses + sumReserves);

                const rows = [];

                if (maxRows === 0) {
                  rows.push(
                    <tr
                      key={`${draft.project.id}-total`}
                      onMouseEnter={() => setHoveredProjectId(draft.project.id)}
                      onMouseLeave={() => setHoveredProjectId(null)}
                    >
                      <td rowSpan={1} style={{ verticalAlign: 'top', backgroundColor: hoveredProjectId === draft.project.id ? 'var(--color-bg-subtle)' : undefined, transition: 'background-color 0.2s' }}>
                        {draft.project.projectType === 'ongoing' ? '継続' : '単発'}
                      </td>
                      <td rowSpan={1} style={{ verticalAlign: 'top', backgroundColor: hoveredProjectId === draft.project.id ? 'var(--color-bg-subtle)' : undefined, transition: 'background-color 0.2s' }}>
                        {draft.project.name}
                      </td>
                      <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <strong>¥{sumRevenues.toLocaleString()}</strong>
                      </td>
                      <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <strong>¥{sumExpenses.toLocaleString()}</strong>
                      </td>
                      <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <strong>¥{sumReserves.toLocaleString()}</strong>
                      </td>
                      <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ 
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
                    </tr>
                  );
                } else {
                  // Details
                  for (let i = 0; i < maxRows; i++) {
                    const rev = draft.revenues[i];
                    const exp = draft.expenses[i];
                    const res = draft.reserves[i];
                    rows.push(
                      <tr
                        key={`${draft.project.id}-detail-${i}`}
                        onMouseEnter={() => setHoveredProjectId(draft.project.id)}
                        onMouseLeave={() => setHoveredProjectId(null)}
                      >
                        {i === 0 && (
                          <>
                            <td rowSpan={maxRows + 1} style={{ verticalAlign: 'top', backgroundColor: hoveredProjectId === draft.project.id ? 'var(--color-bg-subtle)' : undefined, transition: 'background-color 0.2s' }}>
                              {draft.project.projectType === 'ongoing' ? '継続' : '単発'}
                            </td>
                            <td rowSpan={maxRows + 1} style={{ verticalAlign: 'top', backgroundColor: hoveredProjectId === draft.project.id ? 'var(--color-bg-subtle)' : undefined, transition: 'background-color 0.2s' }}>
                              {draft.project.name}
                            </td>
                          </>
                        )}
                        <td>{rev?.subject || ''}</td>
                        <td style={{ backgroundColor: rev ? (totalSurplus !== 0 ? 'var(--palette-red-300)' : 'var(--color-bg-input-highlight)') : undefined }}>
                          {rev ? (
                            <CurrencyInput
                              value={rev.amount}
                              onChange={(val) => handleChange(draftIndex, 'revenues', i, val)}
                            />
                          ) : null}
                        </td>
                        <td>{exp?.subject || ''}</td>
                        <td style={{ backgroundColor: exp ? (totalSurplus !== 0 ? 'var(--palette-red-300)' : 'var(--color-bg-input-highlight)') : undefined }}>
                          {exp ? (
                            <CurrencyInput
                              value={exp.amount}
                              onChange={(val) => handleChange(draftIndex, 'expenses', i, val)}
                            />
                          ) : null}
                        </td>
                        <td>{res?.subject || ''}</td>
                        <td style={{ backgroundColor: res ? (totalSurplus !== 0 ? 'var(--palette-red-300)' : 'var(--color-bg-input-highlight)') : undefined }}>
                          {res ? (
                            <CurrencyInput
                              value={res.amount}
                              onChange={(val) => handleChange(draftIndex, 'reserves', i, val)}
                            />
                          ) : null}
                        </td>
                        <td></td>
                        <td></td>
                      </tr>
                    );
                  }

                  // Total
                  rows.push(
                    <tr
                      key={`${draft.project.id}-total`}
                      onMouseEnter={() => setHoveredProjectId(draft.project.id)}
                      onMouseLeave={() => setHoveredProjectId(null)}
                    >
                      <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <strong>¥{sumRevenues.toLocaleString()}</strong>
                      </td>
                      <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <strong>¥{sumExpenses.toLocaleString()}</strong>
                      </td>
                      <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <strong>¥{sumReserves.toLocaleString()}</strong>
                      </td>
                      <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}><strong>{WORDS_PROJECT.TOTAL}</strong></td>
                      <td style={{ 
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
                    </tr>
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
