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

type DisplayRow = {
  id: string;
  date: string;
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  taskId: string;
  taskName: string;
  workTime: number;
  isFirstForUser: boolean;
  isFirstForProject: boolean;
  isLastForUser: boolean;
  isLastForProject: boolean;
};

export function DailyWorkRecordPage() {
  const [items, setItems] = useState<DailyWorkRecordItem[]>(mockDailyWorkRecords);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();
  const [currentDate, setCurrentDate] = useState(() => getCurrentJSTDateOnly());

  const displayData = useMemo(() => {
    const activeProjects = mockProjects.filter(p => p.startDate <= currentDate && currentDate <= p.endDate);
    const rows: DisplayRow[] = [];

    for (const user of mockProjectUsers) {
      // Find all tasks assigned to this user in active projects
      const assignedTasks = activeProjects.flatMap(p => 
        p.tasks
          .filter(t => t.assigneeIds?.includes(user.id))
          .map(t => ({ project: p, task: t }))
      );

      if (assignedTasks.length === 0) {
        // No tasks at all for this user
        const existingRecord = items.find(item => item.date === currentDate && item.userId === user.id && item.taskId === 'none');
        rows.push({
          id: existingRecord?.id || `DWR-${currentDate}-${user.id}-none`,
          date: currentDate,
          userId: user.id,
          userName: user.name,
          projectId: 'none',
          projectName: '-',
          taskId: 'none',
          taskName: '担当タスクなし',
          workTime: existingRecord?.workTime || 0,
          isFirstForUser: true,
          isFirstForProject: true,
          isLastForUser: true,
          isLastForProject: true
        });
      } else {
        // Group tasks by project
        const projectMap = new Map<string, { project: typeof mockProjects[0], tasks: typeof mockProjects[0]['tasks'] }>();
        for (const { project, task } of assignedTasks) {
          if (!projectMap.has(project.id)) {
            projectMap.set(project.id, { project, tasks: [] });
          }
          projectMap.get(project.id)!.tasks.push(task);
        }

        let isFirstForUser = true;
        const projectEntries = Array.from(projectMap.entries());
        for (let pIdx = 0; pIdx < projectEntries.length; pIdx++) {
          const [projectId, { project, tasks }] = projectEntries[pIdx];
          const isLastProjectForUser = pIdx === projectEntries.length - 1;
          
          let isFirstForProject = true;
          for (let tIdx = 0; tIdx < tasks.length; tIdx++) {
            const task = tasks[tIdx];
            const isLastTaskForProject = tIdx === tasks.length - 1;
            
            const existingRecord = items.find(item => item.date === currentDate && item.userId === user.id && item.taskId === task.id);
            rows.push({
              id: existingRecord?.id || `DWR-${currentDate}-${user.id}-${task.id}`,
              date: currentDate,
              userId: user.id,
              userName: user.name,
              projectId: project.id,
              projectName: project.name,
              taskId: task.id,
              taskName: task.task,
              workTime: existingRecord?.workTime || 0,
              isFirstForUser,
              isFirstForProject,
              isLastForProject: isLastTaskForProject,
              isLastForUser: isLastProjectForUser && isLastTaskForProject
            });
            isFirstForUser = false;
            isFirstForProject = false;
          }
        }
      }
    }

    return rows;
  }, [currentDate, items]);

  const columns: Column<DisplayRow>[] = [
    { 
      key: 'userName', 
      header: TABLE_COLUMNS.USER_NAME, 
      editable: false, 
      style: (item) => ({ borderBottom: item.isLastForUser ? undefined : 'none' }),
      render: (item) => item.isFirstForUser ? item.userName : ''
    },
    { 
      key: 'projectName', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      editable: false, 
      style: (item) => ({ minWidth: '200px', borderBottom: item.isLastForProject ? undefined : 'none' }),
      render: (item) => item.isFirstForProject ? item.projectName : ''
    },
    { 
      key: 'taskName', 
      header: TABLE_COLUMNS.TASK, 
      editable: false, 
      style: { minWidth: '200px' }
    },
    { 
      key: 'workTime', 
      header: TABLE_COLUMNS.WORK_TIME, 
      editable: (item) => item.taskId !== 'none',
      inputType: 'number',
      style: { width: '120px' }
    },
  ];

  const handleBatchSave = async (drafts: DisplayRow[]) => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const validDrafts: DailyWorkRecordItem[] = drafts
        .filter(d => d.workTime > 0 && d.taskId !== 'none')
        .map(d => ({
          id: d.id,
          date: d.date,
          userId: d.userId,
          taskId: d.taskId,
          workTime: d.workTime
        }));

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
      hideDeleteColumn={true}
    />
  );
}
