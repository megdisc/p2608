import { DataPage, type Column } from '../components';
import { useEffect, useMemo } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PROJECT } from '../constants';
import { useAlert } from '../contexts';
import { useProgressRecords, type ProgressFlatRecord } from '../hooks';

export function RewardAllocationPage() {
  const {
    displayData: records,
    loading,
    currentMonth,
    setCurrentMonth,
    fetchRecords,
    fetchMasters,
    batchSaveProgressRecords
  } = useProgressRecords();

  const { showAlert } = useAlert();

  useEffect(() => {
    fetchMasters().then(() => fetchRecords(currentMonth)).catch(console.error);
  }, [currentMonth, fetchRecords, fetchMasters]);

  const filteredRecords = useMemo(() => {
    return records;
  }, [records]);

  const columns: Column<ProgressFlatRecord>[] = [
    { 
      key: 'projectType', 
      header: TABLE_COLUMNS.PROJECT_TYPE, 
      sortKey: 'projectTypeSortKey',
      sortable: true,
      editable: false,
      render: (item: any) => item.isFirstInProject ? (item.projectType === 'その他' ? 'その他' : (item.projectType === 'ongoing' ? '継続' : '単発')) : '',
      style: (item: any) => ({
        width: '80px',
        borderBottom: item.isLastInProject ? undefined : 'none'
      })
    },
    { 
      key: 'projectName', 
      header: '案件', 
      sortKey: 'projectYomigana',
      sortable: false,
      editable: false,
      render: (item: any) => {
        if (!item.isFirstInProject) return '';
        if (item.projectType === 'ongoing') {
          const [year, month] = currentMonth.split('-');
          return `${item.projectName}（${year}年${month}月分）`;
        }
        return item.projectName;
      },
      style: (item: any) => ({
        borderBottom: item.isLastInProject ? undefined : 'none'
      })
    },
    {
      key: 'projectStatus',
      header: TABLE_COLUMNS.PROJECT_STATUS,
      sortable: false,
      editable: false,
      render: (item: any, drafts: any[]) => {
        if (!item.isFirstInProject) return '';
        
        const projectTasks = drafts.filter(d => d.projectId === item.projectId && d.isFirstInTask);
        if (projectTasks.length === 0) return WORDS_PROJECT.STATUS_NOT_STARTED;

        let allNotStarted = true;
        let allCompletedOrCanceled = true;

        for (const t of projectTasks) {
          const status = t.taskStatus || 'not_started';
          if (status !== 'not_started') allNotStarted = false;
          if (status !== 'completed' && status !== 'canceled') allCompletedOrCanceled = false;
        }

        if (allNotStarted) return WORDS_PROJECT.STATUS_NOT_STARTED;
        if (allCompletedOrCanceled) return WORDS_PROJECT.STATUS_FINISHED;
        return WORDS_PROJECT.STATUS_IN_PROGRESS;
      },
      style: (item: any) => ({
        width: '100px',
        textAlign: 'center',
        borderBottom: item.isLastInProject ? undefined : 'none'
      })
    },
    { 
      key: 'taskId',  
      header: TABLE_COLUMNS.TASK, 
      sortable: false,
      editable: false,
      render: (item: any) => item.isFirstInTask ? item.taskName : '',
      style: (item: any) => ({
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    { 
      key: 'taskStatus', 
      header: TABLE_COLUMNS.TASK_STATUS, 
      sortable: false,
      editable: false,
      render: (item: any) => {
         if (!item.isFirstInTask) return '';
         const v = item.taskStatus;
         if (v === 'not_started') return '未着手';
         if (v === 'in_progress') return '進行中';
         if (v === 'completed') return '完了';
         if (v === 'canceled') return '中止';
         return '';
      },
      style: (item: any) => ({
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    {
      key: 'estimatedReward',
      header: '予算額',
      sortable: false,
      editable: false,
      style: (item: any) => ({
        textAlign: 'right',
        borderBottom: item.isLastInTask ? undefined : 'none'
      }),
      render: (item: any) => {
        if (!item.isFirstInTask) return '';
        const budget = (item.laborBudget || 0) - (item.pastAllocationAmount || 0);
        return `¥${budget.toLocaleString()}`;
      }
    },
    { 
      key: 'assigneeType', 
      header: TABLE_COLUMNS.ASSIGNEE_TYPE, 
      sortable: false,
      editable: false,
      render: (item: any) => item.assigneeType,
    },
    { 
      key: 'userName', 
      header: TABLE_COLUMNS.ASSIGNEE,
      sortable: false,
      editable: false,
      render: (item: any) => item.userName,
    },
    { 
      key: 'workTime', 
      header: TABLE_COLUMNS.CURRENT_MONTH_WORK_TIME, 
      sortable: false,
      editable: false,
      style: { width: '120px', textAlign: 'right' }
    },
    {
      key: 'allocationAmount',
      header: '配分額',
      sortable: false,
      editable: true,
      inputType: 'currency',
      style: { width: '120px' }
    },
    {
      key: 'totalAllocationAmount',
      header: '配分合計額',
      sortable: false,
      editable: false,
      style: (item: any) => ({
        width: '120px', textAlign: 'right',
        borderBottom: item.isLastInTask ? undefined : 'none'
      }),
      render: (item: any, drafts: any[]) => {
        if (!item.isFirstInTask) return '';
        const taskRows = drafts.filter(r => r.taskId === item.taskId && r.userId);
        const total = taskRows.reduce((sum, r) => sum + (Number(r.allocationAmount) || 0), 0);
        return `¥${total.toLocaleString()}`;
      }
    },
    {
      key: 'remainingBudgetAmount',
      header: '予算残額',
      sortable: false,
      editable: false,
      style: (item: any) => {
        return {
          width: '120px', textAlign: 'right',
          borderBottom: item.isLastInTask ? undefined : 'none'
        };
      },
      render: (item: any, drafts: any[]) => {
        if (!item.isFirstInTask) return '';
        const taskRows = drafts.filter(r => r.taskId === item.taskId && r.userId);
        const total = taskRows.reduce((sum, r) => sum + (Number(r.allocationAmount) || 0), 0);
        const budget = (item.laborBudget || 0) - (item.pastAllocationAmount || 0);
        const diff = budget - total;
        
        const diffStr = `¥${diff.toLocaleString()}`;
        if (diff < 0) {
          return <div className="bg-error-highlight p-2 -mx-3 -my-2">{diffStr}</div>;
        }
        return diffStr;
      }
    },
  ];

  const handleBatchSave = async (drafts: ProgressFlatRecord[], deletedIds: string[]) => {
    try {
      await batchSaveProgressRecords(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
      console.error(err);
    }
  };

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <DataPage
      title={PAGE_NAMES.REWARD_ALLOCATION}
      columns={columns}
      data={filteredRecords}
      onBatchSave={handleBatchSave}
      emptyMessage={MESSAGES.EMPTY_PROGRESS_RECORD}
      showMonthFilter={true}
      singleMonth={currentMonth}
      onSingleMonthChange={setCurrentMonth}
      disableAddButton={true}
      hideDeleteColumn={true}
      highlightInputColumns={true}
      initialSort={{ key: 'projectType', direction: 'asc' }}
      hideHeader={true}
    />
  );
}
