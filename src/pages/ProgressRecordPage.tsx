import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PROJECT } from '../constants';
import { useAlert } from '../contexts';
import { useProgressRecords, type ProgressFlatRecord } from '../hooks';

export function ProgressRecordPage() {
  const { 
    displayData,
    dbProjects, 
    loading, 
    currentMonth, 
    setCurrentMonth, 
    fetchMasters, 
    fetchRecords, 
    batchSaveProgressRecords 
  } = useProgressRecords();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchMasters().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchMasters, showAlert]);

  useEffect(() => {
    if (dbProjects.length > 0) {
      fetchRecords(currentMonth).catch(() => {
        showAlert('進捗記録の取得に失敗しました', 'error');
      });
    }
  }, [currentMonth, dbProjects, fetchRecords, showAlert]);

  const columns: Column<any>[] = [
    {
      key: 'projectType',
      header: TABLE_COLUMNS.PROJECT_TYPE,
      sortKey: 'projectTypeSortKey',
      sortable: true,
      render: (item: any) => {
        if (!item.isFirstInProject) return '';
        const project = dbProjects.find(p => p.id === item.projectId);
        if (!project) return '';
        return project.projectType === 'ongoing' ? '継続' : '単発';
      },
      style: (item: any) => ({
        borderBottom: item.isLastInProject ? undefined : 'none'
      })
    },
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      sortKey: 'projectYomigana',
      editable: false, 
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...dbProjects.map(p => ({ label: p.name, value: p.id }))],
      render: (item: any) => {
        if (!item.isFirstInProject) return '';
        const project = dbProjects.find(p => p.id === item.projectId);
        if (!project) return '';
        if (project.projectType === 'ongoing') {
          const [year, month] = currentMonth.split('-');
          return `${project.name}（${year}年${month}月分）`;
        }
        return project.name;
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

        const allCanceled = projectTasks.every(t => t.isCanceled);
        if (allCanceled) return WORDS_PROJECT.STATUS_CANCELED;

        const activeTasks = projectTasks.filter(t => !t.isCanceled);
        const allCompleted = activeTasks.every(t => Number(t.currentProgress) === 100);
        if (allCompleted) return WORDS_PROJECT.STATUS_COMPLETED;

        const allNotStarted = activeTasks.every(t => Number(t.currentProgress) === 0 || !t.currentProgress);
        if (allNotStarted) return WORDS_PROJECT.STATUS_NOT_STARTED;

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
      inputType: 'select',
      options: (_item: any) => {
        const taskOptions = dbProjects.flatMap(p => p.tasks).map(t => ({ label: t.task, value: t.id }));
        return [{ label: '選択してください', value: '' }, ...taskOptions];
      },
      render: (item: any) => item.isFirstInTask ? item.taskName : '',
      style: (item: any) => ({
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    {
      key: 'estimatedReward',
      header: '報酬見込額',
      sortable: false,
      editable: false,
      style: (item: any) => ({
        textAlign: 'right',
        borderBottom: item.isLastInTask ? undefined : 'none'
      }),
      render: (item: any) => {
        if (!item.isFirstInTask) return '';
        const project = dbProjects.find(p => p.id === item.projectId);
        const task = project?.tasks.find(t => t.id === item.taskId);
        const budget = task?.laborBudget || 0;
        return `¥${budget.toLocaleString()}`;
      }
    },
    { 
      key: 'prevProgress', 
      header: TABLE_COLUMNS.PREV_MONTH_PROGRESS, 
      sortable: false,
      editable: false,
      render: (item: any) => item.isFirstInTask && item.taskId ? item.prevProgress : '',
      style: (item: any) => ({
        width: '120px', 
        textAlign: 'right',
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    { 
      key: 'currentProgress', 
      header: TABLE_COLUMNS.CURRENT_MONTH_PROGRESS, 
      sortable: false,
      editable: (item: any) => item.isFirstInTask,
      inputType: 'radio',
      options: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => ({ label: String(v), value: String(v) })),
      render: (item: any) => item.isFirstInTask ? item.currentProgress : '',
      style: (item: any) => ({
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    {
      key: 'isCanceled',
      header: TABLE_COLUMNS.IS_CANCELED,
      sortable: false,
      editable: (item: any) => item.isFirstInTask,
      inputType: 'checkbox',
      render: (item: any) => item.isFirstInTask ? (item.isCanceled ? '✓' : '') : '',
      style: (item: any) => ({
        width: '80px',
        textAlign: 'center',
        backgroundColor: 'var(--palette-yellow-100)',
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    { 
      key: 'assigneeType', 
      header: TABLE_COLUMNS.ASSIGNEE_TYPE, 
      sortable: false,
      editable: false, 
      render: (item: any) => item.assigneeType
    },
    { 
      key: 'userName', 
      header: TABLE_COLUMNS.ASSIGNEE, 
      sortKey: 'userYomigana',
      sortable: false,
      editable: false, 
      render: (item: any) => item.userName
    },
    { 
      key: 'workTime', 
      header: TABLE_COLUMNS.CURRENT_MONTH_WORK_TIME, 
      sortable: false,
      editable: false,
      style: { width: '120px', textAlign: 'right' }
    }
  ];

  const handleBatchSave = async (drafts: ProgressFlatRecord[], deletedIds: string[]) => {
    try {
      await batchSaveProgressRecords(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.PROGRESS_RECORD}
      data={displayData}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_PROGRESS_RECORD}
      onBatchSave={handleBatchSave}
      showMonthFilter={true}
      singleMonth={currentMonth}
      onSingleMonthChange={setCurrentMonth}
      hideDeleteColumn={true}
      highlightInputColumns={true}
    />
  );
}
