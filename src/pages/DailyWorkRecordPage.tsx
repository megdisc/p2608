import { DataPage, Input, Select, DateInput, type Column } from '../components';
import { useEffect, useMemo, useCallback } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useAlert } from '../contexts';
import { useDailyWorkRecords, type DailyFlatRecord } from '../hooks';

export function DailyWorkRecordPage() {
  const { 
    dbMembers, 
    dbProjects, 
    loading, 
    currentDate, 
    setCurrentDate, 
    displayData, 
    confirmedDates,
    confirmDate,
    unconfirmDate,
    fetchConfirmations,
    fetchMasters, 
    fetchRecords, 
    batchSaveDailyWorkRecords 
  } = useDailyWorkRecords();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchMasters().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
    fetchConfirmations();
  }, [fetchMasters, fetchConfirmations, showAlert]);

  useEffect(() => {
    fetchRecords(currentDate).catch(() => {
      showAlert('作業記録の取得に失敗しました', 'error');
    });
  }, [currentDate, fetchRecords, showAlert]);

  const isConfirmed = useMemo(() => {
    return confirmedDates.includes(currentDate);
  }, [confirmedDates, currentDate]);

  const hasNonZeroRecords = useMemo(() => {
    return displayData.some(r => Number(r.workTime) > 0);
  }, [displayData]);

  const handleConfirm = useCallback(async () => {
    if (!hasNonZeroRecords) {
      showAlert('作業記録が存在しない（またはすべて0時間の）日付は確定対象外です。', 'error');
      return;
    }
    await confirmDate(currentDate);
    showAlert(`${currentDate}の作業記録を確定しました。`, 'success');
  }, [hasNonZeroRecords, confirmDate, currentDate, showAlert]);

  const handleUnconfirm = useCallback(async () => {
    await unconfirmDate(currentDate);
    showAlert(`${currentDate}の確定を解除しました。`, 'success');
  }, [unconfirmDate, currentDate, showAlert]);

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
              value={item.status || '通所利用'}
              onChange={(e) => {
                const nextVal = e.target.value;
                const newDrafts = draftData.map(d => d.userId === item.userId ? { ...d, status: nextVal } : d);
                updateData(newDrafts);
              }}
              options={[
                { label: '通所利用', value: '通所利用' },
                { label: '在宅利用', value: '在宅利用' },
                { label: '施設外利用', value: '施設外利用' },
                { label: '非利用／欠席', value: '非利用／欠席' }
              ]}
              style={{ width: '115px' }}
            />
          </div>
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '125px'
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
              style={{ width: '130px' }}
            />
          </div>
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none',
        textAlign: 'center',
        width: '140px'
      })
    },
    {
      key: 'remarks',
      header: '欠席時対応内容',
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
              placeholder="対応内容・備考"
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
        width: '75px'
      })
    },
    {
      key: 'hasPickup',
      header: TABLE_COLUMNS.PICKUP_OUTBOUND || '送迎（往路）',
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
        width: '100px'
      })
    },
    {
      key: 'hasDropoff',
      header: TABLE_COLUMNS.DROPOFF_INBOUND || '送迎（復路）',
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
        width: '100px'
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
      render: (item: any) => {
        if (item.isEmptyRow) return '-';
        return item.workTime;
      },
      style: { width: '110px' }
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
    if (!hasNonZeroRecords) {
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
  }, [hasNonZeroRecords, isConfirmed]);

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
      onSingleDateChange={setCurrentDate}
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
      confirmDisabled={!hasNonZeroRecords}
      statusBadge={statusBadge}
    />
  );
}
