import { useState, useMemo, useCallback, useEffect } from 'react';
import { DataPage, Input, Select, DateInput, type Column } from '../components';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useAlert, useOffice } from '../contexts';
import { supabase } from '../lib';
import {
  useStaffAttendanceRecords,
  useDailyWorkRecords,
  useDailyConfirmation,
  computeActualWorkHours,
  type DailyFlatRecord,
} from '../hooks';
import type {
  StaffAttendanceRecordRow,
  StaffExceptionScheduleTableItem,
  MemberExceptionScheduleTableItem,
} from '../types';

export interface CalendarDailyReportDayPageProps {
  currentDate?: string;
  onDateChange?: (date: string) => void;
  isConfirmed?: boolean;
  onConfirm?: () => Promise<void> | void;
  onUnconfirm?: () => Promise<void> | void;
}

export type UnifiedDailyReportRow = {
  id: string; // `staff-${staff_id}` or `member-${member_id}-${index}`
  date: string; // 日付 (DataTable singleDateFilter 用)
  userType: 'staff' | 'member';
  personId: string; // staff_id or userId
  userCode: string;
  userName: string;
  userYomigana: string;
  isFirstInUser: boolean;
  isLastInUser: boolean;
  isFirstInProject?: boolean;
  isLastInProject?: boolean;
  isEmptyRow?: boolean;

  // 出席・出勤（チェックボックスのみで管理）
  is_active: boolean; // 職員: 出勤=true / 休み=false, 利用者: 出席=true / 欠席=false

  // 就労区分（利用者専用: 通所 present, 施設外就労 offsite, 在宅 remote）
  workStyle?: 'present' | 'offsite' | 'remote';

  // 勤怠・時間系（職員・利用者共通）
  status?: string; // 利用者: 'present' | 'offsite' | 'remote' | 'absent', 職員: 'present'
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  hours?: number; // 職員: actual_work_hours, 利用者: serviceHours

  // 利用者専用加算・出欠系
  contactDate?: string;
  isAbsenteeSupported?: boolean;
  hasMeal?: boolean;
  hasPickup?: boolean;
  hasDropoff?: boolean;
  isVisitSupported?: boolean;
  isTrialUse?: boolean;
  isOffsiteWork?: boolean;
  remarks?: string;

  // 利用者専用案件・作業系
  projectId?: string;
  taskId?: string;
  workTime?: number;
  workLocationId?: string;
};

// 就労区分の選択肢
const WORK_STYLE_OPTIONS = [
  { label: '通所', value: 'present' },
  { label: '施設外就労', value: 'offsite' },
  { label: '在宅', value: 'remote' },
];

// 就労区分の自動判定
const getDeterminedWorkStyle = (
  isConfirmed: boolean,
  row: UnifiedDailyReportRow,
  allRows: UnifiedDailyReportRow[]
): string => {
  if (row.userType === 'staff') return '-';
  if (!row.is_active || row.status === 'absent') return '-';

  if (isConfirmed) {
    // 確定状態: 作業場所カラムの入力状態等によって自動判定・表示のみ
    const hasWorkLocation = allRows.some(
      r => r.personId === row.personId && r.workLocationId && r.workLocationId.trim() !== ''
    );
    if (hasWorkLocation || row.isOffsiteWork || row.status === 'offsite') {
      return '施設外就労';
    }
    if (row.status === 'remote' || row.workStyle === 'remote') {
      return '在宅';
    }
    return '通所';
  } else {
    // 未確定状態
    if (row.status === 'offsite' || row.isOffsiteWork || row.workStyle === 'offsite') {
      return '施設外就労';
    }
    if (row.status === 'remote' || row.workStyle === 'remote') {
      return '在宅';
    }
    return '通所';
  }
};

