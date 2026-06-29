import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
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
    fetchMasters, 
    fetchRecords, 
    batchSaveDailyWorkRecords 
  } = useDailyWorkRecords();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchMasters().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchMasters, showAlert]);

  useEffect(() => {
    if (dbMembers.length > 0) {
      fetchRecords(currentDate).catch(() => {
        showAlert('作業記録の取得に失敗しました', 'error');
      });
    }
  }, [currentDate, dbMembers, fetchRecords, showAlert]);

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
      key: 'projectType',
      header: TABLE_COLUMNS.PROJECT_TYPE,
      sortable: false,
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
      sortable: false,
      editable: false, 
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...dbProjects.map(p => ({ label: p.name, value: p.id }))],
      render: (item: any) => {
        if (!item.isFirstInProject) return '';
        const project = dbProjects.find(p => p.id === item.projectId);
        if (!project) return '';
        if (project.projectType === 'ongoing') {
          const date = new Date(currentDate);
          const month = String(date.getMonth() + 1).padStart(2, '0');
          return `${project.name}（${date.getFullYear()}年${month}月分）`;
        }
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
        const project = dbProjects.find(p => p.id === item.projectId);
        const task = project?.tasks.find(t => t.id === item.taskId);
        return task?.task || '';
      }
    },
    { 
      key: 'workTime', 
      header: TABLE_COLUMNS.WORK_TIME, 
      sortable: false,
      editable: true,
      inputType: 'number',
      style: { width: '120px' }
    },
  ];

  const handleBatchSave = async (drafts: DailyFlatRecord[], deletedIds: string[]) => {
    try {
      await batchSaveDailyWorkRecords(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

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
    />
  );
}
