import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, type Column } from '../components';
import { supabase } from '../lib';
import { useOffice } from '../contexts';
import { getCurrentJSTMonth, getCurrentJSTDateOnly } from '../utils';

export type CalendarMonthSummaryRow = {
  id: string; // date string: 'YYYY-MM-DD'
  date: string; // 'YYYY-MM-DD'
  displayDate: string; // '10/15'
  day_of_week: number; // 0-6
  day_name: string; // '日' - '土'
  day_color?: string;
  total_staff: number;
  staff_working_count: number;
  total_member: number;
  member_attending_count: number;
  meal_count: number;
  pickup_count: number;
  dropoff_count: number;
};

export interface CalendarDailyReportCalendarPageProps {
  currentMonth?: string;
  onMonthChange?: (month: string) => void;
  onSelectDate: (date: string) => void;
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export function CalendarDailyReportCalendarPage({
  currentMonth: externalMonth,
  onMonthChange: externalSetMonth,
  onSelectDate,
}: CalendarDailyReportCalendarPageProps) {
  const { selectedOfficeId, offices } = useOffice();
  const [internalMonth, setInternalMonth] = useState(() => getCurrentJSTMonth());
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CalendarMonthSummaryRow[]>([]);

  const currentMonth = externalMonth || internalMonth;
  const setMonth = useCallback(
    (month: string) => {
      if (externalSetMonth) {
        externalSetMonth(month);
      } else {
        setInternalMonth(month);
      }
    },
    [externalSetMonth]
  );

  const targetOfficeId = selectedOfficeId || (offices.length > 0 ? offices[0].id : '');
  const currentOffice = useMemo(() => {
    return offices.find(o => o.id === targetOfficeId) || null;
  }, [offices, targetOfficeId]);

  const todayStr = useMemo(() => getCurrentJSTDateOnly(), []);

  const fetchData = useCallback(async () => {
    if (!targetOfficeId || !currentMonth) {
      setRows([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [yearStr, monthStr] = currentMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const lastDay = new Date(year, month, 0).getDate();
      const startDateStr = `${currentMonth}-01`;
      const endDateStr = `${currentMonth}-${String(lastDay).padStart(2, '0')}`;

      // 1. Fetch assigned staff and members
      const [
        staffRes,
        officeStaffRes,
        staffBasicRes,
        staffExceptionRes,
        memberRes,
        officeMemberRes,
        memberBasicRes,
        memberExceptionRes,
      ] = await Promise.all([
        supabase.from('staffs').select('*').or('is_deleted.eq.false,is_deleted.is.null'),
        supabase.from('office_staff_settings').select('*').eq('office_id', targetOfficeId),
        supabase.from('staff_basic_schedules').select('*').eq('office_id', targetOfficeId),
        supabase
          .from('staff_exception_schedules')
          .select('*')
          .eq('office_id', targetOfficeId)
          .gte('target_date', startDateStr)
          .lte('target_date', endDateStr),
        supabase.from('members').select('*').or('is_deleted.eq.false,is_deleted.is.null'),
        supabase.from('office_member_settings').select('*').eq('office_id', targetOfficeId),
        supabase.from('member_basic_schedules').select('*').eq('office_id', targetOfficeId),
        supabase
          .from('member_exception_schedules')
          .select('*')
          .eq('office_id', targetOfficeId)
          .gte('target_date', startDateStr)
          .lte('target_date', endDateStr),
      ]);

      const activeStaffs = staffRes.data || [];
      const assignedOfficeStaffs = officeStaffRes.data || [];
      const staffBasics = staffBasicRes.data || [];
      const staffExceptions = staffExceptionRes.data || [];

      const activeMembers = memberRes.data || [];
      const assignedOfficeMembers = officeMemberRes.data || [];
      const memberBasics = memberBasicRes.data || [];
      const memberExceptions = memberExceptionRes.data || [];

      const assignedStaffIds = new Set(assignedOfficeStaffs.map(os => os.staff_id));
      const targetStaffs = activeStaffs.filter(s => assignedStaffIds.has(s.id));

      const assignedMemberIds = new Set(assignedOfficeMembers.map(om => om.member_id));
      const targetMembers = activeMembers.filter(m => assignedMemberIds.has(m.id));

      // Build daily summary rows
      const dailyRows: CalendarMonthSummaryRow[] = [];

      for (let day = 1; day <= lastDay; day++) {
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${currentMonth}-${dayStr}`;
        const dateObj = new Date(year, month - 1, day);
        const dow = dateObj.getDay();

        // Staff calculations
        let workingStaffCount = 0;

        targetStaffs.forEach(staff => {
          const ex = staffExceptions.find(e => e.staff_id === staff.id && e.target_date === dateStr);
          if (ex) {
            if (ex.is_work_day ?? true) workingStaffCount++;
          } else {
            const basic = staffBasics.find(b => b.staff_id === staff.id && Number(b.day_of_week) === dow);
            if (basic) {
              if (basic.is_work_day ?? true) workingStaffCount++;
            } else {
              // Default weekday work
              if (dow >= 1 && dow <= 5) workingStaffCount++;
            }
          }
        });

        // Member calculations
        let attendingMemberCount = 0;
        let mealCount = 0;
        let pickupCount = 0;
        let dropoffCount = 0;

        targetMembers.forEach(member => {
          const ex = memberExceptions.find(e => e.member_id === member.id && e.target_date === dateStr);
          if (ex) {
            const isActive = ex.is_scheduled ?? true;
            const isAttending = isActive && ex.status !== 'absent';
            if (isAttending) {
              attendingMemberCount++;
              if (ex.has_meal) mealCount++;
              if (ex.has_pickup) pickupCount++;
              if (ex.has_dropoff) dropoffCount++;
            }
          } else {
            const basic = memberBasics.find(b => b.member_id === member.id && Number(b.day_of_week) === dow);
            if (basic) {
              const isActive = basic.is_scheduled ?? true;
              const isAttending = isActive && basic.status !== 'absent';
              if (isAttending) {
                attendingMemberCount++;
                if (basic.has_meal ?? true) mealCount++;
                if (basic.has_pickup) pickupCount++;
                if (basic.has_dropoff) dropoffCount++;
              }
            } else {
              if (dow >= 1 && dow <= 5) {
                attendingMemberCount++;
                mealCount++;
              }
            }
          }
        });

        let dayColor: string | undefined;
        if (dow === 0) dayColor = '#ef4444'; // 日
        if (dow === 6) dayColor = '#3b82f6'; // 土

        dailyRows.push({
          id: dateStr,
          date: dateStr,
          displayDate: `${month}/${day}`,
          day_of_week: dow,
          day_name: DAY_LABELS[dow],
          day_color: dayColor,
          total_staff: targetStaffs.length,
          staff_working_count: workingStaffCount,
          total_member: targetMembers.length,
          member_attending_count: attendingMemberCount,
          meal_count: mealCount,
          pickup_count: pickupCount,
          dropoff_count: dropoffCount,
        });
      }

      setRows(dailyRows);
    } catch (err) {
      console.error('Failed to load calendar summary:', err);
    } finally {
      setLoading(false);
    }
  }, [targetOfficeId, currentMonth]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const columns: Column<CalendarMonthSummaryRow>[] = useMemo(
    () => [
      {
        key: 'date',
        header: '日付',
        sortable: false,
        style: { width: '130px', textAlign: 'center' },
        render: item => {
          const isToday = item.date === todayStr;
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontWeight: isToday ? 'bold' : 'normal' }}>
                {item.date}
              </span>
              {isToday && (
                <span
                  style={{
                    backgroundColor: 'var(--palette-blue-300)',
                    color: 'var(--palette-blue-700)',
                    fontSize: 'var(--text-micro)',
                    fontWeight: 'bold',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  今日
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'day_name',
        header: '曜日',
        sortable: false,
        style: { width: '60px', textAlign: 'center' },
        render: item => (
          <span style={{ fontWeight: 'bold', color: item.day_color || 'inherit' }}>
            {item.day_name}
          </span>
        ),
      },
      {
        key: 'staff_working_count',
        header: '職員出勤予定',
        sortable: false,
        style: { width: '130px', textAlign: 'center' },
        render: item => (
          <span>
            {item.staff_working_count} <span style={{ color: 'var(--color-text-muted)' }}>/ {item.total_staff}名</span>
          </span>
        ),
      },
      {
        key: 'member_attending_count',
        header: '利用者通所予定',
        sortable: false,
        style: { width: '140px', textAlign: 'center' },
        render: item => (
          <span>
            {item.member_attending_count} <span style={{ color: 'var(--color-text-muted)' }}>/ {item.total_member}名</span>
          </span>
        ),
      },
      {
        key: 'meal_count',
        header: '昼食予定',
        sortable: false,
        style: { width: '90px', textAlign: 'center' },
        render: item => (
          <span>
            {item.meal_count > 0 ? `${item.meal_count}食` : '-'}
          </span>
        ),
      },
      {
        key: 'transport',
        header: '送迎予定（往 / 復）',
        sortable: false,
        style: { width: '160px', textAlign: 'center' },
        render: item => {
          if (item.pickup_count === 0 && item.dropoff_count === 0) {
            return <span>-</span>;
          }
          return (
            <span>
              往: <strong>{item.pickup_count}</strong>名 / 復: <strong>{item.dropoff_count}</strong>名
            </span>
          );
        },
      },
    ],
    [todayStr]
  );

  const handleRowClick = useCallback(
    (item: CalendarMonthSummaryRow) => {
      onSelectDate(item.date);
    },
    [onSelectDate]
  );

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage
      title="カレンダー"
      data={rows}
      columns={columns}
      emptyMessage={
        !targetOfficeId
          ? 'サイドバー上部で事業所を選択してください。'
          : `選択された事業所（${currentOffice?.short_name || currentOffice?.name || ''}）の所属者がいません。`
      }
      showMonthFilter={true}
      singleMonth={currentMonth}
      onSingleMonthChange={setMonth}
      onRowClick={handleRowClick}
      hideAddButton={true}
      hideDeleteColumn={true}
      hideHeader={true}
    />
  );
}

