import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataPage, type Column } from '../components';
import { supabase } from '../lib';
import { useAlert, useOffice } from '../contexts';
import { TABLE_COLUMNS, MESSAGES } from '../constants';
import type { OfficeMemberSettingTableItem } from '../types/db';

export type MemberScheduleRow = {
  id: string; // UUID or temp-memberId-day
  day_of_week: number; // 0: 日曜日 〜 6: 土曜日
  is_scheduled: boolean;
  status: string; // 'present' | 'offsite' | 'remote' | 'absent'
  start_time: string; // '09:30'
  end_time: string; // '15:30'
  break_minutes: number;
  service_hours: number;
  has_meal: boolean;
  has_pickup: boolean;
  has_dropoff: boolean;
  remarks: string;
};

export type MemberWithSchedule = {
  id: string; // member_id
  code: string;
  name: string;
  yomigana: string;
  schedules: MemberScheduleRow[];
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

const STATUS_OPTIONS = [
  { value: 'present', label: '通所' },
  { value: 'offsite', label: '施設外就労' },
  { value: 'remote', label: '在宅利用' },
  { value: 'absent', label: '休み' },
];

const formatTimeForInput = (timeStr?: string | null): string => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
};

const formatTimeForDb = (timeStr?: string | null): string | null => {
  if (!timeStr || timeStr.trim() === '') return null;
  return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
};

