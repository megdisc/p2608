import { DataPage, MultiSelectDropdown, Button, type Column } from '../components';
import { useEffect } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_ORG_LOCATION, OPTIONS } from '../constants';
import type { ProjectItem } from '../types';
import { useAlert } from '../contexts';
import { useProjects } from '../hooks';

export function ProjectPage() {
  const { items, dbClients, dbSkills, loading, fetchProjects, batchSaveProjects } = useProjects();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchProjects().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchProjects, showAlert]);

  const columns: Column<ProjectItem>[] = [
    { key: 'projectType', header: TABLE_COLUMNS.PROJECT_TYPE, sortKey: 'projectTypeSortKey', editable: true, inputType: 'radio', options: OPTIONS.PROJECT_TYPE_OPTIONS, render: (item: any) => OPTIONS.PROJECT_TYPE_OPTIONS.find(o => o.value === item.projectType)?.label || '', rowType: 'main' },
    { key: 'name', header: TABLE_COLUMNS.PROJECT_NAME, sortKey: 'yomigana', editable: true, inputType: 'text', rowType: 'main' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text', rowType: 'main' },
    { 
      key: 'customerId', 
      header: TABLE_COLUMNS.CUSTOMER, 
      editable: true, 
      inputType: 'select', 
      options: [{ label: WORDS_ORG_LOCATION.CLIENT_INTERNAL_BUSINESS, value: '' }, ...dbClients.map(c => ({ label: c.name, value: c.id }))],
      render: (item: any) => dbClients.find(c => c.id === item.customerId)?.name || WORDS_ORG_LOCATION.CLIENT_INTERNAL_BUSINESS,
      rowType: 'main' 
    },
    { key: 'startDate', header: TABLE_COLUMNS.START_DATE, editable: true, inputType: 'date', rowType: 'main' },
    { key: 'endDate', header: TABLE_COLUMNS.END_DATE, editable: true, inputType: 'date', rowType: 'main' },
    { 
      key: 'task', 
      header: TABLE_COLUMNS.TASK, 
      editable: true, 
      inputType: 'text', 
      rowType: 'sub',
      sortable: false,
      mainRender: (_item, addSubRow) => (
        <Button 
          onClick={addSubRow}
          style={{ padding: '4px 8px', fontSize: 'var(--text-caption)' }}
        >
          ＋ タスク追加
        </Button>
      )
    },
    { 
      key: 'taskYomigana', 
      header: TABLE_COLUMNS.YOMIGANA, 
      editable: true, 
      inputType: 'text', 
      rowType: 'sub',
      sortable: false
    },
    { 
      key: 'requiredSkills', 
      header: TABLE_COLUMNS.REQUIRED_SKILLS, 
      editable: true, 
      inputType: 'text', 
      rowType: 'sub',
      sortable: false,
      style: { minWidth: '200px' },
      render: (item: any) => {
        const skills = item.requiredSkills || [];
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {skills.map((s: any, idx: number) => (
              <span key={idx} style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '2px 8px', fontSize: 'var(--text-caption)' }}>
                {s.skill}
              </span>
            ))}
          </div>
        );
      },
      customEditRender: (value: any, _item: any, onChange: (newValue: any) => void) => {
        const currentSkills = value || [];
        const currentSkillNames = currentSkills.map((s: any) => s.skill);
        const options = dbSkills.map(s => ({ value: s.name, label: s.name }));
        
        const handleChange = (newSkillNames: string[]) => {
           const newSkills = newSkillNames.map(name => {
             const existing = currentSkills.find((s: any) => s.skill === name);
             if (existing) return existing;
             const dbSkill = dbSkills.find(s => s.name === name);
             return { id: dbSkill?.id || '', skill: name };
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
      await batchSaveProjects(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const generateId = () => {
    return typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
  };

  const handleAdd = () => {
    return {
      id: generateId(),
      name: '',
      yomigana: '',
      projectType: 'one-off',
      customerId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      tasks: [],
    } as ProjectItem;
  };

  const handleAddSubRow = (_parentId: string) => {
    return {
      id: generateId(),
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