export function CalendarDailyReportDayPage(props: CalendarDailyReportDayPageProps = {}) {
  const { selectedOfficeId } = useOffice();
  const { showAlert } = useAlert();
  const [filterType, setFilterType] = useState<'all' | 'staff' | 'member'>('all');

  // 1. 日次確定フック
  const dailyConfirm = useDailyConfirmation(props.currentDate);
  const isConfirmed = props.isConfirmed !== undefined ? props.isConfirmed : dailyConfirm.isConfirmed;

  // 2. 職員勤務記録フック
  const {
    currentDate: staffHookDate,
    setCurrentDate: setStaffHookDate,
    loading: staffLoading,
    records: staffRecords,
    batchSaveStaffAttendanceRecords,
  } = useStaffAttendanceRecords(props.currentDate);

  // 3. 利用者利用記録フック
  const {
    dbMembers,
    dbProjects,
    dbPartners,
    loading: memberLoading,
    currentDate: memberHookDate,
    setCurrentDate: setMemberHookDate,
    displayData: memberRows,
    fetchMasters,
    fetchRecords: fetchMemberRecords,
    batchSaveDailyWorkRecords,
  } = useDailyWorkRecords(props.currentDate, isConfirmed);

  const currentDate = props.currentDate || staffHookDate || memberHookDate;

  const handleDateChange = useCallback(
    (date: string) => {
      if (props.onDateChange) {
        props.onDateChange(date);
      } else {
        setStaffHookDate(date);
        setMemberHookDate(date);
      }
    },
    [props, setStaffHookDate, setMemberHookDate]
  );

  useEffect(() => {
    fetchMasters(selectedOfficeId).catch(() => {
      showAlert('マスタデータ取得に失敗しました', 'error');
    });
  }, [fetchMasters, selectedOfficeId, showAlert]);

  useEffect(() => {
    fetchMemberRecords(currentDate, selectedOfficeId).catch(() => {
      showAlert('利用記録の取得に失敗しました', 'error');
    });
  }, [currentDate, selectedOfficeId, fetchMemberRecords, showAlert]);

  const canEditRow = useCallback(() => !isConfirmed, [isConfirmed]);
  const canDeleteRow = useCallback(() => !isConfirmed, [isConfirmed]);

  // 職員と利用者をフラットな行配列へ統合
  const unifiedData: UnifiedDailyReportRow[] = useMemo(() => {
    const list: UnifiedDailyReportRow[] = [];

    // 1. 職員データ
    staffRecords.forEach(staff => {
      const isActive = Boolean(
        staff.start_time || staff.end_time || (staff.actual_work_hours && Number(staff.actual_work_hours) > 0)
      );

      list.push({
        id: `staff-${staff.staff_id}`,
        date: currentDate,
        userType: 'staff',
        personId: staff.staff_id,
        userCode: staff.staff_code || '',
        userName: staff.staff_name || '',
        userYomigana: staff.staff_yomigana || '',
        isFirstInUser: true,
        isLastInUser: true,
        is_active: isActive,
        status: isActive ? 'present' : undefined,
        startTime: staff.start_time || '',
        endTime: staff.end_time || '',
        breakMinutes: staff.break_minutes ?? (isActive ? 60 : 0),
        hours: staff.actual_work_hours || 0,
        remarks: staff.remarks || '',
      });
    });

    // 2. 利用者データ
    memberRows.forEach(member => {
      const dbMem = dbMembers.find(m => m.id === member.userId);
      const isAbsent = member.status === 'absent';
      const isActive = !isAbsent;

      let initialWorkStyle: 'present' | 'offsite' | 'remote' = 'present';
      if (member.isOffsiteWork || member.status === 'offsite' || (member.workLocationId && member.workLocationId.trim() !== '')) {
        initialWorkStyle = 'offsite';
      } else if (member.status === 'remote') {
        initialWorkStyle = 'remote';
      }

      list.push({
        id: member.id,
        date: currentDate,
        userType: 'member',
        personId: member.userId,
        userCode: member.userCode || dbMem?.code || '',
        userName: member.userName || dbMem?.name || member.userId,
        userYomigana: member.userYomigana || dbMem?.yomigana || '',
        isFirstInUser: member.isFirstInUser ?? true,
        isLastInUser: member.isLastInUser ?? true,
        isFirstInProject: member.isFirstInProject,
        isLastInProject: member.isLastInProject,
        isEmptyRow: member.isEmptyRow,
        is_active: isActive,
        workStyle: initialWorkStyle,
        status: member.status || 'present',
        startTime: member.startTime || '',
        endTime: member.endTime || '',
        breakMinutes: member.breakMinutes ?? (isActive ? 60 : 0),
        hours: member.serviceHours || 0,
        contactDate: member.contactDate,
        isAbsenteeSupported: member.isAbsenteeSupported,
        hasMeal: member.hasMeal,
        hasPickup: member.hasPickup,
        hasDropoff: member.hasDropoff,
        isVisitSupported: member.isVisitSupported,
        isTrialUse: member.isTrialUse,
        isOffsiteWork: initialWorkStyle === 'offsite',
        remarks: member.remarks,
        projectId: member.projectId,
        taskId: member.taskId,
        workTime: member.workTime,
        workLocationId: member.workLocationId,
      });
    });

    return list;
  }, [staffRecords, memberRows, dbMembers, currentDate]);

  // 確定処理（スナップショット保存連動）
  const handleConfirm = useCallback(async () => {
    try {
      if (staffRecords.length === 0 && memberRows.length === 0) {
        showAlert('対象者が登録されていない日付は確定対象外です。', 'error');
        return;
      }

      // 1. 職員の現在データを勤務記録テーブル (staff_attendance_records) にスナップショット保存
      const staffDrafts: StaffAttendanceRecordRow[] = staffRecords.map(s => {
        const current = unifiedData.find(d => d.personId === s.staff_id);
        const isActive = current ? current.is_active : Boolean(s.start_time || s.end_time);
        const startTime = isActive ? (current?.startTime || s.start_time || '08:30') : '';
        const endTime = isActive ? (current?.endTime || s.end_time || '17:30') : '';
        const breakMin = isActive ? (current?.breakMinutes ?? s.break_minutes ?? 60) : 0;
        const hours = isActive ? (current?.hours ?? s.actual_work_hours ?? 0) : 0;

        return {
          ...s,
          start_time: startTime,
          end_time: endTime,
          break_minutes: breakMin,
          actual_work_hours: hours,
          remarks: current?.remarks ?? s.remarks ?? '',
        };
      });
      await batchSaveStaffAttendanceRecords(staffDrafts, []);

      // 2. 利用者の現在データを出欠記録テーブル (member_attendance_records) にスナップショット保存
      const memberDrafts: DailyFlatRecord[] = memberRows.map(m => {
        const current = unifiedData.find(d => d.id === m.id);
        const isActive = current ? current.is_active : (m.status !== 'absent');
        const status = isActive ? (current?.status || m.status || 'present') : 'absent';
        return {
          ...m,
          status,
          startTime: isActive ? (current?.startTime || m.startTime || '09:30') : '',
          endTime: isActive ? (current?.endTime || m.endTime || '15:30') : '',
          breakMinutes: isActive ? (current?.breakMinutes ?? m.breakMinutes ?? 60) : 0,
          serviceHours: isActive ? (current?.hours ?? m.serviceHours ?? 0) : 0,
          hasMeal: isActive ? (current?.hasMeal ?? m.hasMeal ?? false) : false,
          hasPickup: isActive ? (current?.hasPickup ?? m.hasPickup ?? false) : false,
          hasDropoff: isActive ? (current?.hasDropoff ?? m.hasDropoff ?? false) : false,
          remarks: current?.remarks ?? m.remarks ?? '',
          isOffsiteWork: isActive ? (current?.isOffsiteWork ?? m.isOffsiteWork ?? false) : false,
        };
      });
      await batchSaveDailyWorkRecords(memberDrafts, []);

      // 3. 確定状態の更新
      if (props.onConfirm) {
        await props.onConfirm();
      } else {
        await dailyConfirm.confirmDate(currentDate);
      }

      showAlert(`${currentDate}の日報を確定しました。`, 'success');
    } catch (err) {
      console.error('Failed to confirm daily report:', err);
      showAlert('日報の確定処理に失敗しました。', 'error');
    }
  }, [
    staffRecords,
    memberRows,
    unifiedData,
    batchSaveStaffAttendanceRecords,
    batchSaveDailyWorkRecords,
    props,
    dailyConfirm,
    currentDate,
    showAlert,
  ]);

  // 確定解除処理
  const handleUnconfirm = useCallback(async () => {
    try {
      if (props.onUnconfirm) {
        await props.onUnconfirm();
      } else {
        await dailyConfirm.unconfirmDate(currentDate);
      }
      showAlert(`${currentDate}の確定を解除しました。`, 'success');
    } catch (err) {
      console.error('Failed to unconfirm daily report:', err);
      showAlert('日報の確定解除処理に失敗しました。', 'error');
    }
  }, [props, dailyConfirm, currentDate, showAlert]);

  // クイックフィルター適用
  const filteredData = useMemo(() => {
    if (filterType === 'staff') return unifiedData.filter(d => d.userType === 'staff');
    if (filterType === 'member') return unifiedData.filter(d => d.userType === 'member');
    return unifiedData;
  }, [unifiedData, filterType]);

  // カラム定義
  const columns: Column<UnifiedDailyReportRow>[] = [
    {
      key: 'userType',
      header: '識別',
      sortable: true,
      editable: false,
      render: item => (item.isFirstInUser ? (item.userType === 'staff' ? '職員' : '利用者') : ''),
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        width: '75px',
        textAlign: 'center',
      }),
    },
    {
      key: 'userCode',
      header: 'コード',
      sortable: true,
      editable: false,
      render: item => (item.isFirstInUser ? item.userCode || '-' : ''),
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        width: '90px',
        textAlign: 'center',
      }),
    },
    {
      key: 'userName',
      header: TABLE_COLUMNS.NAME,
      sortable: true,
      sortKey: 'userYomigana',
      editable: false,
      render: item => (item.isFirstInUser ? item.userName : ''),
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        minWidth: '130px',
      }),
    },
    {
      key: 'is_active',
      header: '出席・出勤',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.isFirstInUser,
      inputType: 'checkbox',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={item.is_active}
              onChange={e => {
                const nextActive = e.target.checked;
                const newDrafts = draftData.map(d => {
                  if (d.personId !== item.personId) return d;
                  if (d.userType === 'staff') {
                    if (nextActive) {
                      const startTime = d.startTime || '08:30';
                      const endTime = d.endTime || '17:30';
                      const breakMinutes = d.breakMinutes ?? 60;
                      const hours = computeActualWorkHours(startTime, endTime, breakMinutes);
                      return {
                        ...d,
                        is_active: true,
                        startTime,
                        endTime,
                        breakMinutes,
                        hours,
                      };
                    } else {
                      return {
                        ...d,
                        is_active: false,
                        startTime: '',
                        endTime: '',
                        breakMinutes: 0,
                        hours: 0,
                      };
                    }
                  } else {
                    // 利用者
                    if (nextActive) {
                      const nextStatus = d.status === 'absent' ? 'present' : (d.status || 'present');
                      const startTime = d.startTime || '09:30';
                      const endTime = d.endTime || '15:30';
                      const breakMinutes = d.breakMinutes ?? 60;
                      const hours = computeActualWorkHours(startTime, endTime, breakMinutes);
                      return {
                        ...d,
                        is_active: true,
                        status: nextStatus,
                        startTime,
                        endTime,
                        breakMinutes,
                        hours,
                      };
                    } else {
                      return {
                        ...d,
                        is_active: false,
                        status: 'absent',
                        startTime: '',
                        endTime: '',
                        breakMinutes: 0,
                        hours: 0,
                        hasMeal: false,
                        hasPickup: false,
                        hasDropoff: false,
                        isOffsiteWork: false,
                      };
                    }
                  }
                });
                updateData(newDrafts);
              }}
              style={{ cursor: isConfirmed ? 'not-allowed' : 'pointer' }}
            />
          </div>
        );
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '90px',
      }),
    },
    {
      key: 'workStyle',
      header: '就労区分',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) =>
        !isConfirmed && item.userType === 'member' && item.isFirstInUser && item.is_active,
      inputType: 'select',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') {
          return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        }
        if (!item.is_active || item.status === 'absent') {
          return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        }

        // 確定状態: 作業場所カラムの入力状態等によって自動判定・表示のみ
        if (isConfirmed) {
          const determined = getDeterminedWorkStyle(isConfirmed, item, draftData);
          return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <span>{determined}</span>
            </div>
          );
        }

        // 未確定状態: プルダウン選択（通所, 施設外就労, 在宅）
        const currentVal =
          item.status === 'offsite' || item.isOffsiteWork
            ? 'offsite'
            : item.status === 'remote'
            ? 'remote'
            : 'present';

        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Select
              disabled={isConfirmed}
              value={currentVal}
              onChange={e => {
                const nextVal = e.target.value as 'present' | 'offsite' | 'remote';
                const isOffsite = nextVal === 'offsite';
                const newDrafts = draftData.map(d => {
                  if (d.personId !== item.personId) return d;
                  return {
                    ...d,
                    status: nextVal,
                    workStyle: nextVal,
                    isOffsiteWork: isOffsite,
                  };
                });
                updateData(newDrafts);
              }}
              options={WORK_STYLE_OPTIONS}
              style={{ width: '105px' }}
            />
          </div>
        );
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '115px',
      }),
    },
    {
      key: 'startTime',
      header: TABLE_COLUMNS.START_TIME || '開始時刻',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.isFirstInUser && item.is_active,
      inputType: 'text',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (!item.is_active) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Input
              type="time"
              value={item.startTime || ''}
              disabled={isConfirmed}
              onChange={e => {
                const val = e.target.value;
                const actual = computeActualWorkHours(val, item.endTime || '', item.breakMinutes || 0);
                const next = draftData.map(d =>
                  d.personId === item.personId ? { ...d, startTime: val, hours: actual } : d
                );
                updateData(next);
              }}
              style={{ width: '105px', textAlign: 'center' }}
            />
          </div>
        );
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '115px',
      }),
    },
    {
      key: 'endTime',
      header: TABLE_COLUMNS.END_TIME || '終了時刻',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.isFirstInUser && item.is_active,
      inputType: 'text',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (!item.is_active) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Input
              type="time"
              value={item.endTime || ''}
              disabled={isConfirmed}
              onChange={e => {
                const val = e.target.value;
                const actual = computeActualWorkHours(item.startTime || '', val, item.breakMinutes || 0);
                const next = draftData.map(d =>
                  d.personId === item.personId ? { ...d, endTime: val, hours: actual } : d
                );
                updateData(next);
              }}
              style={{ width: '105px', textAlign: 'center' }}
            />
          </div>
        );
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '115px',
      }),
    },
    {
      key: 'breakMinutes',
      header: TABLE_COLUMNS.BREAK_MINUTES || '休憩(分)',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.isFirstInUser && item.is_active,
      inputType: 'number',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (!item.is_active) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Input
              type="number"
              min={0}
              step={15}
              disabled={isConfirmed}
              value={item.breakMinutes !== undefined && item.breakMinutes !== null ? item.breakMinutes : 60}
              onChange={e => {
                const val = Number(e.target.value) || 0;
                const actual = computeActualWorkHours(item.startTime || '', item.endTime || '', val);
                const next = draftData.map(d =>
                  d.personId === item.personId ? { ...d, breakMinutes: val, hours: actual } : d
                );
                updateData(next);
              }}
              style={{ width: '75px', textAlign: 'center' }}
            />
          </div>
        );
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '85px',
      }),
    },
    {
      key: 'hours',
      header: '時間(h)',
      sortable: true,
      editable: false,
      render: item => {
        if (!item.isFirstInUser) return null;
        if (!item.is_active || !item.hours || Number(item.hours) <= 0) return '-';
        return Number(item.hours).toFixed(1);
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '90px',
      }),
    },
    {
      key: 'hasMeal',
      header: TABLE_COLUMNS.MEAL || '食事',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) =>
        !isConfirmed && item.userType === 'member' && item.isFirstInUser && item.is_active,
      inputType: 'checkbox',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        if (!item.is_active) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        const checked = Boolean(item.hasMeal);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={e => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d => (d.personId === item.personId ? { ...d, hasMeal: nextVal } : d));
                updateData(newDrafts);
              }}
              style={{ cursor: isConfirmed ? 'not-allowed' : 'pointer' }}
            />
          </div>
        );
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '65px',
      }),
    },
    {
      key: 'hasPickup',
      header: TABLE_COLUMNS.PICKUP_OUTBOUND || '送迎(往)',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) =>
        !isConfirmed && item.userType === 'member' && item.isFirstInUser && item.is_active,
      inputType: 'checkbox',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        if (!item.is_active) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        const checked = Boolean(item.hasPickup);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={e => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d => (d.personId === item.personId ? { ...d, hasPickup: nextVal } : d));
                updateData(newDrafts);
              }}
              style={{ cursor: isConfirmed ? 'not-allowed' : 'pointer' }}
            />
          </div>
        );
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '75px',
      }),
    },
    {
      key: 'hasDropoff',
      header: TABLE_COLUMNS.DROPOFF_INBOUND || '送迎(復)',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) =>
        !isConfirmed && item.userType === 'member' && item.isFirstInUser && item.is_active,
      inputType: 'checkbox',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        if (!item.is_active) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        const checked = Boolean(item.hasDropoff);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={e => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d => (d.personId === item.personId ? { ...d, hasDropoff: nextVal } : d));
                updateData(newDrafts);
              }}
              style={{ cursor: isConfirmed ? 'not-allowed' : 'pointer' }}
            />
          </div>
        );
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '75px',
      }),
    },
    {
      key: 'contactDate',
      header: TABLE_COLUMNS.CONTACT_DATE || '欠席連絡日',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) =>
        !isConfirmed && item.userType === 'member' && item.isFirstInUser && !item.is_active,
      inputType: 'date',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        if (item.is_active) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <DateInput
              disabled={isConfirmed}
              value={item.contactDate || ''}
              onChange={newVal => {
                const newDrafts = draftData.map(d => (d.personId === item.personId ? { ...d, contactDate: newVal } : d));
                updateData(newDrafts);
              }}
              style={{ width: '125px' }}
            />
          </div>
        );
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '135px',
      }),
    },
    {
      key: 'isAbsenteeSupported',
      header: TABLE_COLUMNS.IS_ABSENTEE_SUPPORTED || '欠席時対応',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) =>
        !isConfirmed && item.userType === 'member' && item.isFirstInUser && !item.is_active,
      inputType: 'checkbox',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        if (item.is_active) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        const checked = Boolean(item.isAbsenteeSupported);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={e => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d =>
                  d.personId === item.personId ? { ...d, isAbsenteeSupported: nextVal } : d
                );
                updateData(newDrafts);
              }}
              style={{ cursor: isConfirmed ? 'not-allowed' : 'pointer' }}
            />
          </div>
        );
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '85px',
      }),
    },
    {
      key: 'isVisitSupported',
      header: '訪問支援',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.userType === 'member' && item.isFirstInUser,
      inputType: 'checkbox',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        const checked = Boolean(item.isVisitSupported);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={e => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d =>
                  d.personId === item.personId ? { ...d, isVisitSupported: nextVal } : d
                );
                updateData(newDrafts);
              }}
              style={{ cursor: isConfirmed ? 'not-allowed' : 'pointer' }}
            />
          </div>
        );
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '75px',
      }),
    },
    {
      key: 'isTrialUse',
      header: '体験利用',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.userType === 'member' && item.isFirstInUser,
      inputType: 'checkbox',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        const checked = Boolean(item.isTrialUse);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={e => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d =>
                  d.personId === item.personId ? { ...d, isTrialUse: nextVal } : d
                );
                updateData(newDrafts);
              }}
              style={{ cursor: isConfirmed ? 'not-allowed' : 'pointer' }}
            />
          </div>
        );
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '75px',
      }),
    },
    {
      key: 'isOffsiteWork',
      header: '施設外就労',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) =>
        !isConfirmed && item.userType === 'member' && item.isFirstInUser && item.is_active,
      inputType: 'checkbox',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        if (!item.is_active) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        const checked = Boolean(item.isOffsiteWork || item.status === 'offsite');
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={e => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d => {
                  if (d.personId !== item.personId) return d;
                  return {
                    ...d,
                    isOffsiteWork: nextVal,
                    status: nextVal ? 'offsite' : 'present',
                    workStyle: nextVal ? 'offsite' : 'present',
                  };
                });
                updateData(newDrafts);
              }}
              style={{ cursor: isConfirmed ? 'not-allowed' : 'pointer' }}
            />
          </div>
        );
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '85px',
      }),
    },
    {
      key: 'remarks',
      header: '備考・特記事項',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.isFirstInUser,
      inputType: 'text',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="text"
              disabled={isConfirmed}
              value={item.remarks || ''}
              placeholder="備考・特記事項等"
              onChange={e => {
                const nextVal = e.target.value;
                const newDrafts = draftData.map(d => (d.personId === item.personId ? { ...d, remarks: nextVal } : d));
                updateData(newDrafts);
              }}
              style={{ width: '140px' }}
            />
          </div>
        );
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '150px',
      }),
    },
    {
      key: 'projectId',
      header: TABLE_COLUMNS.PROJECT_NAME,
      sortable: false,
      editable: false,
      inputType: 'select',
      render: item => {
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        if (item.isEmptyRow) return '-';
        if (!item.isFirstInProject) return '';
        const project = dbProjects.find(p => p.id === item.projectId);
        return project ? project.name : '';
      },
      style: item => ({
        borderBottom: item.isLastInProject ? undefined : 'none',
        minWidth: '130px',
      }),
    },
    {
      key: 'taskId',
      header: TABLE_COLUMNS.TASK,
      sortable: false,
      editable: false,
      render: item => {
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        if (item.isEmptyRow) return '-';
        const project = dbProjects.find(p => p.id === item.projectId);
        const task = project?.tasks.find(t => t.id === item.taskId);
        return task?.task || '';
      },
      style: { minWidth: '120px' },
    },
    {
      key: 'workTime',
      header: TABLE_COLUMNS.WORK_TIME,
      sortable: false,
      editable: (item: UnifiedDailyReportRow) =>
        !isConfirmed && item.userType === 'member' && !item.isEmptyRow && item.is_active,
      inputType: 'number',
      render: (item, draftData, updateData) => {
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        if (item.isEmptyRow) return '-';
        if (!item.is_active) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Input
              type="number"
              min={0}
              step={0.5}
              disabled={isConfirmed}
              value={item.workTime !== undefined && item.workTime !== null ? item.workTime : 0}
              onChange={e => {
                const val = Number(e.target.value) || 0;
                const next = draftData.map(d => (d.id === item.id ? { ...d, workTime: val } : d));
                updateData(next);
              }}
              style={{ width: '75px', textAlign: 'center' }}
            />
          </div>
        );
      },
      style: { width: '90px', textAlign: 'center' },
    },
    {
      key: 'workLocationId',
      header: TABLE_COLUMNS.WORK_LOCATION || '作業場所',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) =>
        !isConfirmed && item.userType === 'member' && !item.isEmptyRow && item.is_active,
      inputType: 'select',
      render: (item, draftData, updateData) => {
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        if (item.isEmptyRow) return '-';
        if (!item.is_active) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Select
              disabled={isConfirmed}
              value={item.workLocationId || ''}
              onChange={e => {
                const nextVal = e.target.value;
                const baseDrafts = draftData.map(d => (d.id === item.id ? { ...d, workLocationId: nextVal } : d));
                // 作業場所が選択された場合、未確定状態なら自動で「施設外就労」に連動
                const userHasLocation = baseDrafts.some(
                  d => d.personId === item.personId && d.workLocationId && d.workLocationId.trim() !== ''
                );
                if (userHasLocation) {
                  updateData(
                    baseDrafts.map(d =>
                      d.personId === item.personId
                        ? {
                            ...d,
                            isOffsiteWork: true,
                            status: d.status === 'remote' ? d.status : 'offsite',
                            workStyle: 'offsite',
                          }
                        : d
                    )
                  );
                } else {
                  updateData(baseDrafts);
                }
              }}
              options={[
                { label: '選択してください', value: '' },
                ...dbPartners.map(p => ({ label: p.is_deleted ? `${p.name} (削除済)` : p.name, value: p.id })),
              ]}
              style={{ width: '100%', minWidth: '130px' }}
            />
          </div>
        );
      },
      style: { minWidth: '140px' },
    },
  ];

  // 一括保存処理（未確定時の保存：職員・利用者ともに例外予定テーブルへ差分登録、作業実績保存）
  const handleBatchSave = async (drafts: UnifiedDailyReportRow[], deletedIds: string[]) => {
    try {
      // 1. 職員行: 職員例外予定テーブル (staff_exception_schedules) への登録
      const staffRowsInDraft = drafts.filter(d => d.userType === 'staff');
      const staffExceptionUpserts: Partial<StaffExceptionScheduleTableItem>[] = [];

      staffRowsInDraft.forEach(s => {
        const orig = staffRecords.find(r => r.staff_id === s.personId);
        const officeId = orig?.office_id || selectedOfficeId;
        if (!officeId) return;

        const startTime = s.is_active && s.startTime ? (s.startTime.length === 5 ? `${s.startTime}:00` : s.startTime) : null;
        const endTime = s.is_active && s.endTime ? (s.endTime.length === 5 ? `${s.endTime}:00` : s.endTime) : null;
        const breakMin = s.is_active ? (Number(s.breakMinutes) || 0) : 0;
        const hours = s.is_active ? (Number(s.hours) || 0) : 0;

        staffExceptionUpserts.push({
          office_id: officeId,
          staff_id: s.personId,
          target_date: currentDate,
          is_work_day: s.is_active,
          start_time: startTime,
          end_time: endTime,
          break_minutes: breakMin,
          scheduled_hours: hours,
          remarks: s.remarks && s.remarks.trim() !== '' ? s.remarks.trim() : null,
        });
      });

      if (staffExceptionUpserts.length > 0) {
        const { error: sExcErr } = await supabase
          .from('staff_exception_schedules')
          .upsert(staffExceptionUpserts, { onConflict: 'office_id,staff_id,target_date' });
        if (sExcErr) throw sExcErr;
      }

      // 2. 利用者行: 利用者例外予定テーブル (member_exception_schedules) への登録
      const memberRowsInDraft = drafts.filter(d => d.userType === 'member');
      const memberExceptionMap = new Map<string, Partial<MemberExceptionScheduleTableItem>>();

      memberRowsInDraft.forEach(m => {
        if (!memberExceptionMap.has(m.personId)) {
          const officeId = selectedOfficeId;
          if (!officeId) return;

          const startTime = m.is_active && m.startTime ? (m.startTime.length === 5 ? `${m.startTime}:00` : m.startTime) : null;
          const endTime = m.is_active && m.endTime ? (m.endTime.length === 5 ? `${m.endTime}:00` : m.endTime) : null;
          const breakMin = m.is_active ? (Number(m.breakMinutes) || 0) : 0;
          const hours = m.is_active ? (Number(m.hours) || 0) : 0;
          const status = m.is_active ? (m.status || 'present') : 'absent';

          memberExceptionMap.set(m.personId, {
            office_id: officeId,
            member_id: m.personId,
            target_date: currentDate,
            is_scheduled: m.is_active,
            status: status,
            start_time: startTime,
            end_time: endTime,
            break_minutes: breakMin,
            service_hours: hours,
            has_meal: m.is_active ? Boolean(m.hasMeal) : false,
            has_pickup: m.is_active ? Boolean(m.hasPickup) : false,
            has_dropoff: m.is_active ? Boolean(m.hasDropoff) : false,
            remarks: m.remarks && m.remarks.trim() !== '' ? m.remarks.trim() : null,
          });
        }
      });

      const memberExcList = Array.from(memberExceptionMap.values());
      if (memberExcList.length > 0) {
        const { error: mExcErr } = await supabase
          .from('member_exception_schedules')
          .upsert(memberExcList, { onConflict: 'office_id,member_id,target_date' });
        if (mExcErr) throw mExcErr;
      }

      // 3. 作業実績 (daily_work_records) の保存
      const memberWorkDrafts: DailyFlatRecord[] = [];
      memberRowsInDraft.forEach(m => {
        const orig = memberRows.find(r => r.id === m.id);
        memberWorkDrafts.push({
          id: m.id,
          userId: m.personId,
          userCode: m.userCode,
          userName: m.userName,
          userYomigana: m.userYomigana,
          date: currentDate,
          status: m.is_active ? (m.status || orig?.status || 'present') : 'absent',
          contactDate: m.contactDate ?? orig?.contactDate ?? '',
          isAbsenteeSupported: m.isAbsenteeSupported ?? orig?.isAbsenteeSupported ?? false,
          hasMeal: m.is_active ? (m.hasMeal ?? orig?.hasMeal ?? false) : false,
          hasPickup: m.is_active ? (m.hasPickup ?? orig?.hasPickup ?? false) : false,
          hasDropoff: m.is_active ? (m.hasDropoff ?? orig?.hasDropoff ?? false) : false,
          isVisitSupported: m.isVisitSupported ?? orig?.isVisitSupported ?? false,
          isTrialUse: m.isTrialUse ?? orig?.isTrialUse ?? false,
          isOffsiteWork: m.is_active ? (m.isOffsiteWork ?? orig?.isOffsiteWork ?? false) : false,
          remarks: m.remarks ?? orig?.remarks ?? '',
          startTime: m.is_active ? (m.startTime ?? orig?.startTime ?? '') : '',
          endTime: m.is_active ? (m.endTime ?? orig?.endTime ?? '') : '',
          breakMinutes: m.is_active ? (m.breakMinutes ?? orig?.breakMinutes ?? 60) : 0,
          serviceHours: m.is_active ? (m.hours ?? orig?.serviceHours ?? 0) : 0,
          projectId: m.projectId ?? orig?.projectId ?? '',
          projectYomigana: orig?.projectYomigana ?? '',
          projectType: orig?.projectType ?? '',
          taskId: m.taskId ?? orig?.taskId ?? '',
          workLocationId: m.workLocationId ?? orig?.workLocationId,
          workTime: m.workTime ?? orig?.workTime ?? 0,
          isSaved: orig?.isSaved ?? false,
          isFirstInUser: m.isFirstInUser,
          isLastInUser: m.isLastInUser,
          isFirstInProject: m.isFirstInProject,
          isLastInProject: m.isLastInProject,
          isEmptyRow: m.isEmptyRow,
        });
      });

      if (memberWorkDrafts.length > 0) {
        await batchSaveDailyWorkRecords(memberWorkDrafts, deletedIds);
      }

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error('Failed to batch save daily report:', err);
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  // 確定状態バッジ
  const statusBadge = useMemo(() => {
    if (unifiedData.length === 0) {
      return (
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 'bold',
            backgroundColor: '#f3f4f6',
            color: '#4b5563',
          }}
        >
          対象外
        </span>
      );
    }
    if (isConfirmed) {
      return (
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 'bold',
            backgroundColor: '#e0e7ff',
            color: '#3730a3',
          }}
        >
          確定済
        </span>
      );
    }
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 'bold',
          backgroundColor: '#fef3c7',
          color: '#92400e',
        }}
      >
        暫定
      </span>
    );
  }, [unifiedData.length, isConfirmed]);

  // ヘッダー右側のクイックフィルターピル
  const headerRight = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div
        style={{
          display: 'inline-flex',
          backgroundColor: 'var(--color-bg-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '2px',
          border: '1px solid var(--color-border)',
        }}
      >
        <button
          type="button"
          onClick={() => setFilterType('all')}
          style={{
            border: 'none',
            background: filterType === 'all' ? 'var(--color-bg-inverse)' : 'transparent',
            color: filterType === 'all' ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
            fontWeight: filterType === 'all' ? 'var(--weight-heading)' : 'normal',
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-body)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          すべて ({unifiedData.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('staff')}
          style={{
            border: 'none',
            background: filterType === 'staff' ? 'var(--color-bg-inverse)' : 'transparent',
            color: filterType === 'staff' ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
            fontWeight: filterType === 'staff' ? 'var(--weight-heading)' : 'normal',
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-body)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          職員 ({staffRecords.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('member')}
          style={{
            border: 'none',
            background: filterType === 'member' ? 'var(--color-bg-inverse)' : 'transparent',
            color: filterType === 'member' ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
            fontWeight: filterType === 'member' ? 'var(--weight-heading)' : 'normal',
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-body)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          利用者 ({memberRows.length})
        </button>
      </div>
    </div>
  );

  if (staffLoading || memberLoading) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.TAB_DAILY_REPORT || '日報'}
      data={filteredData}
      columns={columns}
      initialSort={{ key: 'userCode', direction: 'asc' }}
      emptyMessage="所属職員および利用者が登録されていません。"
      onBatchSave={handleBatchSave}
      showSingleDateFilter={true}
      singleDate={currentDate}
      onSingleDateChange={handleDateChange}
      dateFilterKey="date"
      headerRight={headerRight}
      hideDeleteColumn={true}
      hideAddButton={true}
      highlightInputColumns={true}
      hideHeader={true}
      canEditRow={canEditRow}
      canDeleteRow={canDeleteRow}
      showRestrictionColumn={true}
      restrictionTooltipText="確定済のため変更不可"
      isConfirmed={isConfirmed}
      onConfirm={handleConfirm}
      onUnconfirm={handleUnconfirm}
      confirmDisabled={unifiedData.length === 0}
      statusBadge={statusBadge}
    />
  );
}

  // 確定状態バッジ
  const statusBadge = useMemo(() => {
    if (unifiedData.length === 0) {
      return (
        <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#f3f4f6', color: '#4b5563' }}>
          対象外
        </span>
      );
    }
    if (isConfirmed) {
      return (
        <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
          確定済
        </span>
      );
    }
    return (
      <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#fef3c7', color: '#92400e' }}>
        暫定
      </span>
    );
  }, [unifiedData.length, isConfirmed]);

  // ヘッダー右側のクイックフィルターピル
  const headerRight = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div style={{ display: 'inline-flex', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-full)', padding: '2px', border: '1px solid var(--color-border)' }}>
        <button
          type="button"
          onClick={() => setFilterType('all')}
          style={{
            border: 'none',
            background: filterType === 'all' ? 'var(--color-bg-inverse)' : 'transparent',
            color: filterType === 'all' ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
            fontWeight: filterType === 'all' ? 'var(--weight-heading)' : 'normal',
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-body)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          すべて ({unifiedData.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('staff')}
          style={{
            border: 'none',
            background: filterType === 'staff' ? 'var(--color-bg-inverse)' : 'transparent',
            color: filterType === 'staff' ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
            fontWeight: filterType === 'staff' ? 'var(--weight-heading)' : 'normal',
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-body)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          職員 ({staffRecords.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('member')}
          style={{
            border: 'none',
            background: filterType === 'member' ? 'var(--color-bg-inverse)' : 'transparent',
            color: filterType === 'member' ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
            fontWeight: filterType === 'member' ? 'var(--weight-heading)' : 'normal',
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-body)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          利用者 ({memberRows.length})
        </button>
      </div>
    </div>
  );

  if (staffLoading || memberLoading) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.TAB_DAILY_REPORT || '日報'}
      data={filteredData}
      columns={columns}
      initialSort={{ key: 'userCode', direction: 'asc' }}
      emptyMessage="所属職員および利用者が登録されていません。"
      onBatchSave={handleBatchSave}
      showSingleDateFilter={true}
      singleDate={currentDate}
      onSingleDateChange={handleDateChange}
      dateFilterKey="date"
      headerRight={headerRight}
      hideDeleteColumn={true}
      hideAddButton={true}
      highlightInputColumns={true}
      hideHeader={true}
      canEditRow={canEditRow}
      canDeleteRow={canDeleteRow}
      showRestrictionColumn={true}
      restrictionTooltipText="確定済のため変更不可"
      isConfirmed={isConfirmed}
      onConfirm={handleConfirm}
      onUnconfirm={handleUnconfirm}
      confirmDisabled={unifiedData.length === 0}
      statusBadge={statusBadge}
    />
  );
}
