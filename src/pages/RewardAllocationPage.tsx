import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useAlert } from '../contexts';
import { useProgressRecords, type ProgressFlatRecord } from '../hooks';

export function RewardAllocationPage() {
  const {
    displayData: records,
    dbProjects,
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

  const columns: Column<ProgressFlatRecord>[] = [
    { 
      key: 'projectType', 
      header: TABLE_COLUMNS.PROJECT_TYPE, 
      sortable: false,
      editable: false,
      render: (item: any) => item.isFirstInProject ? (item.projectType === 'ongoing' ? '継続' : '単発') : '',
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
      render: (item: any) => item.isFirstInProject ? item.projectName : '',
      style: (item: any) => ({
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
      style: { width: '120px' }
    },
    { 
      key: 'contributionRatio', 
      header: TABLE_COLUMNS.CONTRIBUTION_RATIO, 
      sortable: false,
      editable: true,
      inputType: 'number',
      style: { width: '120px' }
    },
    { 
      key: 'rewardAllocationAmount',
      header: TABLE_COLUMNS.REWARD_ALLOCATION_AMOUNT,
      sortable: false,
      editable: false,
      style: { width: '120px', textAlign: 'right' },
      render: (item: any, drafts: any[]) => {
        if (!item.userId) return '';
        const project = dbProjects.find(p => p.id === item.projectId);
        const task = project?.tasks.find(t => t.id === item.taskId);
        const budget = task?.laborBudget || 0;
        
        if (budget === 0) return '¥0';

        const taskRows = drafts.filter(r => r.taskId === item.taskId && r.userId);
        const totalRatio = taskRows.reduce((sum, r) => sum + (Number(r.contributionRatio) || 0), 0);
        
        if (totalRatio === 0) return '¥0';

        const ratio = Number(item.contributionRatio) || 0;
        const amount = Math.floor(budget * (ratio / totalRatio));
        return `¥${amount.toLocaleString()}`;
      }
    },
    {
      key: 'deductionAmount',
      header: TABLE_COLUMNS.DEDUCTION_AMOUNT,
      sortable: false,
      editable: true,
      inputType: 'currency',
      style: { width: '120px' }
    },
    {
      key: 'rewardUnitPrice',
      header: TABLE_COLUMNS.REWARD_UNIT_PRICE,
      sortable: false,
      editable: false,
      style: { width: '120px', textAlign: 'right' },
      render: (item: any, drafts: any[]) => {
        if (!item.userId) return '';
        const project = dbProjects.find(p => p.id === item.projectId);
        const task = project?.tasks.find(t => t.id === item.taskId);
        const budget = task?.laborBudget || 0;

        let allocationAmount = 0;
        if (budget > 0) {
          const taskRows = drafts.filter(r => r.taskId === item.taskId && r.userId);
          const totalRatio = taskRows.reduce((sum, r) => sum + (Number(r.contributionRatio) || 0), 0);
          if (totalRatio > 0) {
            const ratio = Number(item.contributionRatio) || 0;
            allocationAmount = Math.floor(budget * (ratio / totalRatio));
          }
        }

        const deduction = Number(item.deductionAmount) || 0;
        const unitPrice = allocationAmount - deduction;
        return `¥${unitPrice.toLocaleString()}`;
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
      data={records}
      onBatchSave={handleBatchSave}
      emptyMessage={MESSAGES.EMPTY_PROGRESS_RECORD}
      showMonthFilter={true}
      singleMonth={currentMonth}
      onSingleMonthChange={setCurrentMonth}
      disableAddButton={true}
      hideDeleteColumn={true}
      highlightInputColumns={true}
    />
  );
}
