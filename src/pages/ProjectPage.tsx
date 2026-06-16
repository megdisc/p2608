import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import { MultiSelectDropdown, Button } from '../components/ui';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { mockProjects } from '../mocks/projects';
import { mockSkills } from '../mocks/skills';
import { mockClients } from '../mocks/clients';
import { mockProjectUsers } from '../mocks/projectUsers';
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
    { 
      key: 'customerId', 
      header: TABLE_COLUMNS.CUSTOMER, 
      editable: true, 
      inputType: 'select', 
      options: [{ label: '未選択', value: '' }, ...mockClients.map(c => ({ label: c.name, value: c.id }))],
      render: (item: any) => mockClients.find(c => c.id === item.customerId)?.name || '',
      rowType: 'main' 
    },
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
      style: { minWidth: '200px' },
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
    {
      key: 'assigneeType',
      header: TABLE_COLUMNS.ASSIGNEE_TYPE,
      editable: true,
      inputType: 'text',
      rowType: 'sub',
      render: (item: any) => item.assigneeType === 'inhouse' ? '内製' : item.assigneeType === 'outsource' ? '外注' : '',
      customEditRender: (value: any, item: any, onChange: (newValue: any) => void) => (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name={`assigneeType-${item.id}`} 
              value="inhouse" 
              checked={value === 'inhouse'} 
              onChange={() => onChange('inhouse')} 
            />
            内製
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name={`assigneeType-${item.id}`} 
              value="outsource" 
              checked={value === 'outsource'} 
              onChange={() => onChange('outsource')} 
            />
            外注
          </label>
        </div>
      )
    },
    {
      key: 'assigneeIds',
      header: TABLE_COLUMNS.ASSIGNEE,
      editable: true,
      inputType: 'text',
      rowType: 'sub',
      style: { minWidth: '280px' },
      render: (item: any) => {
        const ids = item.assigneeIds || [];
        if (ids.length === 0) return '';
        
        let labels: string[] = [];
        if (item.assigneeType === 'inhouse') {
          labels = ids.map((id: string) => mockProjectUsers.find(u => u.id === id)?.name).filter(Boolean) as string[];
        } else if (item.assigneeType === 'outsource') {
          labels = ids.map((id: string) => mockClients.find(c => c.id === id)?.name).filter(Boolean) as string[];
        }
        
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {labels.map((label: string, idx: number) => (
              <span key={idx} style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '2px 8px', fontSize: '12px' }}>
                {label}
              </span>
            ))}
          </div>
        );
      },
      customEditRender: (value: any, item: any, onChange: (newValue: any) => void) => {
        const currentIds = value || [];
        let options: { value: string, label: string }[] = [];
        if (item.assigneeType === 'inhouse') {
          options = mockProjectUsers.map(u => ({ value: u.id, label: u.name }));
        } else if (item.assigneeType === 'outsource') {
          options = mockClients.map(c => ({ value: c.id, label: c.name }));
        }
        
        return (
          <MultiSelectDropdown 
            options={options}
            value={currentIds}
            onChange={onChange}
            placeholder="担当者を選択"
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
      customerId: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      tasks: [],
    } as ProjectItem;
  };

  const handleAddSubRow = (parentId: string) => {
    return {
      id: `${parentId}-TASK-${Date.now()}`,
      task: '',
      requiredSkills: [],
      assigneeType: undefined,
      assigneeIds: [],
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
