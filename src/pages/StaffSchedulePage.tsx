import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert, useOffice } from '../contexts';
import { TABLE_COLUMNS, MESSAGES } from '../constants';
import type { StaffTableItem, OfficeStaffSettingTableItem } from '../types/db';

export type StaffScheduleRow = {
  id: string; // UUID or temp-staffId-day
  day_of_week: number; // 0: 日曜日 〜 6: 土曜日
  is_work_day: boolean;
  start_time: string; // '08:30'
  end_time: string; // '17:30'
  break_minutes: number;
  scheduled_hours: number;
  remarks: string;
};

export type StaffWithSchedule = {
  id: string; // staff_id
  code: string;
  name: string;
  yomigana: string;
  schedules: StaffScheduleRow[];
};

const DAY_CONFIGS: { day: number; label: string; color?: string }[] = [
  { day: 0, label: '日', color: '#ef4444' },
  { day: 1, label: '月' },
  { day: 2, label: '火' },
  { day: 3, label: '水' },
  { day: 4, label: '木' },
  { day: 5, label: '金' },
  { day: 6, label: '土', color: '#3b82f6' },
];

const formatTimeForInput = (timeStr?: string | null): string => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
};

const formatTimeForDb = (timeStr?: string | null): string | null => {
  if (!timeStr || timeStr.trim() === '') return null;
  return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
};

