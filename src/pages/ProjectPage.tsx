import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { mockProjects } from '../mocks/projects';
import type { ProjectItem } from '../types';
import { useAlert } from '../contexts/AlertContext';

// Removed statusOptions as status is no longer needed.

export function ProjectPage() {
  const [items, setItems] = useState<ProjectItem[]>(mockProjects);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const columns: Column<ProjectItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.PROJECT_NAME, editable: true, inputType: 'text', rowType: 'main' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text', rowType: 'main' },
    { key: 'deliveryDate', header: TABLE_COLUMNS.DELIVERY_DATE, editable: true, inputType: 'date', rowType: 'main' },
    { key: 'estimatedRevenue', header: TABLE_COLUMNS.ESTIMATED_REVENUE, className: 'quantity', editable: true, inputType: 'number', render: (item) => item.estimatedRevenue?.toLocaleString(), rowType: 'main' },
    { 
      key: 'task', 
      header: TABLE_COLUMNS.TASK, 
      editable: true, 
      inputType: 'text', 
      rowType: 'sub',
      mainRender: (_item, addSubRow) => (
        <button 
          onClick={addSubRow}
          style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', fontSize: '12px' }}
        >
          ＋ タスク追加
        </button>
      )
    },
    { key: 'requiredSkills', header: TABLE_COLUMNS.REQUIRED_SKILLS, editable: true, inputType: 'text', rowType: 'sub' },
    { key: 'estimatedIncentive', header: TABLE_COLUMNS.ESTIMATED_INCENTIVE, className: 'quantity', editable: true, inputType: 'number', render: (item: any) => item.estimatedIncentive?.toLocaleString(), rowType: 'sub' },
  ];

  const handleBatchSave = async (drafts: ProjectItem[], deletedIds: string[]) => {
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
    return {
      id: `PRJ-${Date.now()}`,
      name: '',
      yomigana: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      estimatedRevenue: 0,
      tasks: [],
    } as ProjectItem;
  };

  const handleAddSubRow = (parentId: string) => {
    return {
      id: `${parentId}-TASK-${Date.now()}`,
      task: '',
      requiredSkills: '',
      estimatedIncentive: 0,
    };
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.PROJECT_INFO}
      data={items}
      columns={columns}
      emptyMessage="案件データがありません"
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      subItemsKey="tasks"
      onAddSubRow={handleAddSubRow}
    />
  );
}