const computeServiceHours = (
  start?: string | null,
  end?: string | null,
  breakMins: number | string = 0,
  isScheduled: boolean = true
): number => {
  if (!isScheduled || !start || !end) return 0;
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

export function MemberSchedulePage() {
  const { selectedOfficeId, offices } = useOffice();
  const [data, setData] = useState<MemberWithSchedule[]>([]);
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
      // 1. 選択事業所に割り当てられている利用者を取得
      const [memberRes, officeMemberRes, certRes, scheduleRes] = await Promise.all([
        supabase.from('members').select('*').or('is_deleted.eq.false,is_deleted.is.null').order('code', { ascending: true }),
        supabase.from('office_member_settings').select('*').eq('office_id', targetOfficeId),
        supabase.from('member_recipient_certificates').select('member_id').eq('copayment_office_id', targetOfficeId).or('is_deleted.eq.false,is_deleted.is.null'),
        supabase.from('member_basic_schedules').select('*').eq('office_id', targetOfficeId),
      ]);

      if (memberRes.error) throw memberRes.error;
      if (officeMemberRes.error) throw officeMemberRes.error;
      if (scheduleRes.error) {
        console.warn('member_basic_schedules query warning:', scheduleRes.error);
      }

      const activeMembers: any[] = memberRes.data || [];
      const assignedOfficeMembers: OfficeMemberSettingTableItem[] = officeMemberRes.data || [];
      const certMembers: { member_id: string }[] = certRes.data || [];
      const basicSchedules: any[] = scheduleRes.data || [];

      const assignedMemberIdSet = new Set<string>();
      assignedOfficeMembers.forEach(om => assignedMemberIdSet.add(om.member_id));
      certMembers.forEach(c => assignedMemberIdSet.add(c.member_id));

      const targetMembers = activeMembers.filter(m => assignedMemberIdSet.has(m.id));

      // 各利用者ごとに日〜土の7行構成を構築
      const rows: MemberWithSchedule[] = targetMembers.map(member => {
        const memberSchedules = basicSchedules.filter(s => s.member_id === member.id);

        const schedules: MemberScheduleRow[] = DAY_CONFIGS.map(cfg => {
          const existing = memberSchedules.find(s => Number(s.day_of_week) === cfg.day);
          if (existing) {
            const isSched = existing.is_scheduled ?? true;
            const startTime = formatTimeForInput(existing.start_time);
            const endTime = formatTimeForInput(existing.end_time);
            const breakMins = existing.break_minutes ?? (isSched ? 60 : 0);
            const calcHours = existing.service_hours !== null && existing.service_hours !== undefined
              ? Number(existing.service_hours)
              : computeServiceHours(startTime, endTime, breakMins, isSched);

            return {
              id: existing.id,
              day_of_week: cfg.day,
              is_scheduled: isSched,
              status: existing.status || (isSched ? 'present' : 'absent'),
              start_time: startTime,
              end_time: endTime,
              break_minutes: breakMins,
              service_hours: calcHours,
              has_meal: Boolean(existing.has_meal),
              has_pickup: Boolean(existing.has_pickup),
              has_dropoff: Boolean(existing.has_dropoff),
              remarks: existing.remarks || '',
            };
          }

          // 未設定日のデフォルトパターン（平日9:30〜15:30、土日休み）
          const isWeekday = cfg.day >= 1 && cfg.day <= 5;
          const defaultStart = isWeekday ? '09:30' : '';
          const defaultEnd = isWeekday ? '15:30' : '';
          const defaultBreak = isWeekday ? 60 : 0;
          const defaultHours = isWeekday ? 5.00 : 0;

          return {
            id: `temp-${member.id}-${cfg.day}`,
            day_of_week: cfg.day,
            is_scheduled: isWeekday,
            status: isWeekday ? 'present' : 'absent',
            start_time: defaultStart,
            end_time: defaultEnd,
            break_minutes: defaultBreak,
            service_hours: defaultHours,
            has_meal: isWeekday,
            has_pickup: false,
            has_dropoff: false,
            remarks: '',
          };
        });

        return {
          id: member.id,
          code: member.code || '',
          name: member.name,
          yomigana: member.yomigana || '',
          schedules,
        };
      });

      setData(rows);
    } catch (err: any) {
      console.error('Error fetching member schedules:', err);
      showAlert('利用者利用予定データの取得に失敗しました。', 'error');
    } finally {
      setLoading(false);
    }
  }, [targetOfficeId, showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBatchSave = async (drafts: MemberWithSchedule[]) => {
    if (!targetOfficeId) return;

    try {
      const upsertRows: any[] = [];
      drafts.forEach(member => {
        member.schedules.forEach(sched => {
          upsertRows.push({
            ...(sched.id && !sched.id.startsWith('temp-') ? { id: sched.id } : {}),
            office_id: targetOfficeId,
            member_id: member.id,
            day_of_week: sched.day_of_week,
            is_scheduled: sched.is_scheduled,
            status: sched.status || 'present',
            start_time: sched.is_scheduled ? formatTimeForDb(sched.start_time) : null,
            end_time: sched.is_scheduled ? formatTimeForDb(sched.end_time) : null,
            break_minutes: sched.is_scheduled ? (Number(sched.break_minutes) || 0) : 0,
            service_hours: sched.is_scheduled ? (Number(sched.service_hours) || 0) : 0,
            has_meal: sched.is_scheduled ? Boolean(sched.has_meal) : false,
            has_pickup: sched.is_scheduled ? Boolean(sched.has_pickup) : false,
            has_dropoff: sched.is_scheduled ? Boolean(sched.has_dropoff) : false,
            remarks: sched.remarks || null,
          });
        });
      });

      const { error } = await supabase
        .from('member_basic_schedules')
        .upsert(upsertRows, { onConflict: 'office_id,member_id,day_of_week' });

      if (error) throw error;

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
      await fetchData();
    } catch (err: any) {
      console.error('Error saving member schedules:', err);
      showAlert(err.message || '利用者利用予定の保存に失敗しました。', 'error');
      throw err;
    }
  };

  const columns: Column<any>[] = useMemo(() => {
    return [
      {
        key: 'code',
        header: TABLE_COLUMNS.MEMBER_ID,
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
        rowType: 'sub',
        editable: false,
        style: { width: '65px', textAlign: 'center' },
        render: (subItem: MemberScheduleRow) => {
          const cfg = DAY_CONFIGS.find(d => d.day === subItem.day_of_week);
          return (
            <span style={{ color: cfg?.color, fontWeight: 'bold' }}>
              {cfg?.label || ''}
            </span>
          );
        },
      },
      {
        key: 'is_scheduled',
        header: '利用',
        rowType: 'sub',
        inputType: 'checkbox',
        editable: true,
        style: { width: '55px', textAlign: 'center' },
        onCellChange: (val: any, subItem: MemberScheduleRow) => {
          const isSched = Boolean(val);
          const start = isSched ? (subItem.start_time || '09:30') : '';
          const end = isSched ? (subItem.end_time || '15:30') : '';
          const breakM = isSched ? (Number(subItem.break_minutes) || 60) : 0;
          const hours = isSched ? computeServiceHours(start, end, breakM, true) : 0;
          return {
            is_scheduled: isSched,
            status: isSched ? (subItem.status === 'absent' ? 'present' : subItem.status) : 'absent',
            start_time: start,
            end_time: end,
            break_minutes: breakM,
            service_hours: hours,
            has_meal: isSched ? subItem.has_meal : false,
            has_pickup: isSched ? subItem.has_pickup : false,
            has_dropoff: isSched ? subItem.has_dropoff : false,
          };
        },
      },
      {
        key: 'status',
        header: '区分',
        rowType: 'sub',
        inputType: 'select',
        options: STATUS_OPTIONS,
        editable: (subItem: MemberScheduleRow) => subItem.is_scheduled,
        style: { width: '105px' },
      },
      {
        key: 'start_time',
        header: '開始時刻',
        rowType: 'sub',
        inputType: 'time',
        editable: (subItem: MemberScheduleRow) => subItem.is_scheduled,
        style: { width: '100px', textAlign: 'center' },
        onCellChange: (val: any, subItem: MemberScheduleRow) => {
          const hours = computeServiceHours(val, subItem.end_time, subItem.break_minutes, subItem.is_scheduled);
          return { start_time: val, service_hours: hours };
        },
      },
      {
        key: 'end_time',
        header: '終了時刻',
        rowType: 'sub',
        inputType: 'time',
        editable: (subItem: MemberScheduleRow) => subItem.is_scheduled,
        style: { width: '100px', textAlign: 'center' },
        onCellChange: (val: any, subItem: MemberScheduleRow) => {
          const hours = computeServiceHours(subItem.start_time, val, subItem.break_minutes, subItem.is_scheduled);
          return { end_time: val, service_hours: hours };
        },
      },
      {
        key: 'break_minutes',
        header: '休憩 (分)',
        rowType: 'sub',
        inputType: 'number',
        editable: (subItem: MemberScheduleRow) => subItem.is_scheduled,
        style: { width: '85px', textAlign: 'right' },
        onCellChange: (val: any, subItem: MemberScheduleRow) => {
          const num = Number(val) || 0;
          const hours = computeServiceHours(subItem.start_time, subItem.end_time, num, subItem.is_scheduled);
          return { break_minutes: num, service_hours: hours };
        },
      },
      {
        key: 'service_hours',
        header: '提供時間 (h)',
        rowType: 'sub',
        editable: false,
        style: { width: '105px', textAlign: 'right' },
        render: (subItem: MemberScheduleRow) => {
          if (!subItem.is_scheduled) return '-';
          return Number(subItem.service_hours || 0).toFixed(2);
        },
      },
      {
        key: 'has_meal',
        header: '昼食',
        rowType: 'sub',
        inputType: 'checkbox',
        editable: (subItem: MemberScheduleRow) => subItem.is_scheduled,
        style: { width: '55px', textAlign: 'center' },
      },
      {
        key: 'has_pickup',
        header: '送迎(往)',
        rowType: 'sub',
        inputType: 'checkbox',
        editable: (subItem: MemberScheduleRow) => subItem.is_scheduled,
        style: { width: '65px', textAlign: 'center' },
      },
      {
        key: 'has_dropoff',
        header: '送迎(復)',
        rowType: 'sub',
        inputType: 'checkbox',
        editable: (subItem: MemberScheduleRow) => subItem.is_scheduled,
        style: { width: '65px', textAlign: 'center' },
      },
      {
        key: 'remarks',
        header: '備考',
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
      title="利用予定"
      data={data}
      columns={columns}
      emptyMessage={
        !targetOfficeId
          ? 'サイドバー上部で事業所を選択してください。'
          : `選択された事業所（${currentOffice?.short_name || currentOffice?.name || ''}）に通所する利用者が登録されていません。「事業所」タブで利用者の割当を行ってください。`
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
