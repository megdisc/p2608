import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PERSON, WORDS_ORG_LOCATION } from '../constants';
import { useAlert } from '../contexts';
import { useProgressRecords, type ProgressFlatRecord } from '../hooks';

export function ProgressRecordPage() {
  const { 
    dbMembers, 
    dbStaffs, 
    dbClients, 
    dbProjects, 
    loading, 
    currentMonth, 
    setCurrentMonth, 
    displayData, 
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
      key: 'taskId',  
      header: TABLE_COLUMNS.TASK, 
      sortable: false,
      editable: false, 
      inputType: 'select',
      options: (_item: any) => {
        const taskOptions = dbProjects.flatMap(p => p.tasks).map(t => ({ label: t.task, value: t.id }));
        return [{ label: '選択してください', value: '' }, ...taskOptions];
      },
      render: (item: any) => {
        if (!item.isFirstInTask) return '';
        const task = dbProjects.flatMap(p => p.tasks).find(t => t.id === item.taskId);
        return task?.task || '';
      },
      style: (item: any) => ({
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
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
      inputType: 'number',
      render: (item: any) => item.isFirstInTask ? item.currentProgress : '',
      style: (item: any) => ({
        width: '120px',
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    { 
      key: 'assigneeType', 
      header: TABLE_COLUMNS.ASSIGNEE_TYPE, 
      sortable: false,
      editable: false, 
      render: (item: any) => {
        if (!item.userId) return '';
        const [type] = item.userId.split('_');
        if (type === 'member') return WORDS_PERSON.ROLE_MEMBER;
        if (type === 'staff') return WORDS_PERSON.ROLE_STAFF;
        if (type === 'outsource') return WORDS_ORG_LOCATION.OUTSOURCE;
        return '';
      }
    },
    { 
      key: 'userId', 
      header: TABLE_COLUMNS.ASSIGNEE, 
      sortKey: 'userYomigana',
      sortable: false,
      editable: false, 
      inputType: 'select',
      options: [
        { label: '選択してください', value: '' },
        ...dbMembers.map(u => ({ label: u.name, value: `member_${u.id}` })),
        ...dbStaffs.map(s => ({ label: s.name, value: `staff_${s.id}` })),
        ...dbClients.map(c => ({ label: c.name, value: `outsource_${c.id}` }))
      ],
      render: (item: any) => {
        if (!item.userId) return '';
        const [type, id] = item.userId.split('_');
        if (type === 'member') return dbMembers.find(u => u.id === id)?.name || '';
        if (type === 'staff') return dbStaffs.find(s => s.id === id)?.name || '';
        if (type === 'outsource') return dbClients.find(c => c.id === id)?.name || '';
        return '';
      }
    },
    { 
      key: 'workTime', 
      header: TABLE_COLUMNS.CURRENT_MONTH_WORK_TIME, 
      sortable: false,
      editable: false,
      style: { width: '120px', textAlign: 'right' }
    },
    { 
      key: 'contributionRatio', 
      header: TABLE_COLUMNS.CONTRIBUTION_RATIO, 
      sortable: false,
      editable: true,
      inputType: 'number',
      style: { width: '120px' }
    },
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
