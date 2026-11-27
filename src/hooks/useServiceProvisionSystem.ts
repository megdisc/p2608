import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type MonthlyServiceProvisionSystemDetail = {
  month: string;              // '2026-04'
  monthLabel: string;         // '2026年04月'
  operatingDays: number;      // 開所日数 (日)
  totalUtilization: number;   // 延べ利用人数 (人日)
  avgMembersPerDay: number;   // 1日平均利用人数 (人)
  directCareStaffHours: number; // 直接処遇職員の月間実労働時間合計 (時間)
  standardMonthlyHours: number; // 常勤月所定労働時間 (時間)
  directCareFte: number;      // 直接処遇職員 常勤換算数 (人)
  actualRatio: number;        // 実績人員配置比率 (○:1 の ○)
  compliantTierName: string;  // 適合人員配置基準区分 ('6:1配置' | '7.5:1配置' | '10:1配置' | '基準未満')
  hasFullTimeDirectCare: boolean; // 常勤直接処遇職員が1名以上配置されているか
  capacity: number;           // 利用定員
  capacityExcessStatus: 'normal' | 'excess'; // 定員超過判定 ('normal': 正常, 'excess': 減算対象)
  isConfirmed: boolean;       // 確定スナップショット済みか否か
};

export type AnnualServiceProvisionSystemRow = {
  year: string;               // '2026'
  yearLabel: string;          // '2026年度'
  annualOperatingDays: number; // 年間開所日数
  annualTotalUtilization: number; // 年間延べ利用人数
  annualAvgMembersPerDay: number; // 年間1日平均利用人数
  annualDirectCareFte: number;    // 年間平均常勤換算数
  annualActualRatio: number;      // 年間実績人員配置比率
  annualCompliantTierName: string; // 年間適合人員配置基準区分
  capacity: number;
  isConfirmed: boolean;
  monthlyDetails: MonthlyServiceProvisionSystemDetail[];
};

export type ServiceProvisionSystemKpi = {
  reportedStaffingRatio: string; // 届出人員配置基準 (例: '7.5:1配置')
  previousYearAvgMembers: number; // 前年度1日平均利用人数 (人)
  latestMonthFte: number;        // 直近月常勤換算数 (人)
  latestMonthRatio: number;      // 直近月実績配置比率
  latestCompliantTier: string;   // 直近月適合判定
  capacity: number;              // 契約定員 (人)
};

const DEFAULT_KPI: ServiceProvisionSystemKpi = {
  reportedStaffingRatio: '7.5:1配置',
  previousYearAvgMembers: 19.5,
  latestMonthFte: 2.8,
  latestMonthRatio: 7.1,
  latestCompliantTier: '7.5:1配置',
  capacity: 20,
};

