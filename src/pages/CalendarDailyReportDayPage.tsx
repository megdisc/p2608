import { useState, useMemo, useCallback, useEffect } from 'react';
import { DataPage, Input, Select, DateInput, type Column } from '../components';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useAlert, useOffice } from '../contexts';
import {
  useStaffAttendanceRecords,
  useDailyWorkRecords,
  useDailyConfirmation,
  computeActualWorkHours,
  type DailyFlatRecord,
} from '../hooks';
import type { StaffAttendanceRecordRow } from '../types';

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

  // 勤怠・時間系（職員・利用者共通）
  status?: string; // 利用者: 'present' | 'absent', 職員: 'present'（出勤）
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

  const handleConfirm = useCallback(async () => {
    if (props.onConfirm) {
      await props.onConfirm();
      return;
    }
    if (staffRecords.length === 0 && memberRows.length === 0) {
      showAlert('対象者が登録されていない日付は確定対象外です。', 'error');
      return;
    }
    await dailyConfirm.confirmDate(currentDate);
    showAlert(`${currentDate}の日報を確定しました。`, 'success');
  }, [props, staffRecords.length, memberRows.length, dailyConfirm, currentDate, showAlert]);

  const handleUnconfirm = useCallback(async () => {
    if (props.onUnconfirm) {
      await props.onUnconfirm();
      return;
    }
    await dailyConfirm.unconfirmDate(currentDate);
    showAlert(`${currentDate}の確定を解除しました。`, 'success');
  }, [props, dailyConfirm, currentDate, showAlert]);

  const canEditRow = useCallback(() => !isConfirmed, [isConfirmed]);
  const canDeleteRow = useCallback(() => !isConfirmed, [isConfirmed]);

  // 職員と利用者をフラットな行配列へ統合
  const unifiedData: UnifiedDailyReportRow[] = useMemo(() => {
    const list: UnifiedDailyReportRow[] = [];

    // 1. 職員データ
    staffRecords.forEach(staff => {
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
        status: staff.start_time || staff.end_time ? 'present' : undefined,
        startTime: staff.start_time || '',
        endTime: staff.end_time || '',
        breakMinutes: staff.break_minutes ?? 60,
        hours: staff.actual_work_hours || 0,
        remarks: staff.remarks || '',
      });
    });

    // 2. 利用者データ
    memberRows.forEach(member => {
      const dbMem = dbMembers.find(m => m.id === member.userId);
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
        status: member.status || 'present',
        startTime: member.startTime || '',
        endTime: member.endTime || '',
        breakMinutes: member.breakMinutes ?? 60,
        hours: member.serviceHours || 0,
        contactDate: member.contactDate,
        isAbsenteeSupported: member.isAbsenteeSupported,
        hasMeal: member.hasMeal,
        hasPickup: member.hasPickup,
        hasDropoff: member.hasDropoff,
        isVisitSupported: member.isVisitSupported,
        isTrialUse: member.isTrialUse,
        isOffsiteWork: member.isOffsiteWork,
        remarks: member.remarks,
        projectId: member.projectId,
        taskId: member.taskId,
        workTime: member.workTime,
        workLocationId: member.workLocationId,
      });
    });

    return list;
  }, [staffRecords, memberRows, dbMembers, currentDate]);

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
      key: 'status',
      header: TABLE_COLUMNS.ATTENDANCE_STATUS || '出欠区分',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.userType === 'member' && item.isFirstInUser,
      inputType: 'select',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') {
          return <span>{item.startTime || item.endTime ? '出勤' : '-'}</span>;
        }
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Select
              disabled={isConfirmed}
              value={item.status === 'absent' ? 'absent' : 'present'}
              onChange={e => {
                const nextVal = e.target.value;
                const newDrafts = draftData.map(d => {
                  if (d.personId !== item.personId) return d;
                  if (nextVal === 'present' && !d.startTime && !d.endTime) {
                    return {
                      ...d,
                      status: nextVal,
                      startTime: '09:30',
                      endTime: '15:30',
                      breakMinutes: 60,
                      hours: 5.0,
                    };
                  } else if (nextVal === 'absent') {
                    return {
                      ...d,
                      status: nextVal,
                      startTime: '',
                      endTime: '',
                      breakMinutes: 0,
                      hours: 0,
                    };
                  }
                  return { ...d, status: nextVal };
                });
                updateData(newDrafts);
              }}
              options={[
                { label: '出席', value: 'present' },
                { label: '欠席', value: 'absent' },
              ]}
              style={{ width: '85px' }}
            />
          </div>
        );
      },
      style: item => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '95px',
      }),
    },
    {
      key: 'startTime',
      header: TABLE_COLUMNS.START_TIME || '開始時刻',
      sortable: false,
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.isFirstInUser,
      inputType: 'text',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
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
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.isFirstInUser,
      inputType: 'text',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
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
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.isFirstInUser,
      inputType: 'number',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
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
        if (!item.hours || Number(item.hours) <= 0) return '-';
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
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.userType === 'member' && item.isFirstInUser,
      inputType: 'checkbox',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
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
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.userType === 'member' && item.isFirstInUser,
      inputType: 'checkbox',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
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
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.userType === 'member' && item.isFirstInUser,
      inputType: 'checkbox',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
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
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.userType === 'member' && item.isFirstInUser,
      inputType: 'date',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
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
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.userType === 'member' && item.isFirstInUser,
      inputType: 'checkbox',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        const checked = Boolean(item.isAbsenteeSupported);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={e => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d => (d.personId === item.personId ? { ...d, isAbsenteeSupported: nextVal } : d));
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
                const newDrafts = draftData.map(d => (d.personId === item.personId ? { ...d, isVisitSupported: nextVal } : d));
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
                const newDrafts = draftData.map(d => (d.personId === item.personId ? { ...d, isTrialUse: nextVal } : d));
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
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.userType === 'member' && item.isFirstInUser,
      inputType: 'checkbox',
      render: (item, draftData, updateData) => {
        if (!item.isFirstInUser) return null;
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        const checked = Boolean(item.isOffsiteWork);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={e => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d => (d.personId === item.personId ? { ...d, isOffsiteWork: nextVal } : d));
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
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.userType === 'member' && !item.isEmptyRow,
      inputType: 'number',
      render: (item, draftData, updateData) => {
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        if (item.isEmptyRow) return '-';
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
      editable: (item: UnifiedDailyReportRow) => !isConfirmed && item.userType === 'member' && !item.isEmptyRow,
      inputType: 'select',
      render: (item, draftData, updateData) => {
        if (item.userType === 'staff') return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        if (item.isEmptyRow) return '-';
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Select
              disabled={isConfirmed}
              value={item.workLocationId || ''}
              onChange={e => {
                const nextVal = e.target.value;
                const newDrafts = draftData.map(d => (d.id === item.id ? { ...d, workLocationId: nextVal } : d));
                updateData(newDrafts);
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

  // 一括保存処理（職員・利用者をそれぞれのフック・テーブルへ保存）
  const handleBatchSave = async (drafts: UnifiedDailyReportRow[], deletedIds: string[]) => {
    try {
      // 1. 職員行の保存データ抽出
      const staffDrafts: StaffAttendanceRecordRow[] = [];
      const staffRowsInDraft = drafts.filter(d => d.userType === 'staff');
      staffRowsInDraft.forEach(s => {
        const orig = staffRecords.find(r => r.staff_id === s.personId);
        staffDrafts.push({
          id: orig?.id || `new-${s.personId}`,
          office_id: orig?.office_id || '',
          staff_id: s.personId,
          staff_code: s.userCode,
          staff_name: s.userName,
          staff_yomigana: s.userYomigana,
          default_role: orig?.default_role || '',
          date: currentDate,
          work_date: currentDate,
          start_time: s.startTime || '',
          end_time: s.endTime || '',
          break_minutes: s.breakMinutes ?? 60,
          assigned_role: orig?.assigned_role || '',
          actual_work_hours: s.hours || 0,
          remarks: s.remarks || '',
          is_saved: orig?.is_saved || false,
        });
      });

      if (staffDrafts.length > 0) {
        await batchSaveStaffAttendanceRecords(staffDrafts, []);
      }

      // 2. 利用者行の保存データ抽出
      const memberDrafts: DailyFlatRecord[] = [];
      const memberRowsInDraft = drafts.filter(d => d.userType === 'member');
      memberRowsInDraft.forEach(m => {
        const orig = memberRows.find(r => r.id === m.id);
        memberDrafts.push({
          id: m.id,
          userId: m.personId,
          userCode: m.userCode,
          userName: m.userName,
          userYomigana: m.userYomigana,
          date: currentDate,
          status: m.status || orig?.status || 'present',
          contactDate: m.contactDate ?? orig?.contactDate ?? '',
          isAbsenteeSupported: m.isAbsenteeSupported ?? orig?.isAbsenteeSupported ?? false,
          hasMeal: m.hasMeal ?? orig?.hasMeal ?? false,
          hasPickup: m.hasPickup ?? orig?.hasPickup ?? false,
          hasDropoff: m.hasDropoff ?? orig?.hasDropoff ?? false,
          isVisitSupported: m.isVisitSupported ?? orig?.isVisitSupported ?? false,
          isTrialUse: m.isTrialUse ?? orig?.isTrialUse ?? false,
          isOffsiteWork: m.isOffsiteWork ?? orig?.isOffsiteWork ?? false,
          remarks: m.remarks ?? orig?.remarks ?? '',
          startTime: m.startTime ?? orig?.startTime ?? '',
          endTime: m.endTime ?? orig?.endTime ?? '',
          breakMinutes: m.breakMinutes ?? orig?.breakMinutes ?? 60,
          serviceHours: m.hours ?? orig?.serviceHours ?? 0,
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

      if (memberDrafts.length > 0) {
        await batchSaveDailyWorkRecords(memberDrafts, deletedIds);
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
