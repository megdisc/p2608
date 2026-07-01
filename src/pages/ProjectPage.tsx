import { DataPage, Button, type Column } from '../components';
import { useEffect } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_ORG_LOCATION, OPTIONS } from '../constants';
import type { ProjectItem } from '../types';
import { useAlert } from '../contexts';
import { useProjects } from '../hooks';

export function ProjectPage() {
  const { items, dbClients, dbSkills, dbSkillLevels, loading, fetchProjects, batchSaveProjects } = useProjects();
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
      key: 'skillId', 
      header: TABLE_COLUMNS.REQUIRED_SKILLS, 
      editable: true, 
      inputType: 'select', 
      options: [{ label: 'スキルを選択', value: '' }, ...dbSkills.map(s => ({ label: s.name, value: s.id }))],
      rowType: 'sub-sub',
      render: (item: any) => dbSkills.find(s => s.id === item.skillId)?.name || '',
      mainRender: (_item, addSubSubRow) => (
         <Button onClick={addSubSubRow} style={{ padding: '4px 8px', fontSize: 'var(--text-caption)' }}>＋ スキル追加</Button>
      )
    },
    { 
      key: 'levelId', 
      header: 'スキルレベル', 
      editable: true, 
      inputType: 'select', 
      options: [{ label: 'レベルなし', value: '' }, ...dbSkillLevels.map(l => ({ label: String(l.level_value), value: l.id }))],
      rowType: 'sub-sub',
      render: (item: any) => {
        const val = dbSkillLevels.find(l => l.id === item.levelId)?.level_value;
        return val !== undefined ? String(val) : '';
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

  const handleAddSubSubRow = (_parentId: string, _subParentId: string) => {
    return {
      id: generateId(),
      skillId: '',
      levelId: ''
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
      subSubItemsKey="requiredSkills"
      onAddSubSubRow={handleAddSubSubRow}
    />
  );
}
