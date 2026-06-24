import { useState, useEffect } from 'react';
import { Button, CurrencyInput, Pagination, Tooltip } from '../components/ui';
import type { ProjectItem, BudgetCategory } from '../types';
import { PAGE_NAMES, TABLE_COLUMNS, MESSAGES, WORDS_PROJECT, BUTTON_LABELS } from '../constants';
import { supabase } from '../lib/supabase';

type DetailItem = {
  id?: string;
  subject: string;
  taskId?: string;
  amount: number;
};

type ProjectDraft = {
  project: ProjectItem;
  revenues: DetailItem[];
  expenses: DetailItem[];
  reserves: DetailItem[];
};

export function BudgetPlanningPage() {
  const [drafts, setDrafts] = useState<ProjectDraft[]>([]);
  const [originalDrafts, setOriginalDrafts] = useState<ProjectDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'projectType', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id, name, yomigana, project_type,
          project_tasks(id, name, yomigana, is_deleted)
        `)
        .eq('is_deleted', false)
        .order('yomigana');

      if (projectsError) throw projectsError;

      const { data: budgetsData, error: budgetsError } = await supabase
        .from('project_budget_items')
        .select('*');

      if (budgetsError) throw budgetsError;

      const items = (budgetsData as any[]) || [];

      const initialDrafts: ProjectDraft[] = (projectsData as any[]).map(p => {
        const pItems = items.filter(b => b.project_id === p.id);

        // Build revenues
        const revSubjects = [WORDS_PROJECT.SUBJECT_REVENUE_SALES, WORDS_PROJECT.SUBJECT_REVENUE_OTHER];
        const revenues = revSubjects.map(subj => {
          const dbItem = pItems.find(b => b.category === 'revenue' && b.subject === subj);
          return { id: dbItem?.id, subject: subj, amount: dbItem?.amount || 0 };
        });

        // Build expenses
        const activeTasks = (p.project_tasks || []).filter((t: any) => !t.is_deleted);
        const expSubjects = activeTasks.map((t: any) => ({
          subject: `${WORDS_PROJECT.SUBJECT_EXPENSE_LABOR}（${t.name}）`,
          taskId: t.id
        }));
        expSubjects.push({ subject: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER, taskId: undefined });

        const expenses = expSubjects.map(es => {
          let dbItem;
          if (es.taskId) {
            dbItem = pItems.find(b => b.category === 'expense' && b.task_id === es.taskId);
          } else {
            dbItem = pItems.find(b => b.category === 'expense' && b.subject === es.subject && !b.task_id);
          }
          return { id: dbItem?.id, subject: es.subject, taskId: es.taskId, amount: dbItem?.amount || 0 };
        });

        // Build reserves
        const resSubjects = [WORDS_PROJECT.SUBJECT_RESERVE_WAGE, WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT];
        const reserves = resSubjects.map(subj => {
          const dbItem = pItems.find(b => b.category === 'reserve' && b.subject === subj);
          return { id: dbItem?.id, subject: subj, amount: dbItem?.amount || 0 };
        });

        return {
          project: {
            id: p.id,
            name: p.name,
            yomigana: p.yomigana,
            projectType: p.project_type,
            startDate: '',
            endDate: null,
            tasks: []
          },
          revenues,
          expenses,
          reserves
        };
      });

      setDrafts(initialDrafts);
      setOriginalDrafts(JSON.parse(JSON.stringify(initialDrafts)));
    } catch (error) {
      console.error('Error fetching budget data:', error);
      alert(MESSAGES.FETCH_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSave = async () => {
    try {
      setLoading(true);
      const upserts: any[] = [];

      for (const draft of drafts) {
        const processCategory = (items: DetailItem[], category: BudgetCategory) => {
          for (const item of items) {
            upserts.push({
              id: item.id || undefined,
              project_id: draft.project.id,
              category,
              subject: item.subject,
              task_id: item.taskId || null,
              amount: Number(item.amount) || 0
            });
          }
        };

        processCategory(draft.revenues, 'revenue');
        processCategory(draft.expenses, 'expense');
        processCategory(draft.reserves, 'reserve');
      }

      // Upsert
      for (const payload of upserts) {
        if (payload.id) {
          const { error } = await supabase.from('project_budget_items').update({ amount: payload.amount }).eq('id', payload.id);
          if (error) throw error;
        } else {
          const { id, ...insertPayload } = payload;
          const { error } = await supabase.from('project_budget_items').insert(insertPayload);
          if (error) throw error;
        }
      }

      await fetchData();
      alert(MESSAGES.SAVE_SUCCESS);
    } catch (error) {
      console.error('Error saving budget data:', error);
      alert(MESSAGES.SAVE_ERROR);
    } finally {
      setLoading(false);
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

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{PAGE_NAMES.BUDGET_PLANNING}</h2>
      </div>

      <div className="table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: '80px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('projectType')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {TABLE_COLUMNS.PROJECT_TYPE}
                  <span style={{ fontSize: 'var(--text-caption)', color: sortConfig?.key === 'projectType' ? 'inherit' : 'var(--color-border)', transition: 'color 0.2s' }}>
                    {sortConfig?.key === 'projectType' && sortConfig.direction === 'desc' ? '▼' : '▲'}
                  </span>
                </div>
              </th>
              <th rowSpan={2} style={{ width: '150px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {TABLE_COLUMNS.PROJECT_NAME}
                  <span style={{ fontSize: 'var(--text-caption)', color: sortConfig?.key === 'name' ? 'inherit' : 'var(--color-border)', transition: 'color 0.2s' }}>
                    {sortConfig?.key === 'name' && sortConfig.direction === 'desc' ? '▼' : '▲'}
                  </span>
                </div>
              </th>
              <th colSpan={2} style={{ textAlign: 'left' }}>収益　A</th>
              <th colSpan={2} style={{ textAlign: 'left' }}>費用　B</th>
              <th colSpan={2} style={{ textAlign: 'left' }}>積立金　C</th>
              <th colSpan={2} style={{ textAlign: 'left' }}>余剰　A-（B+C）</th>
            </tr>
            <tr>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px' }}>{TABLE_COLUMNS.SUBJECT}</th>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px' }}>{TABLE_COLUMNS.AMOUNT}</th>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px' }}>{TABLE_COLUMNS.SUBJECT}</th>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px' }}>{TABLE_COLUMNS.AMOUNT}</th>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px' }}>{TABLE_COLUMNS.SUBJECT}</th>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px' }}>{TABLE_COLUMNS.AMOUNT}</th>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px' }}>{TABLE_COLUMNS.SUBJECT}</th>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px' }}>{TABLE_COLUMNS.AMOUNT}</th>
            </tr>
          </thead>
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
