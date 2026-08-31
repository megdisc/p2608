import { DataPage, type Column } from '../components';
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
      style: { width: '120px' }
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