const computeScheduledHours = (
  start?: string | null,
  end?: string | null,
  breakMins: number | string = 0,
  isWorkDay: boolean = true
): number => {
  if (!isWorkDay || !start || !end) return 0;
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

export function StaffSchedulePage() {
  const { selectedOfficeId, offices } = useOffice();
  const [data, setData] = useState<StaffWithSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const targetOfficeId = selectedOfficeId || (offices.length > 0 ? offices[0].id : '');

  const currentOffice = useMemo(() => {
    return offices.find(o => o.id === targetOfficeId) || null;
  }, [offices, targetOfficeId]);

  const fetchData = useCallback(async () => {
    if (!targetOfficeId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // 1. 選択事業所に割り当てられている職員を取得
      const [staffRes, officeStaffRes, scheduleRes] = await Promise.all([
        supabase.from('staffs').select('*').or('is_deleted.eq.false,is_deleted.is.null').order('code', { ascending: true }),
        supabase.from('office_staff_settings').select('*').eq('office_id', targetOfficeId),
        supabase.from('staff_basic_schedules').select('*').eq('office_id', targetOfficeId),
      ]);

      if (staffRes.error) throw staffRes.error;
      if (officeStaffRes.error) throw officeStaffRes.error;
      if (scheduleRes.error) {
        console.warn('staff_basic_schedules query warning:', scheduleRes.error);
      }

      const activeStaffs: StaffTableItem[] = staffRes.data || [];
      const assignedOfficeStaffs: OfficeStaffSettingTableItem[] = officeStaffRes.data || [];
      const basicSchedules: any[] = scheduleRes.data || [];

      const assignedStaffIdSet = new Set(assignedOfficeStaffs.map(os => os.staff_id));
      const targetStaffs = activeStaffs.filter(s => assignedStaffIdSet.has(s.id));

      // 各職員ごとに日〜土の7行構成を構築
      const rows: StaffWithSchedule[] = targetStaffs.map(staff => {
        const staffSchedules = basicSchedules.filter(s => s.staff_id === staff.id);

        const schedules: StaffScheduleRow[] = DAY_CONFIGS.map(cfg => {
          const existing = staffSchedules.find(s => Number(s.day_of_week) === cfg.day);
          if (existing) {
            const isWork = existing.is_work_day ?? true;
            const startTime = formatTimeForInput(existing.start_time);
            const endTime = formatTimeForInput(existing.end_time);
            const breakMins = existing.break_minutes ?? (isWork ? 60 : 0);
            const calcHours = existing.scheduled_hours !== null && existing.scheduled_hours !== undefined
              ? Number(existing.scheduled_hours)
              : computeScheduledHours(startTime, endTime, breakMins, isWork);

            return {
              id: existing.id,
              day_of_week: cfg.day,
              is_work_day: isWork,
              start_time: startTime,
              end_time: endTime,
              break_minutes: breakMins,
              scheduled_hours: calcHours,
              remarks: existing.remarks || '',
            };
          }

          // 未設定日のデフォルトパターン（平日8:30〜17:30、土日休み）
          const isWeekday = cfg.day >= 1 && cfg.day <= 5;
          const defaultStart = isWeekday ? '08:30' : '';
          const defaultEnd = isWeekday ? '17:30' : '';
          const defaultBreak = isWeekday ? 60 : 0;
          const defaultHours = isWeekday ? 8.00 : 0;

          return {
            id: `temp-${staff.id}-${cfg.day}`,
            day_of_week: cfg.day,
            is_work_day: isWeekday,
            start_time: defaultStart,
            end_time: defaultEnd,
            break_minutes: defaultBreak,
            scheduled_hours: defaultHours,
            remarks: '',
          };
        });

        return {
          id: staff.id,
          code: staff.code || '',
          name: staff.name,
          yomigana: staff.yomigana || '',
          schedules,
        };
      });

      setData(rows);
    } catch (err: any) {
      console.error('Error fetching staff schedules:', err);
      showAlert('職員勤務予定データの取得に失敗しました。', 'error');
    } finally {
      setLoading(false);
    }
  }, [targetOfficeId, showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBatchSave = async (drafts: StaffWithSchedule[]) => {
    if (!targetOfficeId) return;

    try {
      const upsertRows: any[] = [];
      drafts.forEach(staff => {
        staff.schedules.forEach(sched => {
          upsertRows.push({
            ...(sched.id && !sched.id.startsWith('temp-') ? { id: sched.id } : {}),
            office_id: targetOfficeId,
            staff_id: staff.id,
            day_of_week: sched.day_of_week,
            is_work_day: sched.is_work_day,
            start_time: sched.is_work_day ? formatTimeForDb(sched.start_time) : null,
            end_time: sched.is_work_day ? formatTimeForDb(sched.end_time) : null,
            break_minutes: sched.is_work_day ? (Number(sched.break_minutes) || 0) : 0,
            scheduled_hours: sched.is_work_day ? (Number(sched.scheduled_hours) || 0) : 0,
            remarks: sched.remarks || null,
          });
        });
      });

      const { error } = await supabase
        .from('staff_basic_schedules')
        .upsert(upsertRows, { onConflict: 'office_id,staff_id,day_of_week' });

      if (error) throw error;

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
      await fetchData();
    } catch (err: any) {
      console.error('Error saving staff schedules:', err);
      showAlert(err.message || '職員勤務予定の保存に失敗しました。', 'error');
      throw err;
    }
  };

  const columns: Column<any>[] = useMemo(() => {
    return [
      {
        key: 'code',
        header: TABLE_COLUMNS.STAFF_ID,
        sortable: true,
        sortKey: 'code',
        editable: false,
        rowType: 'main',
        style: { width: '110px' },
      },
      {
        key: 'name',
        header: TABLE_COLUMNS.NAME,
        sortable: true,
        sortKey: 'yomigana',
        editable: false,
        rowType: 'main',
        style: { width: '140px' },
      },
      {
        key: 'day_of_week',
        header: '曜日',
        sortable: false,
        rowType: 'sub',
        editable: false,
        style: { width: '65px', textAlign: 'center' },
        render: (subItem: StaffScheduleRow) => {
          const cfg = DAY_CONFIGS.find(d => d.day === subItem.day_of_week);
          return (
            <span style={{ color: cfg?.color, fontWeight: 'bold' }}>
              {cfg?.label || ''}
            </span>
          );
        },
      },
      {
        key: 'is_work_day',
        header: '勤務',
        sortable: false,
        rowType: 'sub',
        inputType: 'checkbox',
        editable: true,
        style: { width: '55px', textAlign: 'center' },
        onCellChange: (val: any, subItem: StaffScheduleRow) => {
          const isWork = Boolean(val);
          const start = isWork ? (subItem.start_time || '08:30') : '';
          const end = isWork ? (subItem.end_time || '17:30') : '';
          const breakM = isWork ? (Number(subItem.break_minutes) || 60) : 0;
          const hours = isWork ? computeScheduledHours(start, end, breakM, true) : 0;
          return {
            is_work_day: isWork,
            start_time: start,
            end_time: end,
            break_minutes: breakM,
            scheduled_hours: hours,
          };
        },
      },
      {
        key: 'start_time',
        header: '始業時刻',
        sortable: false,
        rowType: 'sub',
        inputType: 'time',
        editable: (subItem: StaffScheduleRow) => subItem.is_work_day,
        style: { width: '100px', textAlign: 'center' },
        onCellChange: (val: any, subItem: StaffScheduleRow) => {
          const hours = computeScheduledHours(val, subItem.end_time, subItem.break_minutes, subItem.is_work_day);
          return { start_time: val, scheduled_hours: hours };
        },
      },
      {
        key: 'end_time',
        header: '終業時刻',
        sortable: false,
        rowType: 'sub',
        inputType: 'time',
        editable: (subItem: StaffScheduleRow) => subItem.is_work_day,
        style: { width: '100px', textAlign: 'center' },
        onCellChange: (val: any, subItem: StaffScheduleRow) => {
          const hours = computeScheduledHours(subItem.start_time, val, subItem.break_minutes, subItem.is_work_day);
          return { end_time: val, scheduled_hours: hours };
        },
      },
      {
        key: 'break_minutes',
        header: '休憩 (分)',
        sortable: false,
        rowType: 'sub',
        inputType: 'number',
        editable: (subItem: StaffScheduleRow) => subItem.is_work_day,
        style: { width: '85px', textAlign: 'right' },
        onCellChange: (val: any, subItem: StaffScheduleRow) => {
          const num = Number(val) || 0;
          const hours = computeScheduledHours(subItem.start_time, subItem.end_time, num, subItem.is_work_day);
          return { break_minutes: num, scheduled_hours: hours };
        },
      },
      {
        key: 'scheduled_hours',
        header: '勤務時間 (h)',
        sortable: false,
        rowType: 'sub',
        editable: false,
        style: { width: '105px', textAlign: 'right' },
        render: (subItem: StaffScheduleRow) => {
          if (!subItem.is_work_day) return '-';
          return Number(subItem.scheduled_hours || 0).toFixed(2);
        },
      },
      {
        key: 'remarks',
        header: '備考',
        sortable: false,
        rowType: 'sub',
        inputType: 'text',
        editable: true,
        style: { minWidth: '160px' },
      },
    ];
  }, []);

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage
      title="勤務予定"
      data={data}
      columns={columns}
      emptyMessage={
        !targetOfficeId
          ? 'サイドバー上部で事業所を選択してください。'
          : `選択された事業所（${currentOffice?.short_name || currentOffice?.name || ''}）に勤務する職員が登録されていません。「所属事業所」タブで職員の割当を行ってください。`
      }
      subItemsKey="schedules"
      mergeParentRow={true}
      onBatchSave={handleBatchSave}
      hideAddButton={true}
      hideDeleteColumn={true}
      hideHeader={true}
      highlightInputColumns={true}
    />
  );
}

