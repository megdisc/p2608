import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib';
import { getCurrentJSTMonth, getPreviousMonth } from '../utils';

export type WageRow = {
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

export function useWageSummary() {
  const [data, setData] = useState<WageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => getCurrentJSTMonth());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

  const fetchWageSummary = useCallback(async (monthStr: string) => {
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

          const project = projects.find((p: any) => (p.project_tasks || []).some((t: any) => t.id === contrib.task_id));
          if (!project) continue;

          const taskBudgets = budgets.filter((b: any) => b.task_id === contrib.task_id);
          const budgetAmount = taskBudgets.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);

          const cTask = cTasks.find((r: any) => r.task_id === contrib.task_id);
          const pTask = pTasks.find((r: any) => r.task_id === contrib.task_id);

          let prevProg = pTask ? Number(pTask.current_progress) : 0;
          if (project.project_type === 'ongoing') {
            prevProg = 0;
          }
          const currProg = cTask ? Number(cTask.current_progress) : prevProg;
          
          const diff = currProg - prevProg;
          if (diff > 0) {
            incentive += budgetAmount * (diff / 100) * (Number(contrib.contribution_ratio) / 100);
          }
        }

        const safeIncentive = Math.floor(incentive);
        const basicWage = null;
        const dedA = null;
        const dedB = null;

        const wageTotal = safeIncentive;
        const dedTotal = 0;
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
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSort = useCallback((key: string) => {
    setSortConfig(current => {
      if (current && current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

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

  return {
    data,
    loading,
    currentMonth,
    setCurrentMonth,
    currentPage,
    setCurrentPage,
    sortConfig,
    handleSort,
    fetchWageSummary,
    sortedData,
    totalPages,
    paginatedRows,
    pageSize
  };
}
