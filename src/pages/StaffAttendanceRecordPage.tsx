import { useMemo } from 'react';
import { DataPage, Select, Input, type Column } from '../components';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, OFFICE_STAFF_ROLE_OPTIONS } from '../constants';
import { useAlert } from '../contexts';
import { useStaffAttendanceRecords, computeActualWorkHours } from '../hooks';
import type { StaffAttendanceRecordRow } from '../types';

export function StaffAttendanceRecordPage() {
  const {
    currentDate,
    setCurrentDate,
    loading,
    records,
    batchSaveStaffAttendanceRecords,
  } = useStaffAttendanceRecords();

  const { showAlert } = useAlert();

  const roleOptions = useMemo(() => {
    return [
      { label: '未設定', value: '' },
      ...OFFICE_STAFF_ROLE_OPTIONS,
    ];
  }, []);

  const columns: Column<StaffAttendanceRecordRow>[] = [
    {
      key: 'staff_code',
      header: TABLE_COLUMNS.STAFF_CODE || '職員ID',
      sortKey: 'staff_code',
      sortable: true,
      editable: false,
      render: (item) => (
        <span style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>
          {item.staff_code || '-'}
        </span>
      ),
      style: { width: '110px', textAlign: 'center' },
    },
    {
      key: 'staff_name',
      header: TABLE_COLUMNS.NAME,
      sortKey: 'staff_yomigana',
      sortable: true,
      editable: false,
      render: (item) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 'bold' }}>{item.staff_name}</span>
          {item.default_role && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              （所定: {OFFICE_STAFF_ROLE_OPTIONS.find(o => o.value === item.default_role)?.label || item.default_role}）
            </span>
          )}
        </div>
      ),
      style: { width: '180px' },
    },
    {
      key: 'start_time',
      header: TABLE_COLUMNS.START_TIME || '出勤時刻',
      sortable: false,
      editable: false,
      render: (item, draftData, updateData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Input
            type="time"
            value={item.start_time || ''}
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
      editable: false,
      render: (item, draftData, updateData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Input
            type="time"
            value={item.end_time || ''}
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
      editable: false,
      render: (item, draftData, updateData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Input
            type="number"
            min={0}
            step={15}
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
      key: 'assigned_role',
      header: TABLE_COLUMNS.ASSIGNED_ROLE || '配置職種',
      sortable: false,
      editable: false,
      render: (item, draftData, updateData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Select
            value={item.assigned_role || ''}
            onChange={(e) => {
              const val = e.target.value;
              const next = draftData.map(d =>
                d.id === item.id ? { ...d, assigned_role: val } : d
              );
              updateData(next);
            }}
            options={roleOptions}
            style={{ width: '170px' }}
          />
        </div>
      ),
      style: { width: '190px', textAlign: 'center' },
    },
    {
      key: 'actual_work_hours',
      header: TABLE_COLUMNS.ACTUAL_WORK_HOURS || '実働時間',
      sortable: true,
      editable: false,
      render: (item) => {
        if (!item.actual_work_hours || item.actual_work_hours <= 0) {
          return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        }
        return (
          <span style={{ fontWeight: 'bold', color: '#1d4ed8' }}>
            {item.actual_work_hours.toFixed(1)} 時間
          </span>
        );
      },
      style: { width: '120px', textAlign: 'center' },
    },
    {
      key: 'is_saved',
      header: '状態',
      sortable: true,
      editable: false,
      render: (item) => {
        const hasTime = Boolean(item.start_time || item.end_time);
        if (!hasTime) {
          return (
            <span style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold',
              backgroundColor: '#f1f5f9',
              color: '#64748b'
            }}>
              未登録
            </span>
          );
        }
        if (item.is_saved) {
          return (
            <span style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold',
              backgroundColor: '#dcfce7',
              color: '#15803d'
            }}>
              登録済
            </span>
          );
        }
        return (
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold',
            backgroundColor: '#fef3c7',
            color: '#b45309'
          }}>
            未保存
          </span>
        );
      },
      style: { width: '100px', textAlign: 'center' },
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
      onSingleDateChange={setCurrentDate}
      hideDeleteColumn={true}
      hideAddButton={true}
      highlightInputColumns={true}
      hideHeader={true}
    />
  );
}
