import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib';
import { getCurrentJSTMonth, compareValues } from '../utils';

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

      const nextMonthDate = new Date(monthStr + '-01');
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      const nextMonthStr = `${nextMonthDate.getFullYear()}-${(nextMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;

      const [
        membersRes,
        projectsRes,
        budgetsRes,
        workRes,
        dailyConfirmRes,
        monthlyConfirmRes,
        wageConfirmRes
      ] = await Promise.all([
        supabase.from('members').select('*, wage_rates(wage)').order('yomigana', { ascending: true }),
        supabase.from('projects').select('id, name, project_type, project_tasks(id, name, is_deleted, is_canceled, status, completed_at)').eq('is_deleted', false),
        supabase.from('project_budgets').select('*').eq('category', 'expense'),
        supabase.from('daily_work_records').select('date, member_id, work_time').gte('date', `${monthStr}-01`).lt('date', `${nextMonthStr}-01`),
        supabase.from('daily_work_records').select('date').gte('date', `${monthStr}-01`).lt('date', `${nextMonthStr}-01`).eq('is_confirmed', true),
        supabase.from('monthly_incentive_allocations').select('year_month').eq('year_month', monthStr).eq('is_confirmed', true),
        supabase.from('monthly_wage_records').select('*').eq('year_month', monthStr)
      ]);

      if (membersRes.error) throw membersRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (budgetsRes.error) throw budgetsRes.error;
      if (workRes.error) throw workRes.error;

      const dbWageRecordMap = new Map((wageConfirmRes.data || []).map((r: any) => [r.member_id, r]));

      // Check monthly wage confirmation
      let wageConfirmed = (wageConfirmRes.data || []).some((r: any) => r.is_confirmed);
      if (!wageConfirmed) {
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
          const list = saved ? JSON.parse(saved) : ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2027-07'];
          monthlyConfirmed = list.includes(monthStr);
        } catch {
          monthlyConfirmed = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2027-07'].includes(monthStr);
        }
      }
      setIsMonthlySettlementConfirmed(monthlyConfirmed);

      // Check daily work confirmations for dates with work_time > 0
      const workRecords = workRes.data || [];
      const confirmedDateSet = new Set((dailyConfirmRes.data || []).map((d: any) => d.date));

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

      const allMembers = membersRes.data || [];
      const projects = projectsRes.data || [];
      const cMems: any[] = [];

      const members = allMembers.filter((m: any) => {
        if (!m.is_deleted) return true;
        const memberWorks = workRes.data?.filter((w: any) => w.member_id === m.id) || [];
        const totalWorkTime = memberWorks.reduce((sum: number, w: any) => sum + Number(w.work_time), 0);
        return totalWorkTime > 0;
      }).map((m: any) => ({
        ...m,
        name: m.is_deleted ? `${m.name} (削除済)` : m.name
      }));

      const rows: WageRow[] = members.map((member: any) => {
        const dbRecord = dbWageRecordMap.get(member.id);
        const memberWorks = workRes.data?.filter((w: any) => w.member_id === member.id) || [];
        const totalWorkTime = memberWorks.reduce((sum: number, w: any) => sum + Number(w.work_time), 0);
        
        let basicWage = null;
        let wageRate = null;
        if (member.wage_rates && typeof member.wage_rates.wage === 'number') {
          wageRate = member.wage_rates.wage;
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
            return t.status === 'completed' && t.completed_at && t.completed_at.startsWith(monthStr);
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

        const computedWageTotal = (basicWage || 0) + safeIncentive;
        const computedDedTotal = 0;
        const computedPayment = computedWageTotal - computedDedTotal;

        const finalWorkTime = dbRecord?.work_time !== undefined && dbRecord?.work_time !== null ? Number(dbRecord.work_time) : totalWorkTime;
        const finalWageRate = dbRecord?.wage_rate !== undefined && dbRecord?.wage_rate !== null ? Number(dbRecord.wage_rate) : wageRate;
        const finalBasicWage = dbRecord?.basic_wage !== undefined && dbRecord?.basic_wage !== null ? Number(dbRecord.basic_wage) : basicWage;
        const finalIncentiveTotal = dbRecord?.incentive_total !== undefined && dbRecord?.incentive_total !== null ? Number(dbRecord.incentive_total) : safeIncentive;
        const finalWageTotal = dbRecord?.wage_total !== undefined && dbRecord?.wage_total !== null ? Number(dbRecord.wage_total) : computedWageTotal;
        const finalDedTotal = dbRecord?.deduction_total !== undefined && dbRecord?.deduction_total !== null ? Number(dbRecord.deduction_total) : computedDedTotal;
        const finalPayment = dbRecord?.payment !== undefined && dbRecord?.payment !== null ? Number(dbRecord.payment) : computedPayment;

        return {
          id: member.id,
          name: member.name,
          yomigana: member.yomigana || '',
          wageRate: finalWageRate,
          workTime: finalWorkTime,
          basicWage: finalBasicWage,
          taskIncentives,
          incentiveTotal: finalIncentiveTotal,
          wageTotal: finalWageTotal,
          dedA,
          dedB,
          dedTotal: finalDedTotal,
          payment: finalPayment
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
          .from('monthly_wage_records')
          .update({ is_confirmed: true })
          .eq('year_month', monthStr);
      } catch (e) {
        console.warn('Could not update monthly_wage_records confirmation:', e);
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
        await supabase.from('monthly_wage_records').update({ is_confirmed: false }).eq('year_month', monthStr);
      } catch (e) {
        console.warn('Could not update wage confirmation records:', e);
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

