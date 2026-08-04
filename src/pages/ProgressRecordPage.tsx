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
        if (project.projectType === 'その他') return 'その他';
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
      key: 'taskStatus', 
      header: TABLE_COLUMNS.TASK_STATUS, 
      sortable: false,
      editable: (item: any) => item.isFirstInTask,
      inputType: 'radio',
      options: [
        { label: '未着手', value: 'not_started' },
        { label: '進行中', value: 'in_progress' },
        { label: '完了', value: 'completed' },
        { label: '中止', value: 'canceled' }
      ],
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
        borderBottom: item.isLastInTask ? undefined : 'none',
        minWidth: '280px'
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
      initialSort={{ key: 'projectType', direction: 'asc' }}
      hideHeader={true}
    />
  );
}
