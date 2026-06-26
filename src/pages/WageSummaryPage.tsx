import { useState, useEffect, useMemo } from 'react';
import { MonthInput, Pagination } from '../components/ui';
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
  const { showAlert } = useAlert();

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

  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedRows = useMemo(() => {
    return data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [data, currentPage, pageSize]);

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{PAGE_NAMES.WAGE_SUMMARY}</h2>
      </div>

      <div className="table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: '200px' }}>氏名</th>
              <th colSpan={3} style={{ textAlign: 'center' }}>工賃　A</th>
              <th colSpan={3} style={{ textAlign: 'center' }}>控除　B</th>
              <th rowSpan={2} style={{ width: '150px', textAlign: 'right' }}>支給額　A-B</th>
            </tr>
            <tr>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px', textAlign: 'right', width: '120px' }}>基本工賃</th>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px', textAlign: 'right', width: '120px' }}>インセンティブ</th>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px', textAlign: 'right', width: '120px' }}>合計</th>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px', textAlign: 'right', width: '120px' }}>項目A</th>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px', textAlign: 'right', width: '120px' }}>項目B</th>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px', textAlign: 'right', width: '120px' }}>合計</th>
            </tr>
          </thead>
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
          <MonthInput value={currentMonth} onChange={setCurrentMonth} />
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
