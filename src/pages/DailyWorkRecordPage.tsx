import { DataPage, Input, Select, DateInput, type Column } from '../components';
import { useEffect, useMemo, useCallback } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useAlert } from '../contexts';
import { useDailyWorkRecords, type DailyFlatRecord, computeActualWorkHours } from '../hooks';

export interface DailyWorkRecordPageProps {
  currentDate?: string;
  onDateChange?: (date: string) => void;
  isConfirmed?: boolean;
  onConfirm?: () => Promise<void> | void;
  onUnconfirm?: () => Promise<void> | void;
}

export function DailyWorkRecordPage(props: DailyWorkRecordPageProps = {}) {
  const { 
    dbMembers, 
    dbProjects, 
    dbPartners,
    loading, 
    currentDate: hookCurrentDate, 
    setCurrentDate: setHookCurrentDate, 
    displayData, 
    confirmedDates,
    confirmDate,
    unconfirmDate,
    fetchConfirmations,
    fetchMasters, 
    fetchRecords, 
    batchSaveDailyWorkRecords 
  } = useDailyWorkRecords(props.currentDate, props.isConfirmed);
  const { showAlert } = useAlert();

  const currentDate = props.currentDate || hookCurrentDate;
  const handleDateChange = useCallback((date: string) => {
    if (props.onDateChange) {
      props.onDateChange(date);
    } else {
      setHookCurrentDate(date);
    }
  }, [props, setHookCurrentDate]);

  useEffect(() => {
    fetchMasters().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
    fetchConfirmations();
  }, [fetchMasters, fetchConfirmations, showAlert]);

  useEffect(() => {
    fetchRecords(currentDate).catch(() => {
      showAlert('利用記録の取得に失敗しました', 'error');
    });
  }, [currentDate, fetchRecords, showAlert]);

  const isConfirmed = useMemo(() => {
    if (props.isConfirmed !== undefined) return props.isConfirmed;
    return confirmedDates.includes(currentDate);
  }, [props.isConfirmed, confirmedDates, currentDate]);

  const handleConfirm = useCallback(async () => {
    if (props.onConfirm) {
      await props.onConfirm();
      return;
    }
    if (displayData.length === 0) {
      showAlert('利用者が登録されていない日付は確定対象外です。', 'error');
      return;
    }
    await confirmDate(currentDate);
    showAlert(`${currentDate}の日報を確定しました。`, 'success');
  }, [props, displayData.length, confirmDate, currentDate, showAlert]);

  const handleUnconfirm = useCallback(async () => {
    if (props.onUnconfirm) {
      await props.onUnconfirm();
      return;
    }
    await unconfirmDate(currentDate);
    showAlert(`${currentDate}の確定を解除しました。`, 'success');
  }, [props, unconfirmDate, currentDate, showAlert]);

  const canEditRow = useCallback(() => !isConfirmed, [isConfirmed]);
  const canDeleteRow = useCallback(() => !isConfirmed, [isConfirmed]);

  const columns: Column<any>[] = [
    { 
      key: 'userCode', 
      header: TABLE_COLUMNS.MEMBER_CODE || '利用者ID', 
      sortKey: 'userCode',
      sortable: true,
      editable: false, 
      render: (item: any) => item.isFirstInUser ? (item.userCode || item.userId?.slice(0, 8) || '-') : '',
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        width: '100px',
        textAlign: 'center'
      })
    },
    { 
      key: 'userId', 
      header: TABLE_COLUMNS.NAME, 
      sortKey: 'userYomigana',
      editable: false, 
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...dbMembers.map(u => ({ label: u.name, value: u.id }))],
      render: (item: any) => item.isFirstInUser ? (dbMembers.find(u => u.id === item.userId)?.name || '') : '',
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none'
      })
    },
    {
      key: 'status',
      header: TABLE_COLUMNS.ATTENDANCE_STATUS || '出欠区分',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'select',
      render: (item: any, draftData: any[], updateData: (newData: any[]) => void) => {
        if (!item.isFirstInUser) return null;
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Select
              disabled={isConfirmed}
              value={item.status === 'absent' ? 'absent' : 'present'}
              onChange={(e) => {
                const nextVal = e.target.value;
                const newDrafts = draftData.map(d => {
                  if (d.userId !== item.userId) return d;
                  if (nextVal === 'present' && !d.startTime && !d.endTime) {
                    return {
                      ...d,
                      status: nextVal,
                      startTime: '09:30',
                      endTime: '15:30',
                      breakMinutes: 60,
                      serviceHours: 5.0,
                    };
                  } else if (nextVal === 'absent') {
                    return {
                      ...d,
                      status: nextVal,
                      startTime: '',
                      endTime: '',
                      breakMinutes: 0,
                      serviceHours: 0,
                    };
                  }
                  return { ...d, status: nextVal };
                });
                updateData(newDrafts);
              }}
              options={[
                { label: '出席', value: 'present' },
                { label: '欠席', value: 'absent' }
              ]}
              style={{ width: '85px' }}
            />
          </div>
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '95px'
      })
    },
    {
      key: 'startTime',
      header: TABLE_COLUMNS.START_TIME || '開始時刻',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'text',
      render: (item: any, draftData: any[], updateData: (newData: any[]) => void) => {
        if (!item.isFirstInUser) return null;
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Input
              type="time"
              value={item.startTime || ''}
              disabled={isConfirmed}
              onChange={(e) => {
                const val = e.target.value;
                const actual = computeActualWorkHours(val, item.endTime, item.breakMinutes);
                const next = draftData.map(d =>
                  d.userId === item.userId ? { ...d, startTime: val, serviceHours: actual } : d
                );
                updateData(next);
              }}
              style={{ width: '105px', textAlign: 'center' }}
            />
          </div>
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '115px'
      })
    },
    {
      key: 'endTime',
      header: TABLE_COLUMNS.END_TIME || '終了時刻',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'text',
      render: (item: any, draftData: any[], updateData: (newData: any[]) => void) => {
        if (!item.isFirstInUser) return null;
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Input
              type="time"
              value={item.endTime || ''}
              disabled={isConfirmed}
              onChange={(e) => {
                const val = e.target.value;
                const actual = computeActualWorkHours(item.startTime, val, item.breakMinutes);
                const next = draftData.map(d =>
                  d.userId === item.userId ? { ...d, endTime: val, serviceHours: actual } : d
                );
                updateData(next);
              }}
              style={{ width: '105px', textAlign: 'center' }}
            />
          </div>
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '115px'
      })
    },
    {
      key: 'breakMinutes',
      header: TABLE_COLUMNS.BREAK_MINUTES || '休憩(分)',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'number',
      render: (item: any, draftData: any[], updateData: (newData: any[]) => void) => {
        if (!item.isFirstInUser) return null;
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Input
              type="number"
              min={0}
              step={15}
              disabled={isConfirmed}
              value={item.breakMinutes !== undefined && item.breakMinutes !== null ? item.breakMinutes : 60}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                const actual = computeActualWorkHours(item.startTime, item.endTime, val);
                const next = draftData.map(d =>
                  d.userId === item.userId ? { ...d, breakMinutes: val, serviceHours: actual } : d
                );
                updateData(next);
              }}
              style={{ width: '80px', textAlign: 'center' }}
            />
          </div>
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '90px'
      })
    },
    {
      key: 'serviceHours',
      header: TABLE_COLUMNS.SERVICE_HOURS || '利用時間 (h)',
      sortable: true,
      editable: false,
      render: (item: any) => {
        if (!item.isFirstInUser) return null;
        if (!item.serviceHours || Number(item.serviceHours) <= 0) return '-';
        return Number(item.serviceHours).toFixed(1);
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '100px'
      })
    },
    {
      key: 'contactDate',
      header: TABLE_COLUMNS.CONTACT_DATE || '欠席連絡日',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'date',
      render: (item: any, draftData: any[], updateData: (newData: any[]) => void) => {
        if (!item.isFirstInUser) return null;
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <DateInput
              disabled={isConfirmed}
              value={item.contactDate || ''}
              onChange={(newVal) => {
                const newDrafts = draftData.map(d => d.userId === item.userId ? { ...d, contactDate: newVal } : d);
                updateData(newDrafts);
              }}
              style={{ width: '125px' }}
            />
          </div>
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '135px'
      })
    },
    {
      key: 'isAbsenteeSupported',
      header: TABLE_COLUMNS.IS_ABSENTEE_SUPPORTED || '欠席時対応',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'checkbox',
      render: (item: any, draftData: any[], updateData: (newData: any[]) => void) => {
        if (!item.isFirstInUser) return null;
        const checked = Boolean(item.isAbsenteeSupported);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={(e) => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d => d.userId === item.userId ? { ...d, isAbsenteeSupported: nextVal } : d);
                updateData(newDrafts);
              }}
              style={{ cursor: isConfirmed ? 'not-allowed' : 'pointer' }}
            />
          </div>
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '85px'
      })
    },
    {
      key: 'hasMeal',
      header: TABLE_COLUMNS.MEAL || '食事',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'checkbox',
      render: (item: any, draftData: any[], updateData: (newData: any[]) => void) => {
        if (!item.isFirstInUser) return null;
        const checked = Boolean(item.hasMeal);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={(e) => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d => d.userId === item.userId ? { ...d, hasMeal: nextVal } : d);
                updateData(newDrafts);
              }}
              style={{ cursor: isConfirmed ? 'not-allowed' : 'pointer' }}
            />
          </div>
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '65px'
      })
    },
    {
      key: 'hasPickup',
      header: TABLE_COLUMNS.PICKUP_OUTBOUND || '送迎(往)',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'checkbox',
      render: (item: any, draftData: any[], updateData: (newData: any[]) => void) => {
        if (!item.isFirstInUser) return null;
        const checked = Boolean(item.hasPickup);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={(e) => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d => d.userId === item.userId ? { ...d, hasPickup: nextVal } : d);
                updateData(newDrafts);
              }}
              style={{ cursor: isConfirmed ? 'not-allowed' : 'pointer' }}
            />
          </div>
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '75px'
      })
    },
    {
      key: 'hasDropoff',
      header: TABLE_COLUMNS.DROPOFF_INBOUND || '送迎(復)',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'checkbox',
      render: (item: any, draftData: any[], updateData: (newData: any[]) => void) => {
        if (!item.isFirstInUser) return null;
        const checked = Boolean(item.hasDropoff);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={(e) => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d => d.userId === item.userId ? { ...d, hasDropoff: nextVal } : d);
                updateData(newDrafts);
              }}
              style={{ cursor: isConfirmed ? 'not-allowed' : 'pointer' }}
            />
          </div>
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '75px'
      })
    },
    {
      key: 'isVisitSupported',
      header: '訪問支援',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'checkbox',
      render: (item: any, draftData: any[], updateData: (newData: any[]) => void) => {
        if (!item.isFirstInUser) return null;
        const checked = Boolean(item.isVisitSupported);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={(e) => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d => d.userId === item.userId ? { ...d, isVisitSupported: nextVal } : d);
                updateData(newDrafts);
              }}
              style={{ cursor: isConfirmed ? 'not-allowed' : 'pointer' }}
            />
          </div>
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '75px'
      })
    },
    {
      key: 'isTrialUse',
      header: '体験利用',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'checkbox',
      render: (item: any, draftData: any[], updateData: (newData: any[]) => void) => {
        if (!item.isFirstInUser) return null;
        const checked = Boolean(item.isTrialUse);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={(e) => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d => d.userId === item.userId ? { ...d, isTrialUse: nextVal } : d);
                updateData(newDrafts);
              }}
              style={{ cursor: isConfirmed ? 'not-allowed' : 'pointer' }}
            />
          </div>
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '75px'
      })
    },
    {
      key: 'isOffsiteWork',
      header: '施設外就労',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'checkbox',
      render: (item: any, draftData: any[], updateData: (newData: any[]) => void) => {
        if (!item.isFirstInUser) return null;
        const checked = Boolean(item.isOffsiteWork);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="checkbox"
              disabled={isConfirmed}
              checked={checked}
              onChange={(e) => {
                const nextVal = e.target.checked;
                const newDrafts = draftData.map(d => d.userId === item.userId ? { ...d, isOffsiteWork: nextVal } : d);
                updateData(newDrafts);
              }}
              style={{ cursor: isConfirmed ? 'not-allowed' : 'pointer' }}
            />
          </div>
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '85px'
      })
    },
    {
      key: 'remarks',
      header: '備考・対応内容',
      sortable: false,
      editable: () => !isConfirmed,
      inputType: 'text',
      render: (item: any, draftData: any[], updateData: (newData: any[]) => void) => {
        if (!item.isFirstInUser) return null;
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input
              type="text"
              disabled={isConfirmed}
              value={item.remarks || ''}
              placeholder="備考・欠席理由/対応内容"
              onChange={(e) => {
                const nextVal = e.target.value;
                const newDrafts = draftData.map(d => d.userId === item.userId ? { ...d, remarks: nextVal } : d);
                updateData(newDrafts);
              }}
              style={{ width: '140px' }}
            />
          </div>
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '150px'
      })
    },
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      sortKey: 'projectCode',
      sortable: false,
      editable: false, 
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...dbProjects.map(p => ({ label: p.name, value: p.id }))],
      render: (item: any) => {
        if (item.isEmptyRow) return '-';
        if (!item.isFirstInProject) return '';
        const project = dbProjects.find(p => p.id === item.projectId);
        if (!project) return '';
        return project.name;
      },
      style: (item: any) => ({
        borderBottom: item.isLastInProject ? undefined : 'none'
      })
    },
    { 
      key: 'taskId',  
      header: TABLE_COLUMNS.TASK, 
      sortable: false,
      editable: false, 
      inputType: 'select',
      options: (item: any) => {
        const project = dbProjects.find(p => p.id === item.projectId);
        const taskOptions = project ? project.tasks.map(t => ({ label: t.task, value: t.id })) : [];
        return [{ label: '選択してください', value: '' }, ...taskOptions];
      },
      render: (item: any) => {
        if (item.isEmptyRow) return '-';
        const project = dbProjects.find(p => p.id === item.projectId);
        const task = project?.tasks.find(t => t.id === item.taskId);
        return task?.task || '';
      }
    },
    { 
      key: 'workTime', 
      header: TABLE_COLUMNS.WORK_TIME, 
      sortable: false,
      editable: (item: any) => !isConfirmed && !item.isEmptyRow,
      inputType: 'number',
      render: (item: any, draftData: any[], updateData: (newData: any[]) => void) => {
        if (item.isEmptyRow) return '-';
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Input
              type="number"
              min={0}
              step={0.5}
              disabled={isConfirmed}
              value={item.workTime !== undefined && item.workTime !== null ? item.workTime : 0}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                const next = draftData.map(d => d.id === item.id ? { ...d, workTime: val } : d);
                updateData(next);
              }}
              style={{ width: '80px', textAlign: 'center' }}
            />
          </div>
        );
      },
      style: { width: '110px' }
    },
    {
      key: 'workLocationId',
      header: TABLE_COLUMNS.WORK_LOCATION || '作業場所',
      sortable: false,
      editable: (item: any) => !isConfirmed && !item.isEmptyRow,
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...dbPartners.map(p => ({ label: p.is_deleted ? `${p.name} (削除済)` : p.name, value: p.id }))],
      render: (item: any, draftData: any[], updateData: (newData: any[]) => void) => {
        if (item.isEmptyRow) return '-';
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Select
              disabled={isConfirmed}
              value={item.workLocationId || ''}
              onChange={(e) => {
                const nextVal = e.target.value;
                const newDrafts = draftData.map(d => d.id === item.id ? { ...d, workLocationId: nextVal } : d);
                updateData(newDrafts);
              }}
              options={[
                { label: '選択してください', value: '' },
                ...dbPartners.map(p => ({ label: p.is_deleted ? `${p.name} (削除済)` : p.name, value: p.id }))
              ]}
              style={{ width: '100%', minWidth: '140px' }}
            />
          </div>
        );
      },
      style: { minWidth: '150px' }
    },
  ];

  const handleBatchSave = async (drafts: DailyFlatRecord[], deletedIds: string[]) => {
    try {
      await batchSaveDailyWorkRecords(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  const statusBadge = useMemo(() => {
    if (displayData.length === 0) {
      return (
        <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-heading)', backgroundColor: '#f3f4f6', color: '#4b5563' }}>
          対象外
        </span>
      );
    }
    if (isConfirmed) {
      return (
        <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-heading)', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
          確定済
        </span>
      );
    }
    return (
      <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-heading)', backgroundColor: '#fef3c7', color: '#92400e' }}>
        暫定
      </span>
    );
  }, [displayData.length, isConfirmed]);

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.DAILY_WORK_RECORD}
      data={displayData}
      columns={columns}
      initialSort={{ key: 'userCode', direction: 'asc' }}
      emptyMessage={MESSAGES.EMPTY_DAILY_WORK_RECORD}
      onBatchSave={handleBatchSave}
      showSingleDateFilter={true}
      singleDate={currentDate}
      onSingleDateChange={handleDateChange}
      hideDeleteColumn={true}
      highlightInputColumns={true}
      hideHeader={true}
      canEditRow={canEditRow}
      canDeleteRow={canDeleteRow}
      showRestrictionColumn={true}
      restrictionTooltipText="確定済のため変更不可"
      isConfirmed={isConfirmed}
      onConfirm={handleConfirm}
      onUnconfirm={handleUnconfirm}
      confirmDisabled={displayData.length === 0}
      statusBadge={statusBadge}
    />
  );
}
