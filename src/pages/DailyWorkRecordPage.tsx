import { useState, useMemo, useEffect } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import { Button } from '../components/ui';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { mockDailyWorkRecords } from '../mocks/dailyWorkRecords';
import { mockProjects } from '../mocks/projects';
import { supabase } from '../lib/supabase';
import type { DailyWorkRecordItem, MemberItem } from '../types';
import { useAlert } from '../contexts/AlertContext';
import { getCurrentJSTDateOnly } from '../utils/date';

type DisplaySubRow = {
  id: string;
  projectId: string;
  taskId: string;
  workTime: number;
};

type DisplayUserRow = {
  id: string;
  userId: string;
  userName: string;
  date: string;
  records: DisplaySubRow[];
};

export function DailyWorkRecordPage() {
  const [items, setItems] = useState<DailyWorkRecordItem[]>(mockDailyWorkRecords);
  const [dbMembers, setDbMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();
  const [currentDate, setCurrentDate] = useState(() => getCurrentJSTDateOnly());

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('members').select('*').eq('is_deleted', false);
        if (error) throw error;
        if (data) setDbMembers(data);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const displayData = useMemo(() => {
    const activeProjects = mockProjects.filter(p => p.startDate <= currentDate && currentDate <= p.endDate);
    const rows: DisplayUserRow[] = [];

    for (const user of dbMembers) {
      const userRecords = items.filter(item => item.date === currentDate && item.userId === user.id);
      let records: DisplaySubRow[] = [];

      if (userRecords.length > 0) {
        records = userRecords.map(item => {
           let projectId = '';
           for (const p of mockProjects) {
             if (p.tasks.some(t => t.id === item.taskId)) {
               projectId = p.id;
               break;
             }
           }
           return {
             id: item.id,
             projectId,
             taskId: item.taskId,
             workTime: item.workTime
           };
        });
      } else {
        const assignedTasks = activeProjects.flatMap(p => 
          p.tasks
            .filter(t => t.assigneeIds?.includes(user.id))
            .map(t => ({ project: p, task: t }))
        );
        records = assignedTasks.map(({ project, task }) => ({
          id: `DWR-${currentDate}-${user.id}-${task.id}-auto`,
          projectId: project.id,
          taskId: task.id,
          workTime: 0
        }));
      }

      rows.push({
        id: user.id,
        userId: user.id,
        userName: user.name,
        date: currentDate,
        records
      });
    }

    return rows;
  }, [currentDate, items]);

  const columns: Column<any>[] = [
    { 
      key: 'userId', 
      header: TABLE_COLUMNS.USER_NAME, 
      editable: true, 
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...dbMembers.map(u => ({ label: u.name, value: u.id }))],
      render: (item: any) => dbMembers.find(u => u.id === item.userId)?.name || '',
      rowType: 'main'
    },
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      editable: true, 
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...mockProjects.map(p => ({ label: p.name, value: p.id }))],
      render: (item: any) => mockProjects.find(p => p.id === item.projectId)?.name || '',
      rowType: 'sub',
      mainRender: (_item: any, addSubRow?: () => void) => (
        <Button 
          onClick={addSubRow}
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          ＋ 案件追加
        </Button>
      ),
      onCellChange: () => ({ taskId: '' }) // Clear task when project changes
    },
    { 
      key: 'taskId', 
      header: TABLE_COLUMNS.TASK, 
      editable: true, 
      inputType: 'select',
      options: (item: any) => {
        const project = mockProjects.find(p => p.id === item.projectId);
        const taskOptions = project ? project.tasks.map(t => ({ label: t.task, value: t.id })) : [];
        return [{ label: '選択してください', value: '' }, ...taskOptions];
      },
      render: (item: any) => {
        const project = mockProjects.find(p => p.id === item.projectId);
        const task = project?.tasks.find(t => t.id === item.taskId);
        return task?.task || '';
      },
      rowType: 'sub'
    },
    { 
      key: 'workTime', 
      header: TABLE_COLUMNS.WORK_TIME, 
      editable: true,
      inputType: 'number',
      rowType: 'sub',
      style: { width: '120px' }
    },
  ];

  const handleBatchSave = async (drafts: DisplayUserRow[], deletedIds: string[]) => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newItems: DailyWorkRecordItem[] = [];
      const otherDates = items.filter(item => item.date !== currentDate);
      newItems.push(...otherDates);
      
      drafts.forEach(userRow => {
        if (deletedIds.includes(userRow.id)) return;
        userRow.records.forEach(record => {
          if (!deletedIds.includes(record.id) && record.projectId && record.taskId && record.workTime > 0) {
            newItems.push({
              id: record.id.includes('auto') || record.id.includes('RECORD') ? `DWR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` : record.id,
              date: userRow.date,
              userId: userRow.userId,
              taskId: record.taskId,
              workTime: record.workTime
            });
          }
        });
      });

      setItems(newItems);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error(err);
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    return {
      id: `USER-ROW-${Date.now()}`,
      userId: '',
      userName: '',
      date: currentDate,
      records: []
    } as DisplayUserRow;
  };

  const handleAddSubRow = (parentId: string) => {
    return {
      id: `${parentId}-RECORD-${Date.now()}`,
      projectId: '',
      taskId: '',
      workTime: 0,
    };
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
      onAddRow={handleAddRow}
      subItemsKey="records"
      onAddSubRow={handleAddSubRow}
    />
  );
}

