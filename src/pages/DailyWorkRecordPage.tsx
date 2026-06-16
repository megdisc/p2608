import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { mockDailyWorkRecords } from '../mocks/dailyWorkRecords';
import { mockProjectUsers } from '../mocks/projectUsers';
import { mockProjects } from '../mocks/projects';
import type { DailyWorkRecordItem } from '../types';
import { useAlert } from '../contexts/AlertContext';

export function DailyWorkRecordPage() {
  const [items, setItems] = useState<DailyWorkRecordItem[]>(mockDailyWorkRecords);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const userOptions = [{ label: '未選択', value: '' }, ...mockProjectUsers.map(u => ({
    label: u.name,
    value: u.id
  }))];

  const taskOptions = [{ label: '未選択', value: '' }, ...mockProjects.flatMap(p => 
    p.tasks.map(t => ({
      label: `${p.name} - ${t.task}`,
      value: t.id
    }))
  )];

  const columns: Column<DailyWorkRecordItem>[] = [
    { 
      key: 'date', 
      header: TABLE_COLUMNS.DATE, 
      editable: true, 
      inputType: 'date' 
    },
    { 
      key: 'userId', 
      header: TABLE_COLUMNS.USER_NAME, 
      editable: true, 
      inputType: 'select', 
      options: userOptions,
      render: (item) => mockProjectUsers.find(u => u.id === item.userId)?.name || ''
    },
    { 
      key: 'taskId', 
      header: TABLE_COLUMNS.WORK_CONTENT, 
      editable: true, 
      inputType: 'select', 
      options: taskOptions,
      style: { minWidth: '300px' },
      render: (item) => {
        for (const p of mockProjects) {
          const t = p.tasks.find(task => task.id === item.taskId);
          if (t) return `${p.name} - ${t.task}`;
        }
        return '';
      }
    },
    { 
      key: 'workTime', 
      header: TABLE_COLUMNS.WORK_TIME, 
      editable: true, 
      inputType: 'number',
      style: { width: '120px' }
    },
  ];

  const handleBatchSave = async (drafts: DailyWorkRecordItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newItems = drafts.filter(item => !deletedIds.includes(item.id));
      setItems(newItems);
      
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error(err);
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    const today = new Date();
    // format as YYYY-MM-DD (local time)
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    
    return {
      id: `DWR-${Date.now()}`,
      date: formattedDate,
      userId: '',
      taskId: '',
      workTime: 0,
    } as DailyWorkRecordItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.DAILY_WORK_RECORD}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_DAILY_WORK_RECORD}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      showSingleDateFilter={true}
    />
  );
}
