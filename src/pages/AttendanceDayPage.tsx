import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, Button, Input, Select, type Column } from '../components';
import { supabase } from '../lib';
import { useOffice, useAlert } from '../contexts';
import { getCurrentJSTDateOnly } from '../utils';
import type { StaffExceptionScheduleTableItem, MemberExceptionScheduleTableItem } from '../types/db';

export type AttendanceDayRow = {
  id: string; // `staff-${staff_id}` or `member-${member_id}`
  date: string; // YYYY-MM-DD (DataTable singleDate filter)
  target_date: string; // YYYY-MM-DD
  user_type: 'staff' | 'member';
  person_id: string; // staff_id or member_id
  code: string;
  name: string;
  yomigana: string;
  is_active: boolean; // 職員: is_work_day, 利用者: is_scheduled
  status?: string; // 利用者のみ: 'present' | 'offsite' | 'remote' | 'absent'
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  break_minutes: number;
  calculated_hours: number;
  has_meal?: boolean;
  has_pickup?: boolean;
  has_dropoff?: boolean;
  remarks: string;
  has_exception_record: boolean;
  exception_id?: string;

  // DB読込時の初期ベースライン（変更検知用）
  initial_is_active: boolean;
  initial_status?: string;
  initial_start_time: string;
  initial_end_time: string;
  initial_break_minutes: number;
  initial_has_meal?: boolean;
  initial_has_pickup?: boolean;
  initial_has_dropoff?: boolean;
  initial_remarks: string;
};

export interface AttendanceDayPageProps {
  currentDate?: string;
  onDateChange?: (date: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'present', label: '通所' },
  { value: 'offsite', label: '施設外就労' },
  { value: 'remote', label: '在宅利用' },
  { value: 'absent', label: '欠席' },
];

const formatTimeForInput = (timeStr?: string | null): string => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
};

const formatTimeForDb = (timeStr?: string | null): string | null => {
  if (!timeStr || timeStr.trim() === '') return null;
  return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
};

