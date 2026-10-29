import { useMemo, useCallback } from 'react';
import { DataPage, Input, type Column } from '../components';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useAlert } from '../contexts';
import { useStaffAttendanceRecords, useDailyConfirmation, computeActualWorkHours } from '../hooks';
import type { StaffAttendanceRecordRow } from '../types';

export interface StaffAttendanceRecordPageProps {
  currentDate?: string;
  onDateChange?: (date: string) => void;
  isConfirmed?: boolean;
  onConfirm?: () => Promise<void> | void;
  onUnconfirm?: () => Promise<void> | void;
}

export function StaffAttendanceRecordPage(props: StaffAttendanceRecordPageProps = {}) {
  const {
    currentDate: hookCurrentDate,
    setCurrentDate: setHookCurrentDate,
    loading,
    records,
    batchSaveStaffAttendanceRecords,
  } = useStaffAttendanceRecords(props.currentDate);

  const currentDate = props.currentDate || hookCurrentDate;
  const handleDateChange = useCallback((date: string) => {
    if (props.onDateChange) {
      props.onDateChange(date);
    } else {
      setHookCurrentDate(date);
    }
  }, [props, setHookCurrentDate]);

  const { showAlert } = useAlert();
  const dailyConfirm = useDailyConfirmation(currentDate);
  const isConfirmed = props.isConfirmed !== undefined ? props.isConfirmed : dailyConfirm.isConfirmed;

  const handleConfirm = useCallback(async () => {
    if (props.onConfirm) {
      await props.onConfirm();
      return;
    }
    await dailyConfirm.confirmDate(currentDate);
    showAlert(`${currentDate}の日報を確定しました。`, 'success');
  }, [props, dailyConfirm, currentDate, showAlert]);

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

  const columns: Column<StaffAttendanceRecordRow>[] = [
    {
      key: 'staff_code',
      header: TABLE_COLUMNS.STAFF_CODE || '職員ID',
      sortKey: 'staff_code',
      sortable: true,
      editable: false,
      render: (item) => item.staff_code || '-',
      style: { width: '100px', textAlign: 'center' },
    },
    {
      key: 'staff_name',
      header: TABLE_COLUMNS.NAME,
      sortKey: 'staff_yomigana',
      sortable: true,
      editable: false,
      render: (item) => item.staff_name,
      style: { width: '160px' },
    },
    {
      key: 'start_time',
      header: TABLE_COLUMNS.START_TIME || '出勤時刻',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'text',
      render: (item, draftData, updateData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Input
            type="time"
            value={item.start_time || ''}
            disabled={isConfirmed}
            onChange={(e) => {
              const val = e.target.value;
              const actual = computeActualWorkHours(val, item.end_time, item.break_minutes);
              const next = draftData.map(d =>
                d.id === item.id ? { ...d, start_time: val, actual_work_hours: actual } : d
              );
              updateData(next);
            }}
            style={{ width: '120px', textAlign: 'center' }}
          />
        </div>
      ),
      style: { width: '140px', textAlign: 'center' },
    },
    {
      key: 'end_time',
      header: TABLE_COLUMNS.END_TIME || '退勤時刻',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'text',
      render: (item, draftData, updateData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Input
            type="time"
            value={item.end_time || ''}
            disabled={isConfirmed}
            onChange={(e) => {
              const val = e.target.value;
              const actual = computeActualWorkHours(item.start_time, val, item.break_minutes);
              const next = draftData.map(d =>
                d.id === item.id ? { ...d, end_time: val, actual_work_hours: actual } : d
              );
              updateData(next);
            }}
            style={{ width: '120px', textAlign: 'center' }}
          />
        </div>
      ),
      style: { width: '140px', textAlign: 'center' },
    },
    {
      key: 'break_minutes',
      header: TABLE_COLUMNS.BREAK_MINUTES || '休憩時間(分)',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'number',
      render: (item, draftData, updateData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Input
            type="number"
            min={0}
            step={15}
            disabled={isConfirmed}
            value={item.break_minutes !== undefined && item.break_minutes !== null ? item.break_minutes : 60}
            onChange={(e) => {
              const val = Number(e.target.value) || 0;
              const actual = computeActualWorkHours(item.start_time, item.end_time, val);
              const next = draftData.map(d =>
                d.id === item.id ? { ...d, break_minutes: val, actual_work_hours: actual } : d
              );
              updateData(next);
            }}
            style={{ width: '90px', textAlign: 'center' }}
          />
        </div>
      ),
      style: { width: '110px', textAlign: 'center' },
    },
    {
      key: 'actual_work_hours',
      header: TABLE_COLUMNS.STAFF_WORK_HOURS || TABLE_COLUMNS.ACTUAL_WORK_HOURS || '勤務時間 (h)',
      sortable: true,
      editable: false,
      render: (item) => {
        if (!item.actual_work_hours || Number(item.actual_work_hours) <= 0) {
          return '-';
        }
        return Number(item.actual_work_hours).toFixed(1);
      },
      style: { width: '120px', textAlign: 'center' },
    },
    {
      key: 'remarks',
      header: '備考・特記事項',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'text',
      render: (item, draftData, updateData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Input
            type="text"
            disabled={isConfirmed}
            value={item.remarks || ''}
            placeholder="特記事項・理由等"
            onChange={(e) => {
              const val = e.target.value;
              const next = draftData.map(d =>
                d.id === item.id ? { ...d, remarks: val } : d
              );
              updateData(next);
            }}
            style={{ width: '100%', minWidth: '140px' }}
          />
        </div>
      ),
      style: { minWidth: '150px' },
    },
  ];

  const handleBatchSave = async (drafts: StaffAttendanceRecordRow[], deletedIds: string[]) => {
    try {
      await batchSaveStaffAttendanceRecords(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  const statusBadge = useMemo(() => {
    if (records.length === 0) {
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
  }, [records.length, isConfirmed]);

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.STAFF_ATTENDANCE_RECORD}
      data={records}
      columns={columns}
      initialSort={{ key: 'staff_code', direction: 'asc' }}
      emptyMessage="所属職員が登録されていません。"
      onBatchSave={handleBatchSave}
      showSingleDateFilter={true}
      singleDate={currentDate}
      onSingleDateChange={handleDateChange}
      dateFilterKey="date"
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
      confirmDisabled={records.length === 0}
      statusBadge={statusBadge}
    />
  );
}
