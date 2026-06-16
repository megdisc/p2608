import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import { MultiSelectDropdown, Button } from '../components/ui';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { mockProjects } from '../mocks/projects';
import { mockSkills } from '../mocks/skills';
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
    { 
      key: 'task', 
      header: TABLE_COLUMNS.TASK, 
      editable: true, 
      inputType: 'text', 
      rowType: 'sub',
      mainRender: (_item, addSubRow) => (
        <Button 
          onClick={addSubRow}
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          ＋ タスク追加
        </Button>
      )
    },
    { 
      key: 'requiredSkills', 
      header: TABLE_COLUMNS.REQUIRED_SKILLS, 
      editable: true, 
      inputType: 'text', 
      rowType: 'sub',
      render: (item: any) => {
        const skills = item.requiredSkills || [];
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {skills.map((s: any) => (
              <span key={s.id} style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '2px 8px', fontSize: '12px' }}>
                {s.skill}
              </span>
            ))}
          </div>
        );
      },
      customEditRender: (value: any, item: any, onChange: (newValue: any) => void) => {
        const currentSkills = value || [];
        const currentSkillNames = currentSkills.map((s: any) => s.skill);
        const options = mockSkills.map(s => ({ value: s.name, label: s.name }));
        
        const handleChange = (newSkillNames: string[]) => {
           const newSkills = newSkillNames.map(name => {
             const existing = currentSkills.find((s: any) => s.skill === name);
             if (existing) return existing;
             return { id: `${item.id}-SKILL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, skill: name };
           });
           onChange(newSkills);
        };
        
        return (
          <MultiSelectDropdown 
            options={options}
            value={currentSkillNames}
            onChange={handleChange}
            placeholder="スキルを選択"
          />
        );
      }
    },
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
      tasks: [],
    } as ProjectItem;
  };

  const handleAddSubRow = (parentId: string) => {
    return {
      id: `${parentId}-TASK-${Date.now()}`,
      task: '',
      requiredSkills: [],
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
