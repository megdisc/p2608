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
  allowanceItems: { name: string; amount: number }[];
  allowanceTotal: number;
  wageTotal: number;
  deductionItems: { name: string; amount: number }[];
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
        attendanceRes,
        allowancesMasterRes,
        deductionsMasterRes,
        dailyConfirmRes,
        monthlyIncentiveConfirmRes,
        monthlyIncentiveRecordsRes,
        wageConfirmRes,
        wageHeaderConfirmRes,
        officeSettingsRes
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
        supabase.from('financial_records').select('*').gte('target_period', `${monthStr}-01`).lt('target_period', `${nextMonthStr}-01`).eq('type', 'expense'),
        supabase.from('daily_work_records').select('target_period, member_id, task_id, work_time, office_id').gte('target_period', `${monthStr}-01`).lt('target_period', `${nextMonthStr}-01`),
        supabase.from('member_attendance_records').select('*').gte('target_period', `${monthStr}-01`).lt('target_period', `${nextMonthStr}-01`),
        supabase.from('allowances').select('*').eq('is_deleted', false),
        supabase.from('deductions').select('*').eq('is_deleted', false),
        supabase.from('daily_work_confirmations').select('target_period').gte('target_period', `${monthStr}-01`).lt('target_period', `${nextMonthStr}-01`).eq('is_confirmed', true),
        supabase.from('monthly_incentive_confirmations').select('target_period').eq('target_period', monthStr).eq('is_confirmed', true),
        supabase.from('monthly_incentive_records').select('*').eq('target_period', monthStr),
        supabase.from('monthly_wage_summaries').select('*').eq('target_period', monthStr),
        supabase.from('monthly_wage_confirmations').select('target_period').eq('target_period', monthStr).eq('is_confirmed', true),
        supabase.from('office_member_settings').select('*')
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
      const allowanceMasterList = allowancesMasterRes.data || [];
      const deductionMasterList = deductionsMasterRes.data || [];
      const attendanceRecords = attendanceRes.data || [];

      const members = allMembers.filter((m: any) => {
        if (!m.is_deleted) return true;
        const memberWorks = workRes.data?.filter((w: any) => w.member_id === m.id) || [];
        const totalWorkTime = memberWorks.reduce((sum: number, w: any) => sum + Number(w.work_time), 0);
        return totalWorkTime > 0;
      }).map((m: any) => ({
        ...m,
        name: m.is_deleted ? `${m.name} (削除済)` : m.name
      }));

      const wageRateInfoMap = new Map<string, { wage: number; officeId: string | null }>(
        (wageRatesRes.data || []).map((w: any) => [w.id, { wage: Number(w.wage), officeId: w.office_id || null }])
      );

      const memberOfficeWageMap = new Map<string, number>();
      const memberDefaultWageMap = new Map<string, number>();

      (wageEvalsRes.data || []).forEach((ev: any) => {
        const wageInfo = wageRateInfoMap.get(ev.wage_rate_id);
        if (wageInfo) {
          if (!memberDefaultWageMap.has(ev.member_id)) {
            memberDefaultWageMap.set(ev.member_id, wageInfo.wage);
          }
          if (wageInfo.officeId) {
            const key = `${ev.member_id}_${wageInfo.officeId}`;
            if (!memberOfficeWageMap.has(key)) {
              memberOfficeWageMap.set(key, wageInfo.wage);
            }
          }
        }
      });

      const memberOfficeSettingsMap = new Map<string, string>(
        (officeSettingsRes.data || []).map((s: any) => [s.member_id, s.office_id])
      );

      const rows: WageRow[] = members.map((member: any) => {
        const dbRecord: any = dbWageRecordMap.get(member.id);
        const memberWorks = workRes.data?.filter((w: any) => w.member_id === member.id) || [];
        const memberAttendances = attendanceRecords.filter((a: any) => a.member_id === member.id);
        const totalWorkTime = memberWorks.reduce((sum: number, w: any) => sum + Number(w.work_time), 0);

        let calculatedBasicWage = 0;
        let hasValidRate = false;

        memberWorks.forEach((w: any) => {
          const time = Number(w.work_time);
          if (time > 0) {
            let rate: number | null = null;
            if (w.office_id && memberOfficeWageMap.has(`${member.id}_${w.office_id}`)) {
              rate = memberOfficeWageMap.get(`${member.id}_${w.office_id}`)!;
            } else if (memberDefaultWageMap.has(member.id)) {
              rate = memberDefaultWageMap.get(member.id)!;
            }

            if (rate !== null) {
              hasValidRate = true;
              calculatedBasicWage += rate * time;
            }
          }
        });

        let basicWage = hasValidRate ? Math.floor(calculatedBasicWage) : null;
        let wageRate: number | null = memberDefaultWageMap.get(member.id) ?? null;
        const primaryWorkOfficeId = memberWorks.find((w: any) => w.office_id && Number(w.work_time) > 0)?.office_id;
        const memberOfficeId = primaryWorkOfficeId || memberOfficeSettingsMap.get(member.id) || null;

        if (primaryWorkOfficeId && memberOfficeWageMap.has(`${member.id}_${primaryWorkOfficeId}`)) {
          wageRate = memberOfficeWageMap.get(`${member.id}_${primaryWorkOfficeId}`)!;
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

        // --- 加算手当 & 控除の動的計算ロジック ---
        const attendanceDates = new Set<string>();
        const absenceDates = new Set<string>();
        let mealCount = 0;
        let transportRoundCount = 0;
        let transportOneWayCount = 0;
        let transportOutboundCount = 0;
        let transportInboundCount = 0;

        memberAttendances.forEach((a: any) => {
          const status = a.status || 'present';
          const isPresent = ['present', '通所利用', '在宅利用', '施設外利用'].includes(status);
          const isAbsent = ['absent', '非利用／欠席'].includes(status);

          if (isPresent) {
            attendanceDates.add(a.target_period);
          } else if (isAbsent) {
            absenceDates.add(a.target_period);
          }

          if (a.has_meal) mealCount++;
          if (a.has_pickup && a.has_dropoff) {
            transportRoundCount++;
          } else if (a.has_pickup || a.has_dropoff) {
            transportOneWayCount++;
          }
          if (a.has_pickup) transportOutboundCount++;
          if (a.has_dropoff) transportInboundCount++;
        });

        memberWorks.forEach((w: any) => {
          if (Number(w.work_time) > 0 && w.target_period) {
            attendanceDates.add(w.target_period);
          }
        });

        const attendanceDaysCount = attendanceDates.size;
        const absenceDaysCount = absenceDates.size;
        const totalDays = attendanceDaysCount + absenceDaysCount;
        const attendanceRate = totalDays > 0 ? (attendanceDaysCount / totalDays) * 100 : 0;
        const absenceRate = totalDays > 0 ? (absenceDaysCount / totalDays) * 100 : 0;

        const evalItems = (masterList: any[]) => {
          const resList: { name: string; amount: number }[] = [];
          const seenNames = new Set<string>();

          const officeFilteredList = masterList.filter((item: any) => {
            if (memberOfficeId && item.office_id) {
              return item.office_id === memberOfficeId;
            }
            return true;
          });

          for (const item of officeFilteredList) {
            if (seenNames.has(item.name)) continue;
            seenNames.add(item.name);

            const basis = item.calc_trigger_basis || 'manual';
            const unitPrice = Number(item.unit_price) || 0;
            const thresholdVal = item.threshold_value !== null && item.threshold_value !== undefined ? Number(item.threshold_value) : null;
            const operator = item.threshold_operator || '';
            const occurrence = item.occurrence_type || 'daily';

            let basisVal = 0;
            let multiplier = 0;

            switch (basis) {
              case 'work_hours':
                basisVal = totalWorkTime;
                multiplier = totalWorkTime;
                break;
              case 'attendance_days':
                basisVal = attendanceDaysCount;
                multiplier = attendanceDaysCount;
                break;
              case 'absence_days':
                basisVal = absenceDaysCount;
                multiplier = absenceDaysCount;
                break;
              case 'attendance_rate':
                basisVal = attendanceRate;
                multiplier = attendanceDaysCount;
                break;
              case 'absence_rate':
                basisVal = absenceRate;
                multiplier = attendanceDaysCount;
                break;
              case 'meal_count':
                basisVal = mealCount;
                multiplier = mealCount;
                break;
              case 'transport_round':
                basisVal = transportRoundCount;
                multiplier = transportRoundCount;
                break;
              case 'transport_one_way':
                basisVal = transportOneWayCount;
                multiplier = transportOneWayCount;
                break;
              case 'transport_outbound':
                basisVal = transportOutboundCount;
                multiplier = transportOutboundCount;
                break;
              case 'transport_inbound':
                basisVal = transportInboundCount;
                multiplier = transportInboundCount;
                break;
              case 'manual':
              default:
                basisVal = 0;
                multiplier = 0;
                break;
            }

            let isMatched = false;
            if (thresholdVal === null || !operator) {
              isMatched = basis === 'manual' ? false : multiplier > 0;
            } else {
              switch (operator) {
                case 'gte': isMatched = basisVal >= thresholdVal; break;
                case 'lte': isMatched = basisVal <= thresholdVal; break;
                case 'gt': isMatched = basisVal > thresholdVal; break;
                case 'lt': isMatched = basisVal < thresholdVal; break;
                case 'eq': isMatched = basisVal === thresholdVal; break;
                default: isMatched = false; break;
              }
            }

            if (isMatched) {
              let amount = 0;
              if (occurrence === 'daily') {
                const qty = multiplier > 0 ? multiplier : 1;
                amount = Math.round(qty * unitPrice);
              } else {
                amount = Math.round(unitPrice);
              }
              if (amount > 0) {
                resList.push({ name: item.name, amount });
              }
            }
          }
          return resList;
        };

        const allowanceItems = evalItems(allowanceMasterList);
        const calculatedAllowanceTotal = allowanceItems.reduce((sum, item) => sum + item.amount, 0);

        const deductionItems = evalItems(deductionMasterList);
        const calculatedDedTotal = deductionItems.reduce((sum, item) => sum + item.amount, 0);

        const finalOtherAllowanceTotal = dbRecord?.other_allowance_total !== undefined && dbRecord?.other_allowance_total !== null
          ? Number(dbRecord.other_allowance_total)
          : calculatedAllowanceTotal;

        const calculatedIncentive = sumRewardUnitPrice - (basicWage || 0);
        const safeIncentive = Math.floor(Math.max(0, calculatedIncentive));

        const dedA = null;
        const dedB = null;

        const computedWageTotal = (basicWage || 0) + safeIncentive + finalOtherAllowanceTotal;
        const computedDedTotal = calculatedDedTotal;
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
          
        const finalDedTotal = (wageConfirmed && dbRecord?.deduction_total !== undefined && dbRecord?.deduction_total !== null)
          ? Number(dbRecord.deduction_total)
          : computedDedTotal;
        
        const finalPayment = (sumRewardUnitPrice > 0 || !dbRecord || !wageConfirmed) 
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
          allowanceItems,
          allowanceTotal: finalOtherAllowanceTotal,
          wageTotal: finalWageTotal,
          deductionItems,
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
        target_period: monthStr,
        member_id: r.id,
        work_time: r.workTime,
        wage_rate: r.wageRate,
        basic_wage: r.basicWage,
        incentive_total: r.incentiveTotal,
        other_allowance_total: r.allowanceTotal || 0,
        wage_total: r.wageTotal,
        deduction_total: r.dedTotal,
        payment: r.payment
      }));

      if (wageRecords.length > 0) {
        try {
          await supabase
            .from('monthly_wage_summaries')
            .upsert(wageRecords, { onConflict: 'target_period,member_id' });
        } catch (e) {
          console.warn('Could not upsert monthly_wage_summaries:', e);
        }
      }

      try {
        await supabase
          .from('monthly_wage_confirmations')
          .upsert({ target_period: monthStr, is_confirmed: true, confirmed_at: new Date().toISOString() }, { onConflict: 'target_period' });
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
          .eq('target_period', periodDate)
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
              target_period: periodDate,
              type: 'expense',
              subject: '労務費（利用者工賃）',
              amount: totalLaborWage,
              activity_category: 'production',
              cost_category: 'manufacturing'
            });
        }

        const { data: existingDedFin } = await supabase
          .from('financial_records')
          .select('id')
          .eq('target_period', periodDate)
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
              target_period: periodDate,
              type: 'revenue',
              subject: '控除',
              amount: totalDeduction,
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
        await supabase.from('monthly_wage_confirmations').delete().eq('target_period', monthStr);
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

