import { useState, useEffect, useMemo } from 'react';
import { MonthInput, Pagination, MultiRowHeader, Button, type HeaderCell } from '../components/ui';
import { PAGE_NAMES, MESSAGES } from '../constants';
import { supabase } from '../lib/supabase';
import { getCurrentJSTMonth, getPreviousMonth } from '../utils';
import { useAlert } from '../contexts/AlertContext';

type WageRow = {
  id: string;
  name: string;
  basicWage: number | null; // null for "-"
  incentive: number;
  wageTotal: number;
  dedA: number | null;
  dedB: number | null;
  dedTotal: number;
  payment: number;
};

export function WageSummaryPage() {
  const [data, setData] = useState<WageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => getCurrentJSTMonth());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const { showAlert } = useAlert();

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current && current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  useEffect(() => {
    fetchData(currentMonth);
  }, [currentMonth]);

  const fetchData = async (monthStr: string) => {
    try {
      setLoading(true);
      const prevMonthStr = getPreviousMonth(monthStr);

      const [
        membersRes,
        projectsRes,
        budgetsRes,
        cTaskRes,
        pTaskRes,
        cMemRes
      ] = await Promise.all([
        supabase.from('members').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('projects').select('id, project_type, project_tasks(id, name, is_deleted)').eq('is_deleted', false),
        supabase.from('project_budget_items').select('*').eq('category', 'expense'),
        supabase.from('monthly_task_progress').select('*').eq('year_month', monthStr),
        supabase.from('monthly_task_progress').select('*').eq('year_month', prevMonthStr),
        supabase.from('monthly_member_contributions').select('*').eq('year_month', monthStr)
      ]);

      if (membersRes.error) throw membersRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (budgetsRes.error) throw budgetsRes.error;
      if (cTaskRes.error) throw cTaskRes.error;
      if (pTaskRes.error) throw pTaskRes.error;
      if (cMemRes.error) throw cMemRes.error;

      const members = membersRes.data || [];
      const projects = projectsRes.data || [];
      const budgets = budgetsRes.data || [];
      const cTasks = cTaskRes.data || [];
      const pTasks = pTaskRes.data || [];
      const cMems = cMemRes.data || [];

      const rows: WageRow[] = members.map((member: any) => {
        let incentive = 0;
        const memberContribs = cMems.filter((r: any) => r.member_id === member.id);

        for (const contrib of memberContribs) {
          if (!contrib.task_id || !contrib.contribution_ratio) continue;

          // Find task's project
          const project = projects.find((p: any) => (p.project_tasks || []).some((t: any) => t.id === contrib.task_id));
          if (!project) continue;

          // task budget
          const taskBudgets = budgets.filter((b: any) => b.task_id === contrib.task_id);
          const budgetAmount = taskBudgets.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);

          // progress diff
          const cTask = cTasks.find((r: any) => r.task_id === contrib.task_id);
          const pTask = pTasks.find((r: any) => r.task_id === contrib.task_id);

          let prevProg = pTask ? Number(pTask.current_progress) : 0;
          if (project.project_type === 'ongoing') {
            prevProg = 0; // ongoing project progress resets each month logically, or diff is relative to 0
          }
          const currProg = cTask ? Number(cTask.current_progress) : prevProg;
          
          const diff = currProg - prevProg;
          if (diff > 0) {
            incentive += budgetAmount * (diff / 100) * (Number(contrib.contribution_ratio) / 100);
          }
        }

        const safeIncentive = Math.floor(incentive);
        // 基本工賃、控除項目は「-」とするためnullとする
        const basicWage = null;
        const dedA = null;
        const dedB = null;

        const wageTotal = safeIncentive; // (basicWage or 0) + safeIncentive
        const dedTotal = 0; // (dedA or 0) + (dedB or 0)
        const payment = wageTotal - dedTotal;

        return {
          id: member.id,
          name: member.name,
          basicWage,
          incentive: safeIncentive,
          wageTotal,
          dedA,
          dedB,
          dedTotal,
          payment
        };
      });

      setData(rows);
      setCurrentPage(1);

    } catch (err) {
      console.error('Error fetching wage summary:', err);
      showAlert(MESSAGES.FETCH_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a: any, b: any) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedRows = useMemo(() => {
    return sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [sortedData, currentPage, pageSize]);

  const headerRows: HeaderCell[][] = [
    [
      { label: '氏名', rowSpan: 2, width: '200px', sortKey: 'name' },
      { label: '工賃　A', colSpan: 3 },
      { label: '控除　B', colSpan: 3 },
      { label: '支給額　A-B', rowSpan: 2, width: '150px' }
    ],
    [
      { label: '基本工賃', width: '120px' },
      { label: 'インセンティブ', width: '120px' },
      { label: '合計', width: '120px' },
      { label: '項目A', width: '120px' },
      { label: '項目B', width: '120px' },
      { label: '合計', width: '120px' },
    ]
  ];

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{PAGE_NAMES.WAGE_SUMMARY}</h2>
      </div>

      <div className="table-container">
        <table className="inventory-table">
          <MultiRowHeader rows={headerRows} sortConfig={sortConfig} onSort={handleSort} />
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-message">表示するデータがありません</td>
              </tr>
            ) : (
              paginatedRows.map(row => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {row.basicWage === null ? '-' : `¥${row.basicWage.toLocaleString()}`}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    ¥{row.incentive.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>
                    ¥{row.wageTotal.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {row.dedA === null ? '-' : `¥${row.dedA.toLocaleString()}`}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {row.dedB === null ? '-' : `¥${row.dedB.toLocaleString()}`}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>
                    {row.dedTotal === 0 ? '-' : `¥${row.dedTotal.toLocaleString()}`}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    ¥{row.payment.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="action-bar">
        <div className="filter-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button 
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                const [y, m] = currentMonth.split('-');
                const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                date.setMonth(date.getMonth() - 1);
                const newY = date.getFullYear();
                const newM = (date.getMonth() + 1).toString().padStart(2, '0');
                setCurrentMonth(`${newY}-${newM}`);
              }}
            >
              ＜
            </Button>
            <MonthInput 
              value={currentMonth}
              onChange={setCurrentMonth}
              className="date-filter-pill"
              style={{ width: 'auto', minWidth: '140px' }}
            />
            <Button 
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                const [y, m] = currentMonth.split('-');
                const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                date.setMonth(date.getMonth() + 1);
                const newY = date.getFullYear();
                const newM = (date.getMonth() + 1).toString().padStart(2, '0');
                setCurrentMonth(`${newY}-${newM}`);
              }}
            >
              ＞
            </Button>
            <Button 
              variant="secondary"
              style={{ padding: '0 12px', height: '28px', fontSize: 'var(--text-caption)' }}
              onClick={() => setCurrentMonth(getCurrentJSTMonth())}
              disabled={currentMonth === getCurrentJSTMonth()}
            >
              今月
            </Button>
          </div>
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