const computeHours = (
  start?: string | null,
  end?: string | null,
  breakMins: number | string = 0,
  isActive: boolean = true
): number => {
  if (!isActive || !start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (endMin <= startMin) return 0;
  const bMin = Number(breakMins) || 0;
  const workMins = Math.max(0, endMin - startMin - bMin);
  return Math.round((workMins / 60) * 100) / 100;
};

// 項目が初期状態から変更されたかを判定
const isRowChanged = (row: AttendanceDayRow): boolean => {
  if (row.is_active !== row.initial_is_active) return true;
  if ((row.start_time || '') !== (row.initial_start_time || '')) return true;
  if ((row.end_time || '') !== (row.initial_end_time || '')) return true;
  if (Number(row.break_minutes || 0) !== Number(row.initial_break_minutes || 0)) return true;
  if ((row.remarks || '').trim() !== (row.initial_remarks || '').trim()) return true;

  if (row.user_type === 'member') {
    if ((row.status || 'present') !== (row.initial_status || 'present')) return true;
    if (Boolean(row.has_meal) !== Boolean(row.initial_has_meal)) return true;
    if (Boolean(row.has_pickup) !== Boolean(row.initial_has_pickup)) return true;
    if (Boolean(row.has_dropoff) !== Boolean(row.initial_has_dropoff)) return true;
  }

  return false;
};

export function AttendanceDayPage({
  currentDate: externalDate,
  onDateChange: externalSetDate,
}: AttendanceDayPageProps) {
  const { selectedOfficeId, offices } = useOffice();
  const { showAlert } = useAlert();
  const [internalDate, setInternalDate] = useState(() => getCurrentJSTDateOnly());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AttendanceDayRow[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'staff' | 'member'>('all');

  const currentDate = externalDate || internalDate;
  const setDate = useCallback(
    (date: string) => {
      if (externalSetDate) {
        externalSetDate(date);
      } else {
        setInternalDate(date);
      }
    },
    [externalSetDate]
  );

  const targetOfficeId = selectedOfficeId || (offices.length > 0 ? offices[0].id : '');
  const currentOffice = useMemo(() => {
    return offices.find(o => o.id === targetOfficeId) || null;
  }, [offices, targetOfficeId]);

  const fetchData = useCallback(async () => {
    if (!targetOfficeId || !currentDate) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const dateParts = currentDate.substring(0, 10).split('-');
      const y = parseInt(dateParts[0], 10);
      const m = parseInt(dateParts[1], 10);
      const d = parseInt(dateParts[2], 10);
      const targetDateObj = new Date(y, m - 1, d);
      const dow = targetDateObj.getDay(); // 0: 日 〜 6: 土

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
        supabase.from('staffs').select('*').or('is_deleted.eq.false,is_deleted.is.null').order('code', { ascending: true }),
        supabase.from('office_staff_settings').select('*').eq('office_id', targetOfficeId),
        supabase.from('staff_basic_schedules').select('*').eq('office_id', targetOfficeId),
        supabase
          .from('staff_exception_schedules')
          .select('*')
          .eq('office_id', targetOfficeId)
          .eq('target_date', currentDate),
        supabase.from('members').select('*').or('is_deleted.eq.false,is_deleted.is.null').order('code', { ascending: true }),
        supabase.from('office_member_settings').select('*').eq('office_id', targetOfficeId),
        supabase.from('member_basic_schedules').select('*').eq('office_id', targetOfficeId),
        supabase
          .from('member_exception_schedules')
          .select('*')
          .eq('office_id', targetOfficeId)
          .eq('target_date', currentDate),
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

      // Build unified rows with date: currentDate for DataTable filter
      const unifiedRows: AttendanceDayRow[] = [];

      // 1. Staff rows
      targetStaffs.forEach(staff => {
        const exception = staffExceptions.find(e => e.staff_id === staff.id);
        const basic = staffBasics.find(b => b.staff_id === staff.id && Number(b.day_of_week) === dow);
        const isWeekday = dow >= 1 && dow <= 5;

        let isActive: boolean;
        let start: string;
        let end: string;
        let breakMin: number;
        let hours: number;
        let remarks: string;
        let hasException = false;
        let exceptionId: string | undefined;

        if (exception) {
          hasException = true;
          exceptionId = exception.id;
          isActive = exception.is_work_day ?? true;
          start = formatTimeForInput(exception.start_time);
          end = formatTimeForInput(exception.end_time);
          breakMin = exception.break_minutes ?? (isActive ? 60 : 0);
          hours = exception.scheduled_hours !== null && exception.scheduled_hours !== undefined
            ? Number(exception.scheduled_hours)
            : computeHours(start, end, breakMin, isActive);
          remarks = exception.remarks || '';
        } else {
          // 基本予定テーブルのデータをデフォルト表示
          isActive = basic ? (basic.is_work_day ?? true) : isWeekday;
          start = basic ? formatTimeForInput(basic.start_time) : (isActive ? '08:30' : '');
          end = basic ? formatTimeForInput(basic.end_time) : (isActive ? '17:30' : '');
          breakMin = basic ? (basic.break_minutes ?? 60) : (isActive ? 60 : 0);
          hours = basic?.scheduled_hours !== null && basic?.scheduled_hours !== undefined
            ? Number(basic.scheduled_hours)
            : computeHours(start, end, breakMin, isActive);
          remarks = basic?.remarks || '';
        }

        unifiedRows.push({
          id: `staff-${staff.id}`,
          date: currentDate,
          target_date: currentDate,
          user_type: 'staff',
          person_id: staff.id,
          code: staff.code || '',
          name: staff.name,
          yomigana: staff.yomigana || '',
          is_active: isActive,
          start_time: start,
          end_time: end,
          break_minutes: breakMin,
          calculated_hours: hours,
          remarks: remarks,
          has_exception_record: hasException,
          exception_id: exceptionId,
          initial_is_active: isActive,
          initial_start_time: start,
          initial_end_time: end,
          initial_break_minutes: breakMin,
          initial_remarks: remarks,
        });
      });

      // 2. Member rows
      targetMembers.forEach(member => {
        const exception = memberExceptions.find(e => e.member_id === member.id);
        const basic = memberBasics.find(b => b.member_id === member.id && Number(b.day_of_week) === dow);
        const isWeekday = dow >= 1 && dow <= 5;

        let isActive: boolean;
        let status: string;
        let start: string;
        let end: string;
        let breakMin: number;
        let hours: number;
        let hasMeal: boolean;
        let hasPickup: boolean;
        let hasDropoff: boolean;
        let remarks: string;
        let hasException = false;
        let exceptionId: string | undefined;

        if (exception) {
          hasException = true;
          exceptionId = exception.id;
          isActive = exception.is_scheduled ?? true;
          status = exception.status || (isActive ? 'present' : 'absent');
          start = formatTimeForInput(exception.start_time);
          end = formatTimeForInput(exception.end_time);
          breakMin = exception.break_minutes ?? (isActive ? 60 : 0);
          hours = exception.service_hours !== null && exception.service_hours !== undefined
            ? Number(exception.service_hours)
            : computeHours(start, end, breakMin, isActive);
          hasMeal = exception.has_meal ?? false;
          hasPickup = exception.has_pickup ?? false;
          hasDropoff = exception.has_dropoff ?? false;
          remarks = exception.remarks || '';
        } else {
          // 基本予定テーブルのデータをデフォルト表示
          isActive = basic ? (basic.is_scheduled ?? true) : isWeekday;
          status = basic?.status || (isActive ? 'present' : 'absent');
          start = basic ? formatTimeForInput(basic.start_time) : (isActive ? '09:30' : '');
          end = basic ? formatTimeForInput(basic.end_time) : (isActive ? '15:30' : '');
          breakMin = basic ? (basic.break_minutes ?? 60) : (isActive ? 60 : 0);
          hours = basic?.service_hours !== null && basic?.service_hours !== undefined
            ? Number(basic.service_hours)
            : computeHours(start, end, breakMin, isActive);
          hasMeal = basic?.has_meal ?? isActive;
          hasPickup = basic?.has_pickup ?? false;
          hasDropoff = basic?.has_dropoff ?? false;
          remarks = basic?.remarks || '';
        }

        unifiedRows.push({
          id: `member-${member.id}`,
          date: currentDate,
          target_date: currentDate,
          user_type: 'member',
          person_id: member.id,
          code: member.code || '',
          name: member.name,
          yomigana: member.yomigana || '',
          is_active: isActive,
          status: status,
          start_time: start,
          end_time: end,
          break_minutes: breakMin,
          calculated_hours: hours,
          has_meal: hasMeal,
          has_pickup: hasPickup,
          has_dropoff: hasDropoff,
          remarks: remarks,
          has_exception_record: hasException,
          exception_id: exceptionId,
          initial_is_active: isActive,
          initial_status: status,
          initial_start_time: start,
          initial_end_time: end,
          initial_break_minutes: breakMin,
          initial_has_meal: hasMeal,
          initial_has_pickup: hasPickup,
          initial_has_dropoff: hasDropoff,
          initial_remarks: remarks,
        });
      });

      setData(unifiedRows);
    } catch (err) {
      console.error('Failed to load daily attendance data:', err);
      showAlert('データの取得に失敗しました。', 'error');
    } finally {
      setLoading(false);
    }
  }, [targetOfficeId, currentDate, showAlert]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // 単一行の例外登録処理
  const handleSaveSingleRow = useCallback(
    async (row: AttendanceDayRow) => {
      if (!targetOfficeId || !currentDate) return;

      try {
        if (row.user_type === 'staff') {
          const staffUpdate: Partial<StaffExceptionScheduleTableItem> = {
            office_id: targetOfficeId,
            staff_id: row.person_id,
            target_date: currentDate,
            is_work_day: row.is_active,
            start_time: formatTimeForDb(row.start_time),
            end_time: formatTimeForDb(row.end_time),
            break_minutes: Number(row.break_minutes) || 0,
            remarks: row.remarks || null,
          };
          const { error } = await supabase
            .from('staff_exception_schedules')
            .upsert([staffUpdate], { onConflict: 'office_id,staff_id,target_date' });
          if (error) throw error;
        } else {
          const memberUpdate: Partial<MemberExceptionScheduleTableItem> = {
            office_id: targetOfficeId,
            member_id: row.person_id,
            target_date: currentDate,
            is_scheduled: row.is_active,
            status: row.is_active ? (row.status || 'present') : 'absent',
            start_time: formatTimeForDb(row.start_time),
            end_time: formatTimeForDb(row.end_time),
            break_minutes: Number(row.break_minutes) || 0,
            has_meal: row.has_meal ?? false,
            has_pickup: row.has_pickup ?? false,
            has_dropoff: row.has_dropoff ?? false,
            remarks: row.remarks || null,
          };
          const { error } = await supabase
            .from('member_exception_schedules')
            .upsert([memberUpdate], { onConflict: 'office_id,member_id,target_date' });
          if (error) throw error;
        }

        showAlert(`${row.name} の例外予定を登録しました。`, 'success');
        await fetchData();
      } catch (err: unknown) {
        console.error('Error saving single exception schedule:', err);
        const errMsg = err instanceof Error ? err.message : 'エラー';
        showAlert(`保存に失敗しました: ${errMsg}`, 'error');
      }
    },
    [targetOfficeId, currentDate, showAlert, fetchData]
  );

  // 一括保存処理（項目が変更された行のみを例外予定テーブルへ登録）
  const handleBatchSave = useCallback(
    async (drafts: AttendanceDayRow[]) => {
      if (!targetOfficeId || !currentDate) return;

      try {
        const staffUpdates: Partial<StaffExceptionScheduleTableItem>[] = [];
        const memberUpdates: Partial<MemberExceptionScheduleTableItem>[] = [];

        // 項目が初期状態から変更された行のみを対象にする
        const changedRows = drafts.filter(row => isRowChanged(row));

        if (changedRows.length === 0) {
          showAlert('変更された項目はありません。');
          return;
        }

        changedRows.forEach(row => {
          if (row.user_type === 'staff') {
            staffUpdates.push({
              office_id: targetOfficeId,
              staff_id: row.person_id,
              target_date: currentDate,
              is_work_day: row.is_active,
              start_time: formatTimeForDb(row.start_time),
              end_time: formatTimeForDb(row.end_time),
              break_minutes: Number(row.break_minutes) || 0,
              remarks: row.remarks || null,
            });
          } else {
            memberUpdates.push({
              office_id: targetOfficeId,
              member_id: row.person_id,
              target_date: currentDate,
              is_scheduled: row.is_active,
              status: row.is_active ? (row.status || 'present') : 'absent',
              start_time: formatTimeForDb(row.start_time),
              end_time: formatTimeForDb(row.end_time),
              break_minutes: Number(row.break_minutes) || 0,
              has_meal: row.has_meal ?? false,
              has_pickup: row.has_pickup ?? false,
              has_dropoff: row.has_dropoff ?? false,
              remarks: row.remarks || null,
            });
          }
        });

        if (staffUpdates.length > 0) {
          const { error: staffErr } = await supabase
            .from('staff_exception_schedules')
            .upsert(staffUpdates, { onConflict: 'office_id,staff_id,target_date' });
          if (staffErr) throw staffErr;
        }

        if (memberUpdates.length > 0) {
          const { error: memberErr } = await supabase
            .from('member_exception_schedules')
            .upsert(memberUpdates, { onConflict: 'office_id,member_id,target_date' });
          if (memberErr) throw memberErr;
        }

        showAlert(`${currentDate} の例外予定（${changedRows.length}件）を登録・保存しました。`, 'success');
        await fetchData();
      } catch (err: unknown) {
        console.error('Error saving exception schedules:', err);
        const errMsg = err instanceof Error ? err.message : 'エラー';
        showAlert(`保存に失敗しました: ${errMsg}`, 'error');
      }
    },
    [targetOfficeId, currentDate, showAlert, fetchData]
  );

  // 例外解除処理（DBの例外レコードを削除し基本予定に戻す）
  const handleRevertException = useCallback(
    async (row: AttendanceDayRow) => {
      if (!row.has_exception_record) return;

      try {
        if (row.user_type === 'staff') {
          const { error } = await supabase
            .from('staff_exception_schedules')
            .delete()
            .eq('office_id', targetOfficeId)
            .eq('staff_id', row.person_id)
            .eq('target_date', currentDate);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('member_exception_schedules')
            .delete()
            .eq('office_id', targetOfficeId)
            .eq('member_id', row.person_id)
            .eq('target_date', currentDate);
          if (error) throw error;
        }

        showAlert(`${row.name} の例外設定を解除し、基本予定に戻しました。`, 'success');
        await fetchData();
      } catch (err: unknown) {
        console.error('Error reverting exception schedule:', err);
        const errMsg = err instanceof Error ? err.message : 'エラー';
        showAlert(`例外の解除に失敗しました: ${errMsg}`, 'error');
      }
    },
    [targetOfficeId, currentDate, showAlert, fetchData]
  );

  // Filtered rows by user_type
  const filteredData = useMemo(() => {
    if (filterType === 'staff') return data.filter(d => d.user_type === 'staff');
    if (filterType === 'member') return data.filter(d => d.user_type === 'member');
    return data;
  }, [data, filterType]);

  // Aggregate stats
  const stats = useMemo(() => {
    const staffRows = data.filter(d => d.user_type === 'staff');
    const memberRows = data.filter(d => d.user_type === 'member');

    const workingStaff = staffRows.filter(s => s.is_active).length;
    const attendingMember = memberRows.filter(m => m.is_active && m.status !== 'absent').length;
    const mealCount = memberRows.filter(m => m.is_active && m.has_meal && m.status !== 'absent').length;
    const pickupCount = memberRows.filter(m => m.is_active && m.has_pickup && m.status !== 'absent').length;
    const dropoffCount = memberRows.filter(m => m.is_active && m.has_dropoff && m.status !== 'absent').length;
    const exceptionCount = data.filter(d => d.has_exception_record).length;

    return {
      totalStaff: staffRows.length,
      workingStaff,
      totalMember: memberRows.length,
      attendingMember,
      mealCount,
      pickupCount,
      dropoffCount,
      exceptionCount,
    };
  }, [data]);

  const columns: Column<AttendanceDayRow>[] = useMemo(
    () => [
      {
        key: 'user_type',
        header: '識別',
        sortable: true,
        style: { width: '85px', textAlign: 'center' },
        render: item => {
          if (item.user_type === 'staff') {
            return (
              <span
                style={{
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                職員
              </span>
            );
          }
          return (
            <span
              style={{
                backgroundColor: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              利用者
            </span>
          );
        },
      },
      {
        key: 'code',
        header: 'コード',
        sortable: true,
        style: { width: '90px', textAlign: 'center' },
        render: item => item.code || '-',
      },
      {
        key: 'name',
        header: '氏名',
        sortable: true,
        sortKey: 'yomigana',
        style: { width: '130px' },
        render: item => <span style={{ fontWeight: '500' }}>{item.name}</span>,
      },
      {
        key: 'is_active',
        header: '予定 / 出勤',
        sortable: false,
        editable: true,
        inputType: 'text',
        style: { width: '100px', textAlign: 'center' },
        render: (item, draftData, updateData) => (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Input
              type="checkbox"
              checked={item.is_active}
              onChange={e => {
                const nextActive = e.target.checked;
                const nextStatus = item.user_type === 'member'
                  ? (nextActive ? (item.status === 'absent' ? 'present' : item.status || 'present') : 'absent')
                  : undefined;
                const hours = computeHours(item.start_time, item.end_time, item.break_minutes, nextActive);
                updateData(
                  draftData.map(d =>
                    d.id === item.id
                      ? {
                          ...d,
                          is_active: nextActive,
                          status: nextStatus !== undefined ? nextStatus : d.status,
                          calculated_hours: hours,
                        }
                      : d
                  )
                );
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: item.is_active ? 'bold' : 'normal', color: item.is_active ? 'inherit' : 'var(--color-text-muted)' }}>
              {item.user_type === 'staff' ? (item.is_active ? '出勤' : '休み') : (item.is_active ? '利用' : '休み')}
            </span>
          </label>
        ),
      },
      {
        key: 'status',
        header: '区分',
        sortable: false,
        editable: true,
        inputType: 'text',
        style: { width: '115px', textAlign: 'center' },
        render: (item, draftData, updateData) => {
          if (item.user_type === 'staff') {
            return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
          }
          return (
            <Select
              value={item.status || 'present'}
              options={STATUS_OPTIONS}
              onChange={e => {
                const val = e.target.value;
                const isAbsent = val === 'absent';
                const nextActive = !isAbsent;
                const hours = computeHours(item.start_time, item.end_time, item.break_minutes, nextActive);
                updateData(
                  draftData.map(d =>
                    d.id === item.id
                      ? {
                          ...d,
                          status: val,
                          is_active: nextActive,
                          calculated_hours: hours,
                        }
                      : d
                  )
                );
              }}
              style={{ fontSize: '12px', padding: '2px 4px' }}
            />
          );
        },
      },
      {
        key: 'start_time',
        header: '開始時間',
        sortable: false,
        editable: true,
        inputType: 'text',
        style: { width: '105px', textAlign: 'center' },
        render: (item, draftData, updateData) => (
          <Input
            type="time"
            value={item.start_time}
            disabled={!item.is_active}
            onChange={e => {
              const val = e.target.value;
              const hours = computeHours(val, item.end_time, item.break_minutes, item.is_active);
              updateData(
                draftData.map(d =>
                  d.id === item.id ? { ...d, start_time: val, calculated_hours: hours } : d
                )
              );
            }}
            style={{ width: '95px', textAlign: 'center', padding: '2px 4px' }}
          />
        ),
      },
      {
        key: 'end_time',
        header: '終了時間',
        sortable: false,
        editable: true,
        inputType: 'text',
        style: { width: '105px', textAlign: 'center' },
        render: (item, draftData, updateData) => (
          <Input
            type="time"
            value={item.end_time}
            disabled={!item.is_active}
            onChange={e => {
              const val = e.target.value;
              const hours = computeHours(item.start_time, val, item.break_minutes, item.is_active);
              updateData(
                draftData.map(d =>
                  d.id === item.id ? { ...d, end_time: val, calculated_hours: hours } : d
                )
              );
            }}
            style={{ width: '95px', textAlign: 'center', padding: '2px 4px' }}
          />
        ),
      },
      {
        key: 'break_minutes',
        header: '休憩(分)',
        sortable: false,
        editable: true,
        inputType: 'number',
        style: { width: '80px', textAlign: 'right' },
        render: (item, draftData, updateData) => (
          <Input
            type="number"
            step="15"
            min="0"
            max="240"
            value={item.break_minutes ?? 0}
            disabled={!item.is_active}
            onChange={e => {
              const val = Number(e.target.value) || 0;
              const hours = computeHours(item.start_time, item.end_time, val, item.is_active);
              updateData(
                draftData.map(d =>
                  d.id === item.id ? { ...d, break_minutes: val, calculated_hours: hours } : d
                )
              );
            }}
            style={{ width: '65px', textAlign: 'right', padding: '2px 4px' }}
          />
        ),
      },
      {
        key: 'calculated_hours',
        header: '時間(h)',
        sortable: false,
        style: { width: '75px', textAlign: 'right' },
        render: item => {
          if (!item.is_active) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
          return <span style={{ fontWeight: 'bold' }}>{Number(item.calculated_hours || 0).toFixed(2)}</span>;
        },
      },
      {
        key: 'has_meal',
        header: '昼食',
        sortable: false,
        editable: true,
        inputType: 'text',
        style: { width: '65px', textAlign: 'center' },
        render: (item, draftData, updateData) => {
          if (item.user_type === 'staff') {
            return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
          }
          return (
            <Input
              type="checkbox"
              checked={item.has_meal ?? false}
              disabled={!item.is_active}
              onChange={e => {
                const val = e.target.checked;
                updateData(draftData.map(d => (d.id === item.id ? { ...d, has_meal: val } : d)));
              }}
            />
          );
        },
      },
      {
        key: 'has_pickup',
        header: '送迎(往)',
        sortable: false,
        editable: true,
        inputType: 'text',
        style: { width: '75px', textAlign: 'center' },
        render: (item, draftData, updateData) => {
          if (item.user_type === 'staff') {
            return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
          }
          return (
            <Input
              type="checkbox"
              checked={item.has_pickup ?? false}
              disabled={!item.is_active}
              onChange={e => {
                const val = e.target.checked;
                updateData(draftData.map(d => (d.id === item.id ? { ...d, has_pickup: val } : d)));
              }}
            />
          );
        },
      },
      {
        key: 'has_dropoff',
        header: '送迎(復)',
        sortable: false,
        editable: true,
        inputType: 'text',
        style: { width: '75px', textAlign: 'center' },
        render: (item, draftData, updateData) => {
          if (item.user_type === 'staff') {
            return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
          }
          return (
            <Input
              type="checkbox"
              checked={item.has_dropoff ?? false}
              disabled={!item.is_active}
              onChange={e => {
                const val = e.target.checked;
                updateData(draftData.map(d => (d.id === item.id ? { ...d, has_dropoff: val } : d)));
              }}
            />
          );
        },
      },
      {
        key: 'schedule_state',
        header: '種別',
        sortable: false,
        style: { width: '100px', textAlign: 'center' },
        render: item => {
          const changed = isRowChanged(item);
          if (changed) {
            return (
              <span
                style={{
                  backgroundColor: '#fef08a',
                  color: '#854d0e',
                  border: '1px solid #facc15',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
              >
                変更あり
              </span>
            );
          }
          if (item.has_exception_record) {
            return (
              <span
                style={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
              >
                例外設定済
              </span>
            );
          }
          return (
            <span
              style={{
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
              }}
            >
              基本予定
            </span>
          );
        },
      },
      {
        key: 'remarks',
        header: '備考',
        sortable: false,
        editable: true,
        inputType: 'text',
        style: { minWidth: '150px' },
        render: (item, draftData, updateData) => (
          <Input
            type="text"
            value={item.remarks || ''}
            placeholder="特記事項・理由等"
            onChange={e => {
              const val = e.target.value;
              updateData(draftData.map(d => (d.id === item.id ? { ...d, remarks: val } : d)));
            }}
            style={{ width: '100%', padding: '2px 6px', fontSize: '13px' }}
          />
        ),
      },
      {
        key: 'action',
        header: '操作',
        sortable: false,
        style: { width: '110px', textAlign: 'center' },
        render: item => {
          const changed = isRowChanged(item);
          if (changed) {
            return (
              <Button
                variant="primary"
                onClick={e => {
                  e.stopPropagation();
                  handleSaveSingleRow(item);
                }}
                style={{ fontSize: '11px', padding: '2px 8px' }}
                title="この行の変更を例外予定として登録します"
              >
                登録
              </Button>
            );
          }
          if (item.has_exception_record) {
            return (
              <Button
                variant="secondary"
                onClick={e => {
                  e.stopPropagation();
                  handleRevertException(item);
                }}
                style={{ fontSize: '11px', padding: '2px 6px', color: '#b91c1c' }}
                title="例外レコードを削除し、基本予定に戻します"
              >
                リセット
              </Button>
            );
          }
          return <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>-</span>;
        },
      },
    ],
    [handleSaveSingleRow, handleRevertException]
  );

  const headerRight = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      {/* Quick filter pills */}
      <div style={{ display: 'inline-flex', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '20px', padding: '2px' }}>
        <button
          type="button"
          onClick={() => setFilterType('all')}
          style={{
            border: 'none',
            background: filterType === 'all' ? 'var(--color-primary)' : 'transparent',
            color: filterType === 'all' ? '#fff' : 'inherit',
            fontWeight: filterType === 'all' ? 'bold' : 'normal',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          全員 ({data.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('staff')}
          style={{
            border: 'none',
            background: filterType === 'staff' ? 'var(--color-primary)' : 'transparent',
            color: filterType === 'staff' ? '#fff' : 'inherit',
            fontWeight: filterType === 'staff' ? 'bold' : 'normal',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          職員 ({stats.totalStaff})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('member')}
          style={{
            border: 'none',
            background: filterType === 'member' ? 'var(--color-primary)' : 'transparent',
            color: filterType === 'member' ? '#fff' : 'inherit',
            fontWeight: filterType === 'member' ? 'bold' : 'normal',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          利用者 ({stats.totalMember})
        </button>
      </div>

      {/* Summary indicators */}
      <div style={{ display: 'flex', gap: '12px', fontSize: '13px', alignItems: 'center' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>
          出勤職員: <strong>{stats.workingStaff}</strong> / {stats.totalStaff}名
        </span>
        <span style={{ color: 'var(--color-text-muted)' }}>
          通所利用者: <strong>{stats.attendingMember}</strong> / {stats.totalMember}名
        </span>
        <span style={{ color: 'var(--color-text-muted)' }}>
          昼食: <strong>{stats.mealCount}</strong>食
        </span>
        <span style={{ color: 'var(--color-text-muted)' }}>
          送迎: 往<strong>{stats.pickupCount}</strong> / 復<strong>{stats.dropoffCount}</strong>名
        </span>
      </div>
    </div>
  );

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage
      title="勤怠・出欠（日）"
      data={filteredData}
      columns={columns}
      emptyMessage={
        !targetOfficeId
          ? 'サイドバー上部で事業所を選択してください。'
          : `選択された事業所（${currentOffice?.short_name || currentOffice?.name || ''}）の所属者がいません。`
      }
      showSingleDateFilter={true}
      singleDate={currentDate}
      onSingleDateChange={setDate}
      dateFilterKey="date"
      headerRight={headerRight}
      onBatchSave={handleBatchSave}
      highlightInputColumns={true}
      hideAddButton={true}
      hideDeleteColumn={true}
      hideHeader={true}
    />
  );
}
