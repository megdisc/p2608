import { useState, useMemo } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { mockDailyWorkRecords } from '../mocks/dailyWorkRecords';
import { mockProjectUsers } from '../mocks/projectUsers';
import { mockProjects } from '../mocks/projects';
import type { DailyWorkRecordItem } from '../types';
import { useAlert } from '../contexts/AlertContext';
import { getCurrentJSTDateOnly } from '../utils/date';

export function DailyWorkRecordPage() {
  const [items, setItems] = useState<DailyWorkRecordItem[]>(mockDailyWorkRecords);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();
  const [currentDate, setCurrentDate] = useState(() => getCurrentJSTDateOnly());

  const displayData = useMemo(() => {
    // 該当日付においてアクティブな案件を抽出
    const activeProjects = mockProjects.filter(p => p.startDate <= currentDate && currentDate <= p.endDate);

    const generatedRows: DailyWorkRecordItem[] = [];

    // 全利用者に対してループ
    for (const user of mockProjectUsers) {
      // ユーザーがアサインされているアクティブなタスクを抽出
      const assignedTasks = activeProjects.flatMap(p => 
        p.tasks
          .filter(t => t.assigneeIds?.includes(user.id))
          .map(t => ({ project: p, task: t }))
      );

      if (assignedTasks.length === 0) {
        // 担当タスクがない場合、1行だけ「担当タスクなし」として生成
        const existingRecord = items.find(item => item.date === currentDate && item.userId === user.id && item.taskId === 'none');
        generatedRows.push({
          id: existingRecord?.id || `DWR-${currentDate}-${user.id}-none`,
          date: currentDate,
          userId: user.id,
          taskId: 'none',
          workTime: existingRecord?.workTime || 0,
        });
      } else {
        // 担当タスクがある場合、各タスクごとに行を生成
        for (const { task } of assignedTasks) {
          const existingRecord = items.find(item => item.date === currentDate && item.userId === user.id && item.taskId === task.id);
          generatedRows.push({
            id: existingRecord?.id || `DWR-${currentDate}-${user.id}-${task.id}`,
            date: currentDate,
            userId: user.id,
            taskId: task.id,
            workTime: existingRecord?.workTime || 0,
          });
        }
      }
    }

    return generatedRows;
  }, [currentDate, items]);

  const columns: Column<DailyWorkRecordItem>[] = [
    { 
      key: 'userId', 
      header: TABLE_COLUMNS.USER_NAME, 
      editable: false, 
      render: (item) => mockProjectUsers.find(u => u.id === item.userId)?.name || ''
    },
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      editable: false, 
      style: { minWidth: '200px' },
      render: (item) => {
        if (item.taskId === 'none') return '-';
        for (const p of mockProjects) {
          if (p.tasks.some(task => task.id === item.taskId)) return p.name;
        }
        return '';
      }
    },
    { 
      key: 'taskId', 
      header: TABLE_COLUMNS.TASK, 
      editable: false, 
      style: { minWidth: '200px' },
      render: (item) => {
        if (item.taskId === 'none') return '担当タスクなし';
        for (const p of mockProjects) {
          const t = p.tasks.find(task => task.id === item.taskId);
          if (t) return t.task;
        }
        return '';
      }
    },
    { 
      key: 'workTime', 
      header: TABLE_COLUMNS.WORK_TIME, 
      editable: (item) => item.taskId !== 'none',
      inputType: 'number',
      style: { width: '120px' }
    },
  ];

  const handleBatchSave = async (drafts: DailyWorkRecordItem[]) => {
    try {
      setLoading(true);
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const validDrafts = drafts.filter(d => d.workTime > 0 && d.taskId !== 'none');
      setItems(prev => {
        const otherDates = prev.filter(item => item.date !== currentDate);
        return [...otherDates, ...validDrafts];
      });
      
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error(err);
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    } finally {
      setLoading(false);
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
      canDeleteRow={() => false}
    />
  );
}
