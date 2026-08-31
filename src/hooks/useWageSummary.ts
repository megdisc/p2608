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
  otherAllowanceTotal: number;
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
        wageRatesRes,
        wageEvalsRes,
        projectsRes,
        budgetsRes,
        workRes,
        dailyConfirmRes,
        monthlyIncentiveConfirmRes,
        monthlyIncentiveRecordsRes,
        wageConfirmRes,
        wageHeaderConfirmRes
      ] = await Promise.all([
        supabase.from('members').select('*').order('yomigana', { ascending: true }),
        supabase.from('wage_rates').select('*').eq('is_deleted', false),
        supabase.from('member_wage_evaluations').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select(`
          id, name, code, project_type,
          project_tasks (
            id, name, is_deleted, is_completed, completed_at,
            project_task_assignees ( member_id, staff_id )
          )
        `).eq('is_deleted', false),
        supabase.from('financial_records').select('*').gte('period', `${monthStr}-01`).lt('period', `${nextMonthStr}-01`).eq('type', 'expense'),
        supabase.from('daily_work_records').select('date, member_id, task_id, work_time').gte('date', `${monthStr}-01`).lt('date', `${nextMonthStr}-01`),
        supabase.from('daily_work_confirmations').select('date').gte('date', `${monthStr}-01`).lt('date', `${nextMonthStr}-01`).eq('is_confirmed', true),
        supabase.from('monthly_incentive_confirmations').select('year_month').eq('year_month', monthStr).eq('is_confirmed', true),
        supabase.from('monthly_incentive_records').select('*').eq('year_month', monthStr),
        supabase.from('monthly_wage_summaries').select('*').eq('year_month', monthStr),
        supabase.from('monthly_wage_confirmations').select('year_month').eq('year_month', monthStr).eq('is_confirmed', true)
      ]);

      if (membersRes.error) throw membersRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (budgetsRes.error) throw budgetsRes.error;
      if (workRes.error) throw workRes.error;

      const dbWageRecordMap = new Map((wageConfirmRes.data || []).map((r: any) => [r.member_id, r]));

      // Check monthly wage confirmation
      let wageConfirmed = Boolean(wageHeaderConfirmRes.data && wageHeaderConfirmRes.data.length > 0);
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
      if (monthlyIncentiveConfirmRes.data && monthlyIncentiveConfirmRes.data.length > 0) {
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

      const members = allMembers.filter((m: any) => {
        if (!m.is_deleted) return true;
        const memberWorks = workRes.data?.filter((w: any) => w.member_id === m.id) || [];
        const totalWorkTime = memberWorks.reduce((sum: number, w: any) => sum + Number(w.work_time), 0);
        return totalWorkTime > 0;
      }).map((m: any) => ({
        ...m,
        name: m.is_deleted ? `${m.name} (削除済)` : m.name
      }));

      const wageRateMap = new Map((wageRatesRes.data || []).map((w: any) => [w.id, Number(w.wage)]));
      const memberWageMap = new Map<string, number>();
      (wageEvalsRes.data || []).forEach((ev: any) => {
        if (!memberWageMap.has(ev.member_id)) {
          const w = wageRateMap.get(ev.wage_rate_id);
          if (w !== undefined) memberWageMap.set(ev.member_id, w);
        }
      });

      const rows: WageRow[] = members.map((member: any) => {
        const dbRecord: any = dbWageRecordMap.get(member.id);
        const memberWorks = workRes.data?.filter((w: any) => w.member_id === member.id) || [];
        const totalWorkTime = memberWorks.reduce((sum: number, w: any) => sum + Number(w.work_time), 0);
        
        let basicWage = null;
        let wageRate: number | null = memberWageMap.get(member.id) ?? null;
        if (wageRate !== null) {
          basicWage = Math.floor(wageRate * totalWorkTime);
        }

        let sumRewardUnitPrice = 0;
        let savedAllocationDrafts: Record<string, number> = {};
        try {
          const savedStr = localStorage.getItem(`monthly_allocation_drafts_${monthStr}`);
          if (savedStr) savedAllocationDrafts = JSON.parse(savedStr);
        } catch {}

        const taskIncentives: { projectName: string; taskName: string; amount: number }[] = [];

        for (const project of projects) {
          const projectTasks = (project as any).project_tasks || [];
          for (const task of projectTasks) {
            if (task.is_deleted || task.is_canceled) continue;

            const assignees = task.project_task_assignees || [];
            const isAssigned = assignees.some((a: any) => a.member_id === member.id);
            const memberWorksOnTask = (workRes.data || []).some((w: any) => w.member_id === member.id && w.task_id === task.id && Number(w.work_time) > 0);

            if (!isAssigned && !memberWorksOnTask) continue;

            let allocatedAmount = 0;
            const draftKey = `TASK-${task.id}-member_${member.id}`;
            if (savedAllocationDrafts[draftKey] !== undefined && Number(savedAllocationDrafts[draftKey]) > 0) {
              allocatedAmount = Number(savedAllocationDrafts[draftKey]);
            } else {
              let taskExpenseAmt = 0;
              const dbAlloc = (monthlyIncentiveRecordsRes.data || []).find((a: any) => a.task_id === task.id && (!a.member_id || a.member_id === member.id));
              if (dbAlloc && Number(dbAlloc.allocation_amount) > 0) {
                taskExpenseAmt = Number(dbAlloc.allocation_amount);
              } else {
                const pureTaskName = (task.name || '')
                  .replace(/^労務費（利用者工賃・/, '')
                  .replace(/^労務費（利用者工賃）/, '')
                  .replace(/^労務費（利用者工賃以外）/, '')
                  .replace(/^労務費・外注加工費/, '')
                  .replace(/^労務費/, '')
                  .replace(/^外注加工費/, '')
                  .replace(/^[（\(]/, '')
                  .replace(/[）\)]+$/, '')
                  .trim();

                const finRecord = (budgetsRes.data || []).find((f: any) => 
                  f.project_id === project.id && 
                  f.type === 'expense' &&
                  (
                    f.task_id === task.id || 
                    f.subject === `労務費（利用者工賃・${pureTaskName}）` || 
                    f.subject === `労務費（${pureTaskName}）` || 
                    f.subject === `労務費（${task.name}）`
                  )
                );
                if (finRecord && Number(finRecord.amount) > 0) {
                  taskExpenseAmt = Number(finRecord.amount);
                }
              }

              if (taskExpenseAmt > 0) {
                const memberAssignees = assignees.filter((a: any) => a.member_id);
                const numMems = memberAssignees.length || 1;
                const hasStaff = assignees.some((a: any) => a.staff_id);
                const ratio = (numMems > 0 && hasStaff) ? 0.75 : 1.0;
                allocatedAmount = Math.floor(((taskExpenseAmt * ratio) / numMems) / 1000) * 1000;
              }
            }

            if (allocatedAmount > 0) {
              sumRewardUnitPrice += allocatedAmount;
              const pureTaskName = (task.name || '')
                .replace(/^労務費（利用者工賃・/, '')
                .replace(/^労務費（利用者工賃）/, '')
                .replace(/^労務費（利用者工賃以外）/, '')
                .replace(/^労務費・外注加工費/, '')
                .replace(/^労務費/, '')
                .replace(/^外注加工費/, '')
                .replace(/^[（\(]/, '')
                .replace(/[）\)]+$/, '')
                .trim();

              taskIncentives.push({
                projectName: project.name || '',
                taskName: pureTaskName || task.name || '',
                amount: allocatedAmount
              });
            }
          }
        }

        const finalOtherAllowanceTotal = dbRecord?.other_allowance_total !== undefined && dbRecord?.other_allowance_total !== null ? Number(dbRecord.other_allowance_total) : 0;

        const calculatedIncentive = sumRewardUnitPrice - (basicWage || 0);
        const safeIncentive = Math.floor(Math.max(0, calculatedIncentive));

        const dedA = null;
        const dedB = null;

        const computedWageTotal = (basicWage || 0) + safeIncentive + finalOtherAllowanceTotal;
        const computedDedTotal = 0;
        const computedPayment = computedWageTotal - computedDedTotal;

        const finalWorkTime = dbRecord?.work_time !== undefined && dbRecord?.work_time !== null ? Number(dbRecord.work_time) : totalWorkTime;
        const finalWageRate = dbRecord?.wage_rate !== undefined && dbRecord?.wage_rate !== null ? Number(dbRecord.wage_rate) : wageRate;
        const finalBasicWage = dbRecord?.basic_wage !== undefined && dbRecord?.basic_wage !== null ? Number(dbRecord.basic_wage) : basicWage;
        
        const finalIncentiveTotal = (sumRewardUnitPrice > 0 || !dbRecord) 
          ? safeIncentive 
          : (dbRecord.incentive_total !== undefined && dbRecord.incentive_total !== null ? Number(dbRecord.incentive_total) : safeIncentive);
          
        const finalWageTotal = (sumRewardUnitPrice > 0 || !dbRecord) 
          ? ((finalBasicWage || 0) + finalIncentiveTotal + finalOtherAllowanceTotal) 
          : (dbRecord.wage_total !== undefined && dbRecord.wage_total !== null ? Number(dbRecord.wage_total) : computedWageTotal);
          
        const finalDedTotal = dbRecord?.deduction_total !== undefined && dbRecord?.deduction_total !== null ? Number(dbRecord.deduction_total) : computedDedTotal;
        
        const finalPayment = (sumRewardUnitPrice > 0 || !dbRecord) 
          ? (finalWageTotal - finalDedTotal) 
          : (dbRecord.payment !== undefined && dbRecord.payment !== null ? Number(dbRecord.payment) : computedPayment);

        return {
          id: member.id,
          name: member.name,
          yomigana: member.yomigana || '',
          wageRate: finalWageRate,
          workTime: finalWorkTime,
          basicWage: finalBasicWage,
          taskIncentives,
          incentiveTotal: finalIncentiveTotal,
          otherAllowanceTotal: finalOtherAllowanceTotal,
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
        other_allowance_total: r.otherAllowanceTotal || 0,
        wage_total: r.wageTotal,
        deduction_total: r.dedTotal,
        payment: r.payment
      }));

      if (wageRecords.length > 0) {
        try {
          await supabase
            .from('monthly_wage_summaries')
            .upsert(wageRecords, { onConflict: 'year_month,member_id' });
        } catch (e) {
          console.warn('Could not upsert monthly_wage_summaries:', e);
        }
      }

      try {
        await supabase
          .from('monthly_wage_confirmations')
          .upsert({ year_month: monthStr, is_confirmed: true, confirmed_at: new Date().toISOString() }, { onConflict: 'year_month' });
      } catch (e) {
        console.warn('Could not update monthly_wage_confirmations:', e);
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
              cost_category: 'manufacturing'
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
              cost_category: 'manufacturing',
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
              cost_category: 'manufacturing'
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

