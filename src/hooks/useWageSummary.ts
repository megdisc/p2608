import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib';
import { getCurrentJSTMonth, getPreviousMonth, compareValues } from '../utils';

export type WageRow = {
  id: string;
  name: string;
  yomigana: string;
  wageRate: number | null;
  workTime: number;
  basicWage: number | null;
  taskIncentives: { projectName: string; taskName: string; amount: number }[];
  incentiveTotal: number;
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

  const [isMonthlySettlementConfirmed, setIsMonthlySettlementConfirmed] = useState(false);
  const [hasProvisionalDailyWork, setHasProvisionalDailyWork] = useState(false);
  const [isWageSummaryConfirmedState, setIsWageSummaryConfirmedState] = useState(false);

  const canConfirmWageSummary = useMemo(() => {
    return isMonthlySettlementConfirmed && !hasProvisionalDailyWork;
  }, [isMonthlySettlementConfirmed, hasProvisionalDailyWork]);

  const isWageSummaryConfirmed = isWageSummaryConfirmedState;

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
        workRes,
        dailyConfirmRes,
        monthlyConfirmRes,
        wageConfirmRes
      ] = await Promise.all([
        supabase.from('members').select('*, base_wages(wage)').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('projects').select('id, name, project_type, project_tasks(id, name, is_deleted, is_canceled, status, completed_at)').eq('is_deleted', false),
        supabase.from('project_budget_items').select('*').eq('category', 'expense'),
        supabase.from('monthly_task_progress').select('*').eq('year_month', monthStr),
        supabase.from('monthly_task_progress').select('*').eq('year_month', prevMonthStr),
        supabase.from('daily_work_records').select('date, member_id, work_time').gte('date', `${monthStr}-01`).lt('date', `${nextMonthStr}-01`),
        supabase.from('daily_work_confirmations').select('work_date').gte('work_date', `${monthStr}-01`).lt('work_date', `${nextMonthStr}-01`),
        supabase.from('monthly_settlement_confirmations').select('year_month').eq('year_month', monthStr),
        supabase.from('monthly_wage_confirmations').select('year_month').eq('year_month', monthStr)
      ]);

      if (membersRes.error) throw membersRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (budgetsRes.error) throw budgetsRes.error;
      if (cTaskRes.error) throw cTaskRes.error;
      if (pTaskRes.error) throw pTaskRes.error;
      if (workRes.error) throw workRes.error;

      // Check monthly wage confirmation
      let wageConfirmed = false;
      if (wageConfirmRes.data && wageConfirmRes.data.length > 0) {
        wageConfirmed = true;
      } else {
        try {
          const savedWage = localStorage.getItem('monthly_wage_confirmations');
          const listWage = savedWage ? JSON.parse(savedWage) : [];
          wageConfirmed = listWage.includes(monthStr);
        } catch {}
      }
      setIsWageSummaryConfirmedState(wageConfirmed);

      // Check monthly settlement confirmation
      let monthlyConfirmed = false;
      if (monthlyConfirmRes.data && monthlyConfirmRes.data.length > 0) {
        monthlyConfirmed = true;
      } else {
        try {
          const saved = localStorage.getItem('monthly_settlement_confirmed');
          const list = saved ? JSON.parse(saved) : ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];
          monthlyConfirmed = list.includes(monthStr);
        } catch {
          monthlyConfirmed = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'].includes(monthStr);
        }
      }
      setIsMonthlySettlementConfirmed(monthlyConfirmed);

      // Check daily work confirmations for dates with work_time > 0
      const workRecords = workRes.data || [];
      const confirmedDateSet = new Set((dailyConfirmRes.data || []).map((d: any) => d.work_date));

      try {
        const savedDaily = localStorage.getItem('daily_work_confirmations');
        if (savedDaily) {
          JSON.parse(savedDaily).forEach((d: string) => confirmedDateSet.add(d));
        }
      } catch {}

      const datesWithWork = new Set(workRecords.filter((w: any) => Number(w.work_time) > 0).map((w: any) => w.date));
      let provisionalDaily = false;
      for (const d of datesWithWork) {
        if (!confirmedDateSet.has(d)) {
          provisionalDaily = true;
          break;
        }
      }
      setHasProvisionalDailyWork(provisionalDaily);

      const members = membersRes.data || [];
      const projects = projectsRes.data || [];
      const cTasks = cTaskRes.data || [];
      const cMems: any[] = [];

      const rows: WageRow[] = members.map((member: any) => {
        const memberWorks = workRes.data?.filter((w: any) => w.member_id === member.id) || [];
        const totalWorkTime = memberWorks.reduce((sum: number, w: any) => sum + Number(w.work_time), 0);
        
        let basicWage = null;
        let wageRate = null;
        if (member.base_wages && typeof member.base_wages.wage === 'number') {
          wageRate = member.base_wages.wage;
          basicWage = Math.floor(wageRate * totalWorkTime);
        }

        let sumRewardUnitPrice = 0;
        const memberContribs = cMems.filter((r: any) => r.member_id === member.id);
        const taskIncentives: { projectName: string; taskName: string; amount: number }[] = [];

        for (const contrib of memberContribs) {
          if (!contrib.task_id || !contrib.contribution_ratio) continue;

          const project = projects.find((p: any) => (p.project_tasks || []).some((t: any) => t.id === contrib.task_id));
          if (!project) continue;

          const projectTasks = project.project_tasks || [];
          const activeTasks = projectTasks.filter((t: any) => !t.is_deleted && !t.is_canceled);
          
          if (activeTasks.length === 0) continue;
          
          const allCompleted = activeTasks.every((t: any) => {
            if (project.project_type === 'ongoing') {
              const cTask = cTasks.find((r: any) => r.task_id === t.id);
              const pTask = pTaskRes.data?.find((r: any) => r.task_id === t.id);
              return cTask?.status === 'completed' && pTask?.status !== 'completed';
            } else {
              return t.status === 'completed' && t.completed_at && t.completed_at.startsWith(monthStr);
            }
          });

          if (!allCompleted) continue;

          const unitPrice = Number(contrib.deduction_amount) || 0;

          sumRewardUnitPrice += unitPrice;
          
          const task = activeTasks.find((t: any) => t.id === contrib.task_id);
          taskIncentives.push({
            projectName: project.name || '',
            taskName: task ? task.name : '',
            amount: unitPrice
          });
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
          yomigana: member.yomigana || '',
          wageRate,
          workTime: totalWorkTime,
          basicWage,
          taskIncentives,
          incentiveTotal: safeIncentive,
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
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'name') {
        aVal = a.yomigana || a.name;
        bVal = b.yomigana || b.name;
      }
      return compareValues(aVal, bVal, sortConfig.direction, a, b);
    });
  }, [data, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedRows = useMemo(() => {
    return sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [sortedData, currentPage, pageSize]);

  const confirmWageSummary = useCallback(async (monthStr: string) => {
    try {
      setLoading(true);

      const wageRecords = data.map(r => ({
        year_month: monthStr,
        member_id: r.id,
        work_time: r.workTime,
        wage_rate: r.wageRate,
        basic_wage: r.basicWage,
        incentive_total: r.incentiveTotal,
        wage_total: r.wageTotal,
        deduction_total: r.dedTotal,
        payment: r.payment
      }));

      if (wageRecords.length > 0) {
        try {
          await supabase
            .from('monthly_wage_records')
            .upsert(wageRecords, { onConflict: 'year_month,member_id' });
        } catch (e) {
          console.warn('Could not upsert monthly_wage_records:', e);
        }
      }

      try {
        await supabase
          .from('monthly_wage_confirmations')
          .upsert({ year_month: monthStr }, { onConflict: 'year_month' });
      } catch (e) {
        console.warn('Could not upsert monthly_wage_confirmations:', e);
      }

      try {
        const saved = localStorage.getItem('monthly_wage_confirmations');
        const list = saved ? JSON.parse(saved) : [];
        if (!list.includes(monthStr)) {
          list.push(monthStr);
          localStorage.setItem('monthly_wage_confirmations', JSON.stringify(list));
        }
      } catch {}

      const totalLaborWage = data.reduce((sum, r) => sum + (r.wageTotal || 0), 0);
      const totalDeduction = data.reduce((sum, r) => sum + (r.dedTotal || 0), 0);
      const periodDate = `${monthStr}-01`;

      try {
        const { data: existingFin } = await supabase
          .from('financial_records')
          .select('id')
          .eq('period', periodDate)
          .eq('subject', '労務費（利用者工賃）')
          .limit(1);

        if (existingFin && existingFin.length > 0) {
          await supabase
            .from('financial_records')
            .update({
              amount: totalLaborWage,
              activity_category: 'production',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingFin[0].id);
        } else {
          await supabase
            .from('financial_records')
            .insert({
              period: periodDate,
              type: 'expense',
              subject: '労務費（利用者工賃）',
              amount: totalLaborWage,
              recorded_date: new Date().toISOString().split('T')[0],
              activity_category: 'production',
              is_limited: false
            });
        }

        const { data: existingDedFin } = await supabase
          .from('financial_records')
          .select('id')
          .eq('period', periodDate)
          .eq('subject', '控除')
          .limit(1);

        if (existingDedFin && existingDedFin.length > 0) {
          await supabase
            .from('financial_records')
            .update({
              type: 'revenue',
              amount: totalDeduction,
              activity_category: 'welfare',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingDedFin[0].id);
        } else {
          await supabase
            .from('financial_records')
            .insert({
              period: periodDate,
              type: 'revenue',
              subject: '控除',
              amount: totalDeduction,
              recorded_date: new Date().toISOString().split('T')[0],
              activity_category: 'welfare',
              is_limited: false
            });
        }
      } catch (e) {
        console.warn('Could not sync financial_records:', e);
      }

      setIsWageSummaryConfirmedState(true);
    } catch (err) {
      console.error('Error confirming wage summary:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [data]);

  const cancelWageSummary = useCallback(async (monthStr: string) => {
    try {
      setLoading(true);

      try {
        await supabase.from('monthly_wage_confirmations').delete().eq('year_month', monthStr);
        await supabase.from('monthly_wage_records').delete().eq('year_month', monthStr);
      } catch (e) {
        console.warn('Could not delete wage confirmation records:', e);
      }

      try {
        const saved = localStorage.getItem('monthly_wage_confirmations');
        if (saved) {
          const list = JSON.parse(saved).filter((m: string) => m !== monthStr);
          localStorage.setItem('monthly_wage_confirmations', JSON.stringify(list));
        }
      } catch {}

      setIsWageSummaryConfirmedState(false);
    } catch (err) {
      console.error('Error canceling wage summary:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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
    confirmWageSummary,
    cancelWageSummary,
    sortedData,
    totalPages,
    paginatedRows,
    pageSize,
    canConfirmWageSummary,
    isWageSummaryConfirmed,
    isMonthlySettlementConfirmed,
    hasProvisionalDailyWork
  };
}

