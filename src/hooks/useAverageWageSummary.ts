import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type MonthlyAverageWageDetail = {
  month: string;              // '2026-01'
  monthLabel: string;         // '2026年01月'
  totalWage: number;          // 工賃支払総額
  operatingDays: number;      // 開所日数
  totalUtilization: number;   // 延べ利用人数 (人日)
  avgMembersPerDay: number;   // 1日平均利用人数
  avgMonthlyWage: number;     // 平均工賃（月額）
  avgDailyWage: number;       // 平均工賃（日額）
  totalWorkHours: number;     // 総作業時間 (h)
  avgHourlyWage: number;      // 平均工賃（時給）
};

export type AnnualAverageWageRow = {
  year: string;               // '2026'
  yearLabel: string;          // '2026年度'
  totalWage: number;          // 年間工賃支払総額
  operatingDays: number;      // 年間開所日数
  totalUtilization: number;   // 年間延べ利用人数
  avgMembersPerDay: number;   // 1日平均利用人数
  avgMonthlyWage: number;     // 平均工賃（月額）
  avgDailyWage: number;       // 平均工賃（日額）
  totalWorkHours: number;     // 年間総作業時間 (h)
  avgHourlyWage: number;      // 平均工賃（時給）
  monthlyDetails: MonthlyAverageWageDetail[];
};

export function useAverageWageSummary() {
  const [data, setData] = useState<AnnualAverageWageRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);

      const [
        { data: workRecords, error: workError },
        { data: wageRecords, error: wageError },
        { data: finRecords, error: finError }
      ] = await Promise.all([
        supabase.from('daily_work_records').select('date, member_id, work_time'),
        supabase.from('monthly_wage_records').select('year_month, payment, wage_total, member_id'),
        supabase.from('financial_records').select('period, type, subject, amount').eq('type', 'expense')
      ]);

      if (workError) throw workError;
      if (wageError) throw wageError;
      if (finError) throw finError;

      // Extract all years available
      const yearsSet = new Set<string>();
      (workRecords || []).forEach(r => {
        if (r.date) yearsSet.add(r.date.slice(0, 4));
      });
      (wageRecords || []).forEach(r => {
        if (r.year_month) yearsSet.add(r.year_month.slice(0, 4));
      });
      (finRecords || []).forEach(r => {
        if (r.period) yearsSet.add(r.period.slice(0, 4));
      });

      // Default to 2026 if no years found
      if (yearsSet.size === 0) {
        yearsSet.add('2026');
      }

      const sortedYears = Array.from(yearsSet).sort((a, b) => b.localeCompare(a)); // desc

      const annualRows: AnnualAverageWageRow[] = sortedYears.map(year => {
        const monthlyDetails: MonthlyAverageWageDetail[] = [];

        for (let m = 1; m <= 12; m++) {
          const monthStr = `${year}-${m.toString().padStart(2, '0')}`;
          
          // Filter work records for this month
          const monthWork = (workRecords || []).filter(r => r.date && r.date.startsWith(monthStr));
          
          // Operating days = unique dates worked
          const uniqueDates = new Set(monthWork.map(r => r.date));
          const operatingDays = uniqueDates.size > 0 ? uniqueDates.size : 0;

          // Utilization = unique (date, member_id) combinations
          const dateMemberPairs = new Set(monthWork.map(r => `${r.date}_${r.member_id}`));
          const totalUtilization = dateMemberPairs.size;

          // Total work hours
          const totalWorkHours = monthWork.reduce((sum, r) => sum + (Number(r.work_time) || 0), 0);

          // Total wage paid
          const monthWages = (wageRecords || []).filter(r => r.year_month === monthStr);
          const wageSumFromRecord = monthWages.reduce((sum, r) => sum + (Number(r.payment || r.wage_total) || 0), 0);

          const monthFins = (finRecords || []).filter(r => r.period && r.period.startsWith(monthStr));
          const memberWageFin = monthFins.find(r => r.subject && r.subject.includes('利用者工賃'));
          const wageSumFromFin = memberWageFin ? Number(memberWageFin.amount) || 0 : 0;

          const totalWage = Math.max(wageSumFromRecord, wageSumFromFin);

          // Metrics per month
          const avgMembersPerDay = operatingDays > 0 ? totalUtilization / operatingDays : 0;
          const avgDailyWage = totalUtilization > 0 ? totalWage / totalUtilization : 0;
          const avgMonthlyWage = avgMembersPerDay > 0 ? totalWage / avgMembersPerDay : 0;
          const avgHourlyWage = totalWorkHours > 0 ? totalWage / totalWorkHours : 0;

          monthlyDetails.push({
            month: monthStr,
            monthLabel: `${year}年${m.toString().padStart(2, '0')}月`,
            totalWage,
            operatingDays,
            totalUtilization,
            avgMembersPerDay,
            avgMonthlyWage,
            avgDailyWage,
            totalWorkHours,
            avgHourlyWage
          });
        }

        // Annual Aggregates
        const annualTotalWage = monthlyDetails.reduce((sum, d) => sum + d.totalWage, 0);
        const annualOperatingDays = monthlyDetails.reduce((sum, d) => sum + d.operatingDays, 0);
        const annualTotalUtilization = monthlyDetails.reduce((sum, d) => sum + d.totalUtilization, 0);
        const annualTotalWorkHours = monthlyDetails.reduce((sum, d) => sum + d.totalWorkHours, 0);

        const annualAvgMembersPerDay = annualOperatingDays > 0 ? annualTotalUtilization / annualOperatingDays : 0;
        
        // MHLW Standard B-Type Annual Average Monthly Wage formula:
        // (年間工賃支払総額) / (年間延べ利用人数) * (年間開所日数 / 12)
        const annualAvgMonthlyWage = annualTotalUtilization > 0 && annualOperatingDays > 0 
          ? (annualTotalWage / annualTotalUtilization) * (annualOperatingDays / 12)
          : 0;

        const annualAvgDailyWage = annualTotalUtilization > 0 ? annualTotalWage / annualTotalUtilization : 0;
        const annualAvgHourlyWage = annualTotalWorkHours > 0 ? annualTotalWage / annualTotalWorkHours : 0;

        return {
          year,
          yearLabel: `${year}年度`,
          totalWage: annualTotalWage,
          operatingDays: annualOperatingDays,
          totalUtilization: annualTotalUtilization,
          avgMembersPerDay: annualAvgMembersPerDay,
          avgMonthlyWage: annualAvgMonthlyWage,
          avgDailyWage: annualAvgDailyWage,
          totalWorkHours: annualTotalWorkHours,
          avgHourlyWage: annualAvgHourlyWage,
          monthlyDetails
        };
      });

      setData(annualRows);
    } catch (err) {
      console.error('Error fetching average wage summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    fetchSummary
  };
}