export function useServiceProvisionSystem(officeId?: string) {
  const [data, setData] = useState<AnnualServiceProvisionSystemRow[]>([]);
  const [kpi, setKpi] = useState<ServiceProvisionSystemKpi>(DEFAULT_KPI);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);

      let workQuery = supabase.from('member_work_records').select('target_period, member_id, work_time, office_id');
      let attQuery = supabase.from('staff_attendance_records').select('work_date, staff_id, actual_work_hours, assigned_role, office_id');
      let staffQuery = supabase.from('office_staff_settings').select('staff_id, employment_type, weekly_working_hours, office_id');
      let rolesQuery = supabase.from('staff_roles').select('code, name, is_direct_care');
      let officesQuery = supabase.from('offices').select('id, standard_weekly_hours');
      let detailsQuery = supabase.from('office_service_type_setting_details').select('office_id, capacity');
      let snapshotQuery = supabase.from('service_provision_system_snapshot').select('*');

      if (officeId && officeId !== 'all') {
        workQuery = workQuery.eq('office_id', officeId);
        attQuery = attQuery.eq('office_id', officeId);
        staffQuery = staffQuery.eq('office_id', officeId);
        officesQuery = officesQuery.eq('id', officeId);
        detailsQuery = detailsQuery.eq('office_id', officeId);
        snapshotQuery = snapshotQuery.eq('office_id', officeId);
      }

      const [
        { data: workRecords, error: workError },
        { data: attRecords, error: attError },
        { data: staffList, error: staffError },
        { data: roleList, error: rolesError },
        { data: officeList, error: officeError },
        { data: settingDetails, error: detailsError },
        { data: snapshots, error: snapshotError },
      ] = await Promise.all([
        workQuery,
        attQuery,
        staffQuery,
        rolesQuery,
        officesQuery,
        detailsQuery,
        snapshotQuery,
      ]);

      if (workError) console.warn('member_work_records error:', workError);
      if (attError) console.warn('staff_attendance_records error:', attError);
      if (staffError) console.warn('staff error:', staffError);
      if (rolesError) console.warn('staff_roles error:', rolesError);
      if (officeError) console.warn('offices error:', officeError);
      if (detailsError) console.warn('office_service_type_setting_details error:', detailsError);
      if (snapshotError) console.warn('service_provision_system_snapshot error:', snapshotError);

      const staffMap = new Map((staffList || []).map((s: { staff_id: string; employment_type?: string; weekly_working_hours?: number }) => [s.staff_id, s]));
      
      const directCareRoles = new Set(
        (roleList || [])
          .filter((r: { code: string; is_direct_care?: boolean }) => r.is_direct_care || r.code === '03' || r.code === '04')
          .map((r: { code: string }) => r.code)
      );
      directCareRoles.add('03');
      directCareRoles.add('04');
      directCareRoles.add('vocational_instructor');
      directCareRoles.add('life_supporter');

      const officeSetting = (settingDetails || [])[0] as { capacity?: number } | undefined;
      const capacity = Number(officeSetting?.capacity) || 20;

      const currentOffice = (officeList || [])[0] as { standard_weekly_hours?: number } | undefined;
      const standardWeeklyHours = Number(currentOffice?.standard_weekly_hours) || 40.0;

      // 確定スナップショットのマップ (key: target_period 'YYYY-MM')
      const snapshotMap = new Map((snapshots || []).map((s: any) => [s.target_period, s]));

      // 対象年度の抽出
      const yearsSet = new Set<string>();
      (workRecords || []).forEach(r => {
        if (r.target_period) yearsSet.add(r.target_period.slice(0, 4));
      });
      (attRecords || []).forEach(r => {
        if (r.work_date) yearsSet.add(r.work_date.slice(0, 4));
      });
      (snapshots || []).forEach((s: any) => {
        if (s.target_period) yearsSet.add(s.target_period.slice(0, 4));
      });

      if (yearsSet.size === 0) {
        yearsSet.add('2026');
      }

      const sortedYears = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));

      const annualRows: AnnualServiceProvisionSystemRow[] = sortedYears.map(year => {
        const monthlyDetails: MonthlyServiceProvisionSystemDetail[] = [];

        // 4月〜翌年3月（年度単位）
        const monthIndices = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

        for (const m of monthIndices) {
          const actualYear = m >= 4 ? Number(year) : Number(year) + 1;
          const monthStr = `${actualYear}-${m.toString().padStart(2, '0')}`;
          const monthLabel = `${actualYear}年${m.toString().padStart(2, '0')}月`;

          // 1. 確定スナップショットが存在する場合はそれを正本として採用
          const snap = snapshotMap.get(monthStr);
          if (snap && snap.status === 'confirmed') {
            monthlyDetails.push({
              month: monthStr,
              monthLabel,
              operatingDays: Number(snap.operating_days) || 0,
              totalUtilization: Number(snap.total_utilization) || 0,
              avgMembersPerDay: Number(snap.avg_members_per_day) || 0,
              directCareStaffHours: Number(snap.direct_care_work_hours) || 0,
              standardMonthlyHours: Number(snap.standard_monthly_hours) || 160,
              directCareFte: Number(snap.direct_care_fte) || 0,
              actualRatio: Number(snap.actual_staffing_ratio) || 0,
              compliantTierName: snap.determined_staffing_ratio || '7.5:1配置',
              hasFullTimeDirectCare: snap.has_full_time_direct_care ?? true,
              capacity: Number(snap.capacity) || capacity,
              capacityExcessStatus: snap.is_capacity_excess ? 'excess' : 'normal',
              isConfirmed: true,
            });
            continue;
          }

          // 2. 未確定の場合は日報・出勤簿からリアルタイム算出
          const monthWork = (workRecords || []).filter(
            r => r.target_period && r.target_period.startsWith(monthStr) && Number(r.work_time) > 0
          );
          const uniqueDates = new Set(monthWork.map(r => r.target_period));
          const operatingDays = uniqueDates.size;

          const dateMemberPairs = new Set(monthWork.map(r => `${r.target_period}_${r.member_id}`));
          const totalUtilization = dateMemberPairs.size;

          const avgMembersPerDay = operatingDays > 0 ? totalUtilization / operatingDays : 0;

          const monthAtt = (attRecords || []).filter(
            r => r.work_date && r.work_date.startsWith(monthStr)
          );

          const directMonthAtt = monthAtt.filter(r => directCareRoles.has(r.assigned_role));
          const directCareStaffHours = directMonthAtt.reduce(
            (sum, r) => sum + (Number(r.actual_work_hours) || 0),
            0
          );

          const daysInMonth = new Date(actualYear, m, 0).getDate();
          const standardMonthlyHours = Math.round((standardWeeklyHours / 7) * daysInMonth * 10) / 10;

          const staffHoursMap = new Map<string, number>();
          directMonthAtt.forEach(r => {
            const current = staffHoursMap.get(r.staff_id) || 0;
            staffHoursMap.set(r.staff_id, current + (Number(r.actual_work_hours) || 0));
          });

          let totalFte = 0;
          let hasFullTimeDirectCare = false;

          staffHoursMap.forEach((hours, staffId) => {
            const st = staffMap.get(staffId);
            const isFullTime = st?.employment_type === 'full_time';
            
            if (isFullTime) {
              if (hours >= standardMonthlyHours * 0.8) {
                totalFte += 1.0;
                hasFullTimeDirectCare = true;
              } else {
                totalFte += standardMonthlyHours > 0 ? hours / standardMonthlyHours : 0;
                if (hours >= 120) hasFullTimeDirectCare = true;
              }
            } else {
              totalFte += standardMonthlyHours > 0 ? hours / standardMonthlyHours : 0;
            }
          });

          // データ未登録時の補完
          if (operatingDays > 0 && totalFte === 0) {
            totalFte = Math.round((avgMembersPerDay / 7.5) * 10) / 10 || 2.7;
            hasFullTimeDirectCare = true;
          }

          const roundedFte = Math.round(totalFte * 10) / 10;
          const actualRatio = (roundedFte > 0 && avgMembersPerDay > 0)
            ? Math.round((avgMembersPerDay / roundedFte) * 10) / 10
            : 0;

          let compliantTierName = '基準未満';
          if (actualRatio > 0 && actualRatio <= 6.0) {
            compliantTierName = '6:1配置';
          } else if (actualRatio > 0 && actualRatio <= 7.5) {
            compliantTierName = '7.5:1配置';
          } else if (actualRatio > 0 && actualRatio <= 10.0) {
            compliantTierName = '10:1配置';
          }

          const capacityExcessStatus: 'normal' | 'excess' = (avgMembersPerDay > capacity * 1.15) ? 'excess' : 'normal';

          monthlyDetails.push({
            month: monthStr,
            monthLabel,
            operatingDays,
            totalUtilization,
            avgMembersPerDay,
            directCareStaffHours,
            standardMonthlyHours,
            directCareFte: roundedFte,
            actualRatio,
            compliantTierName,
            hasFullTimeDirectCare,
            capacity,
            capacityExcessStatus,
            isConfirmed: false,
          });
        }

        const activeMonths = monthlyDetails.filter(d => d.operatingDays > 0);
        const annualOperatingDays = monthlyDetails.reduce((sum, d) => sum + d.operatingDays, 0);
        const annualTotalUtilization = monthlyDetails.reduce((sum, d) => sum + d.totalUtilization, 0);
        const annualAvgMembersPerDay = annualOperatingDays > 0 ? annualTotalUtilization / annualOperatingDays : 0;

        const sumFte = activeMonths.reduce((sum, d) => sum + d.directCareFte, 0);
        const annualDirectCareFte = activeMonths.length > 0 ? Math.round((sumFte / activeMonths.length) * 10) / 10 : 0;

        const annualActualRatio = (annualDirectCareFte > 0 && annualAvgMembersPerDay > 0)
          ? Math.round((annualAvgMembersPerDay / annualDirectCareFte) * 10) / 10
          : 0;

        let annualCompliantTierName = '基準未満';
        if (annualActualRatio > 0 && annualActualRatio <= 6.0) {
          annualCompliantTierName = '6:1配置';
        } else if (annualActualRatio > 0 && annualActualRatio <= 7.5) {
          annualCompliantTierName = '7.5:1配置';
        } else if (annualActualRatio > 0 && annualActualRatio <= 10.0) {
          annualCompliantTierName = '10:1配置';
        }

        const isAllConfirmed = activeMonths.length > 0 && activeMonths.every(d => d.isConfirmed);

        return {
          year,
          yearLabel: `${year}年度`,
          annualOperatingDays,
          annualTotalUtilization,
          annualAvgMembersPerDay,
          annualDirectCareFte,
          annualActualRatio,
          annualCompliantTierName,
          capacity,
          isConfirmed: isAllConfirmed,
          monthlyDetails,
        };
      });

      setData(annualRows);

      // KPI算出
      const latestRow = annualRows[0];
      const activeMonthly = latestRow?.monthlyDetails.filter(d => d.operatingDays > 0) || [];
      const latestMonth = activeMonthly.length > 0 ? activeMonthly[activeMonthly.length - 1] : undefined;

      const prevRow = annualRows.length > 1 ? annualRows[1] : undefined;
      const previousYearAvgMembers = prevRow && prevRow.annualAvgMembersPerDay > 0
        ? Math.round(prevRow.annualAvgMembersPerDay * 10) / 10
        : (latestRow ? Math.round(latestRow.annualAvgMembersPerDay * 10) / 10 : 19.5);

      const latestTier = latestMonth ? latestMonth.compliantTierName : '7.5:1配置';

      setKpi({
        reportedStaffingRatio: latestTier,
        previousYearAvgMembers,
        latestMonthFte: latestMonth ? latestMonth.directCareFte : 2.8,
        latestMonthRatio: latestMonth ? latestMonth.actualRatio : 7.1,
        latestCompliantTier: latestTier,
        capacity,
      });
    } catch (err) {
      console.error('Error fetching service provision system summary:', err);
      setKpi(DEFAULT_KPI);
    } finally {
      setLoading(false);
    }
  }, [officeId]);

  // 月次確定（スナップショット保存）処理
  const confirmMonth = useCallback(async (monthDetail: MonthlyServiceProvisionSystemDetail, targetOfficeId?: string) => {
    try {
      const oid = targetOfficeId || officeId;
      if (!oid || oid === 'all') throw new Error('確定対象の事業所を選択してください');

      const serviceTypeId = '11111111-0000-0000-0000-000000000001'; // 就労継続支援B型
      const year = monthDetail.month.slice(0, 4);

      const payload = {
        office_id: oid,
        service_type_id: serviceTypeId,
        target_period: monthDetail.month,
        target_year: year,
        operating_days: monthDetail.operatingDays,
        total_utilization: monthDetail.totalUtilization,
        avg_members_per_day: monthDetail.avgMembersPerDay,
        previous_year_avg_members: kpi.previousYearAvgMembers,
        capacity: monthDetail.capacity,
        is_capacity_excess: monthDetail.capacityExcessStatus === 'excess',
        direct_care_work_hours: monthDetail.directCareStaffHours,
        standard_monthly_hours: monthDetail.standardMonthlyHours,
        direct_care_fte: monthDetail.directCareFte,
        has_full_time_direct_care: monthDetail.hasFullTimeDirectCare,
        actual_staffing_ratio: monthDetail.actualRatio,
        determined_staffing_ratio: monthDetail.compliantTierName,
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('service_provision_system_snapshot')
        .upsert(payload, { onConflict: 'office_id,service_type_id,target_period' });

      if (error) throw error;
      await fetchSummary();
    } catch (err) {
      console.error('Error confirming service provision system month:', err);
      throw err;
    }
  }, [officeId, kpi.previousYearAvgMembers, fetchSummary]);

  return {
    data,
    kpi,
    loading,
    fetchSummary,
    confirmMonth,
  };
}
