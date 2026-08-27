import { DataPage, type Column, MonthInput } from '../components';
import { useEffect, useMemo } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PROJECT } from '../constants';
import { useAlert } from '../contexts';
import { useProgressRecords, type ProgressFlatRecord } from '../hooks';
import { getProjectFinishedMonth, getCurrentJSTMonth } from '../utils';

export function ProgressRecordPage() {
  const { 
    displayData,
    dbProjects, 
    loading, 
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
      fetchRecords().catch(() => {
        showAlert('進捗記録の取得に失敗しました', 'error');
      });
    }
  }, [dbProjects, fetchRecords, showAlert]);

  const columns: Column<any>[] = [
    {
      key: 'projectCode',
      header: TABLE_COLUMNS.PROJECT_ID,
      sortKey: 'projectCode',
      sortable: true,
      editable: false,
      render: (item: any) => {
        if (!item.isFirstInProject) return '';
        return item.projectCode || '';
      },
      style: (item: any) => ({
        borderBottom: item.isLastInProject ? undefined : 'none'
      })
    },
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      sortKey: 'projectCode',
      editable: false, 
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...dbProjects.map(p => ({ label: p.name, value: p.id }))],
      render: (item: any) => {
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
      editable: false,
      render: (item: any) => {
         if (!item.isFirstInTask) return '';
         return item.isTaskCompleted ? '終了' : (item.taskStatus === 'in_progress' ? '進行中' : '未着手');
      },
      style: (item: any) => ({
        borderBottom: item.isLastInTask ? undefined : 'none',
        width: '120px',
        textAlign: 'center'
      })
    },
    {
      key: 'taskCompleted',
      header: 'タスク完了',
      sortable: false,
      editable: false,
      render: (item: any, drafts: any[], setDrafts: (newData: any[]) => void) => {
        if (!item.isFirstInTask) return '';

        const isChecked = Boolean(item.isTaskCompleted);

        return (
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => {
              const checked = e.target.checked;
              const newStatus = checked ? 'completed' : 'not_started';
              setDrafts(drafts.map(d => d.taskId === item.taskId ? { ...d, isTaskCompleted: checked, taskStatus: newStatus } : d));
            }}
          />
        );
      },
      style: (item: any) => ({
        borderBottom: item.isLastInTask ? undefined : 'none',
        width: '100px',
        textAlign: 'center'
      })
    },
    {
      key: 'projectType',
      header: TABLE_COLUMNS.PROJECT_TYPE,
      sortable: false,
      editable: false,
      render: (item: any, drafts: any[], setDrafts: (newData: any[]) => void) => {
        if (!item.isFirstInProject) return '';

        const projectTasks = (drafts || []).filter(d => d.projectId === item.projectId && d.isFirstInTask);
        let isFinished = projectTasks.length > 0 && projectTasks.every(t => t.isTaskCompleted);

        if (isFinished) {
          const project = dbProjects.find(p => p.id === item.projectId);
          const defaultMonth = getProjectFinishedMonth(project) || getCurrentJSTMonth();
          const val = item.settlementYearMonth || defaultMonth;
          const type = project?.projectType || item.projectType;
          const isOngoing = type === 'ongoing';

          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <MonthInput
                value={val}
                onChange={(newVal) => {
                  setDrafts(drafts.map(d => d.projectId === item.projectId ? { ...d, settlementYearMonth: newVal } : d));
                }}
              />
              {isOngoing && <span>{WORDS_PROJECT.FINAL_SETTLEMENT}</span>}
            </div>
          );
        }

        const project = dbProjects.find(p => p.id === item.projectId);
        const type = project?.projectType || item.projectType;
        if (type === 'その他') return 'その他';
        return type === 'ongoing' ? WORDS_PROJECT.PROJECT_TYPE_ONGOING : WORDS_PROJECT.PROJECT_TYPE_ONE_OFF;
      },
      style: (item: any, drafts?: any[]) => {
        const projectTasks = (drafts || []).filter(d => d.projectId === item.projectId && d.isFirstInTask);
        let isFinished = projectTasks.length > 0;
        for (const t of projectTasks) {
          const status = t.taskStatus || 'not_started';
          if (status !== 'completed' && status !== 'canceled') {
            isFinished = false;
            break;
          }
        }

        const project = dbProjects.find(p => p.id === item.projectId);
        const type = project?.projectType || item.projectType;
        const isOngoing = type === 'ongoing';

        return {
          width: isFinished ? (isOngoing ? '210px' : '140px') : '100px',
          textAlign: 'center',
          backgroundColor: isFinished ? 'var(--color-bg-input-highlight)' : undefined,
          borderBottom: item.isLastInProject ? undefined : 'none'
        };
      }
    },
  ];

  const taskLevelData = useMemo(() => {
    return displayData
      .filter(d => d.isFirstInTask)
      .map((d, i, arr) => {
        let isLastInProject = true;
        if (i < arr.length - 1) {
          if (arr[i + 1].projectId === d.projectId) {
            isLastInProject = false;
          }
        }
        return {
          ...d,
          userId: '',
          isSaved: false,
          isLastInTask: true,
          isLastInProject
        };
      });
  }, [displayData]);

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
      data={taskLevelData}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_PROGRESS_RECORD}
      onBatchSave={handleBatchSave}
      hideDeleteColumn={true}
      highlightInputColumns={true}
      initialSort={{ key: 'projectCode', direction: 'desc' }}
      hideHeader={true}
    />
  );
}
