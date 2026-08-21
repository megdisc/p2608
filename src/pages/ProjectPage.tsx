import { DataPage, Button, Tooltip, type Column } from '../components';
import { useEffect } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_ORG_LOCATION, OPTIONS } from '../constants';
import type { ProjectItem } from '../types';
import { useAlert } from '../contexts';
import { useProjects } from '../hooks';
import { isProjectFinished, generateNextProjectCode } from '../utils';

export function ProjectPage() {
  const { items, lastDbCode, dbClients, dbSkills, dbSkillLevels, loading, fetchProjects, batchSaveProjects } = useProjects();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchProjects().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchProjects, showAlert]);

  const columns: Column<ProjectItem>[] = [
    { 
      key: 'code', 
      header: TABLE_COLUMNS.PROJECT_ID, 
      editable: (item: ProjectItem) => !isProjectFinished(item), 
      inputType: 'text', 
      rowType: 'main'
    },
    { 
      key: 'name', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      editable: (item: ProjectItem) => !isProjectFinished(item), 
      inputType: 'text', 
      rowType: 'main',
      render: (item: ProjectItem) => {
        const finished = isProjectFinished(item);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {finished ? (
              <Tooltip text="案件終了のため変更不可" as="span">
                <span>{item.name}</span>
              </Tooltip>
            ) : (
              <span>{item.name}</span>
            )}
          </div>
        );
      }
    },
    { 
      key: 'customerId', 
      header: TABLE_COLUMNS.CUSTOMER, 
      editable: (item: ProjectItem) => !isProjectFinished(item), 
      inputType: 'select', 
      options: [{ label: WORDS_ORG_LOCATION.CLIENT_INTERNAL_BUSINESS, value: '' }, ...dbClients.map(c => ({ label: c.name, value: c.id }))],
      render: (item: any) => dbClients.find(c => c.id === item.customerId)?.name || WORDS_ORG_LOCATION.CLIENT_INTERNAL_BUSINESS,
      rowType: 'main' 
    },
    { 
      key: 'task', 
      header: TABLE_COLUMNS.TASK, 
      editable: (item: any) => !isProjectFinished(item), 
      inputType: 'text', 
      rowType: 'sub',
      sortable: false,
      mainRender: (item, addSubRow) => (
        <Button 
          onClick={addSubRow}
          disabled={isProjectFinished(item)}
        >
          ＋ タスク追加
        </Button>
      )
    },
    { 
      key: 'assigneeType', 
      header: TABLE_COLUMNS.ASSIGNEE_TYPE, 
      editable: (item: any) => !isProjectFinished(item), 
      inputType: 'radio', 
      options: OPTIONS.ASSIGNEE_TYPE_OPTIONS,
      rowType: 'sub',
      sortable: false
    },
    { 
      key: 'skillId', 
      header: TABLE_COLUMNS.REQUIRED_SKILLS, 
      editable: (item: any) => !isProjectFinished(item), 
      inputType: 'select', 
      options: [{ label: 'スキルを選択', value: '' }, ...dbSkills.map(s => ({ label: s.name, value: s.id }))],
      rowType: 'sub-sub',
      render: (item: any) => dbSkills.find(s => s.id === item.skillId)?.name || '',
      mainRender: (item, addSubSubRow, subItem) => (
         <Button 
           onClick={addSubSubRow} 
           disabled={subItem?.assigneeType === 'external' || isProjectFinished(item)}
         >
           ＋ スキル追加
         </Button>
      )
    },
    { 
      key: 'levelId', 
      header: 'スキルレベル', 
      editable: (item: any) => !isProjectFinished(item), 
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
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
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

  const handleAdd = (currentDrafts?: ProjectItem[]) => {
    let lastDraftCode: string | null = null;
    if (currentDrafts && currentDrafts.length > 0) {
      for (let i = currentDrafts.length - 1; i >= 0; i--) {
        if (currentDrafts[i].code && currentDrafts[i].code.trim() !== '') {
          lastDraftCode = currentDrafts[i].code.trim();
          break;
        }
      }
    }

    const baseCode = lastDraftCode || lastDbCode;

    return {
      id: generateId(),
      code: generateNextProjectCode(baseCode),
      name: '',
      projectType: 'ongoing',
      customerId: '',
      tasks: [],
    } as ProjectItem;
  };

  const handleAddSubRow = (_parentId: string) => {
    return {
      id: generateId(),
      task: '',
      assigneeType: OPTIONS.ASSIGNEE_TYPE_OPTIONS[0].value,
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
      initialSort={{ key: 'code', direction: 'desc' }}
      emptyMessage="案件データがありません"
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      subItemsKey="tasks"
      onAddSubRow={handleAddSubRow}
      subSubItemsKey="requiredSkills"
      onAddSubSubRow={handleAddSubSubRow}
      hideSubSubItems={(subItem) => subItem.assigneeType === 'external'}
      hideHeader={true}
      canEditRow={(item) => !isProjectFinished(item)}
      canDeleteRow={(item) => !isProjectFinished(item)}
      showRestrictionColumn={true}
      restrictionTooltipText="案件終了のため変更不可"
    />
  );
}

