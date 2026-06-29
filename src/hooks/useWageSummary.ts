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

      const nextMonthDate = new Date(monthStr + '-01');
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      const nextMonthStr = `${nextMonthDate.getFullYear()}-${(nextMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;

      const [
        membersRes,
        projectsRes,
        budgetsRes,
        cTaskRes,
        pTaskRes,
        cMemRes,
        workRes
      ] = await Promise.all([
        supabase.from('members').select('*, base_wages(wage)').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('projects').select('id, project_type, project_tasks(id, name, is_deleted, is_canceled)').eq('is_deleted', false),
        supabase.from('project_budget_items').select('*').eq('category', 'expense'),
        supabase.from('monthly_task_progress').select('*').eq('year_month', monthStr),
        supabase.from('monthly_task_progress').select('*').eq('year_month', prevMonthStr),
        supabase.from('monthly_member_contributions').select('*').eq('year_month', monthStr),
        supabase.from('daily_work_records').select('member_id, work_time').gte('date', `${monthStr}-01`).lt('date', `${nextMonthStr}-01`)
      ]);

      if (membersRes.error) throw membersRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (budgetsRes.error) throw budgetsRes.error;
      if (cTaskRes.error) throw cTaskRes.error;
      if (pTaskRes.error) throw pTaskRes.error;
      if (cMemRes.error) throw cMemRes.error;
      if (workRes.error) throw workRes.error;

      const members = membersRes.data || [];
      const projects = projectsRes.data || [];
      const budgets = budgetsRes.data || [];
      const cTasks = cTaskRes.data || [];
      const pTasks = pTaskRes.data || [];
      const cMems = cMemRes.data || [];

      const rows: WageRow[] = members.map((member: any) => {
        const memberWorks = workRes.data?.filter((w: any) => w.member_id === member.id) || [];
        const totalWorkTime = memberWorks.reduce((sum: number, w: any) => sum + Number(w.work_time), 0);
        
        let basicWage = null;
        if (member.base_wages && typeof member.base_wages.wage === 'number') {
          basicWage = Math.floor(member.base_wages.wage * totalWorkTime);
        }

        let sumRewardUnitPrice = 0;
        const memberContribs = cMems.filter((r: any) => r.member_id === member.id);

        for (const contrib of memberContribs) {
          if (!contrib.task_id || !contrib.contribution_ratio) continue;

          const project = projects.find((p: any) => (p.project_tasks || []).some((t: any) => t.id === contrib.task_id));
          if (!project) continue;

          // Check if project is "Completed"
          const projectTasks = project.project_tasks || [];
          const activeTasks = projectTasks.filter((t: any) => !t.is_deleted && !t.is_canceled);
          
          if (activeTasks.length === 0) continue;
          
          const allCompleted = activeTasks.every((t: any) => {
            const cTask = cTasks.find((r: any) => r.task_id === t.id);
            const prog = cTask ? Number(cTask.current_progress) : 0;
            return prog === 100;
          });

          if (!allCompleted) continue;

          // Calculate 報酬単価 (Reward Unit Price) for this task
          const taskBudgets = budgets.filter((b: any) => b.task_id === contrib.task_id);
          const taskLaborBudget = taskBudgets.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);

          const allTaskContribs = cMems.filter((r: any) => r.task_id === contrib.task_id);
          const totalRatio = allTaskContribs.reduce((sum: number, r: any) => sum + (Number(r.contribution_ratio) || 0), 0);
          
          let alloc = 0;
          if (totalRatio > 0) {
            const ratio = Number(contrib.contribution_ratio) || 0;
            alloc = Math.floor(taskLaborBudget * (ratio / totalRatio));
          }

          const ded = Number(contrib.deduction_amount) || 0;
          const unitPrice = alloc - ded;

          sumRewardUnitPrice += unitPrice;
        }

        const calculatedIncentive = sumRewardUnitPrice - (basicWage || 0);
        const safeIncentive = Math.floor(Math.max(0, calculatedIncentive));

        const dedA = null;
        const dedB = null;

        const wageTotal = (basicWage || 0) + safeIncentive;
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
