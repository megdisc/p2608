import { DataPage, MultiSelectDropdown, type Column } from '../components';
import { useState, useEffect } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PERSON, WORDS_ORG_LOCATION, OPTIONS } from '../constants';
import { supabase } from '../lib';
import type { MemberItem, ClientItem, StaffItem } from '../types';
import { useAlert } from '../contexts';

type AllocationRow = {
  id: string; // task id
  projectId: string;
  projectType: string;
  projectTypeSortKey: string;
  projectName: string;
  projectYomigana: string;
  task: string;
  taskYomigana: string;
  assigneeIds: string[];
  isFirstInProject?: boolean;
  isLastInProject?: boolean;
  isFirstInTask?: boolean;
  isLastInTask?: boolean;
};

export function AssigneeAllocationPage() {
  const [items, setItems] = useState<AllocationRow[]>([]);
  const [dbMembers, setDbMembers] = useState<MemberItem[]>([]);
  const [dbClients, setDbClients] = useState<ClientItem[]>([]);
  const [dbStaffs, setDbStaffs] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [membersRes, clientsRes, staffsRes, projectsRes] = await Promise.all([
        supabase.from('members').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('clients').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('staffs').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('projects').select(`
          id, name, yomigana, project_type, client_id, start_date, end_date,
          project_tasks (
            id, name, yomigana, is_deleted,
            project_task_assignees ( member_id, client_id, staff_id )
          )
        `).eq('is_deleted', false)
      ]);

      if (membersRes.error) throw membersRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (staffsRes.error) throw staffsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setDbMembers(membersRes.data || []);
      setDbClients(clientsRes.data || []);
      setDbStaffs(staffsRes.data || []);

      const formattedTasks: AllocationRow[] = [];
      
      (projectsRes.data || []).forEach((p: any) => {
        const projectTypeSortKey = (p.project_type || 'one-off') === 'ongoing' ? '0' : '1';
        (p.project_tasks || [])
          .filter((pt: any) => !pt.is_deleted)
          .forEach((pt: any) => {
            const assignees = pt.project_task_assignees || [];
            formattedTasks.push({
              id: pt.id,
              projectId: p.id,
              projectType: p.project_type || 'one-off',
              projectTypeSortKey,
              projectName: p.name,
              projectYomigana: p.yomigana || '',
              task: pt.name,
              taskYomigana: pt.yomigana || '',
              assigneeIds: assignees.flatMap((pta: any) => {
                const res = [];
                if (pta.member_id) res.push(`member_${pta.member_id}`);
                if (pta.staff_id) res.push(`staff_${pta.staff_id}`);
                if (pta.client_id) res.push(`outsource_${pta.client_id}`);
                return res;
              })
            });
          });
      });

      formattedTasks.sort((a, b) => {
        const keyA = a.projectTypeSortKey;
        const keyB = b.projectTypeSortKey;
        if (keyA !== keyB) {
          return keyA.localeCompare(keyB);
        }
        const projA = a.projectYomigana;
        const projB = b.projectYomigana;
        if (projA !== projB) {
          return projA.localeCompare(projB);
        }
        return a.taskYomigana.localeCompare(b.taskYomigana);
      });

      let prevProjectId = '';
      let prevTaskId = '';

      const finalTasks = formattedTasks.map((r, i) => {
        const isFirstInProject = r.projectId !== prevProjectId;
        const isFirstInTask = r.id !== prevTaskId;

        let isLastInProject = true;
        let isLastInTask = true;

        if (i < formattedTasks.length - 1) {
          const next = formattedTasks[i + 1];
          if (next.projectId === r.projectId) isLastInProject = false;
          if (next.id === r.id) isLastInTask = false;
        }

        prevProjectId = r.projectId;
        prevTaskId = r.id;

        return { ...r, isFirstInProject, isLastInProject, isFirstInTask, isLastInTask };
      });

      setItems(finalTasks);
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('データ取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const columns: Column<AllocationRow>[] = [
    { 
      key: 'projectType', 
      header: TABLE_COLUMNS.PROJECT_TYPE, 
      sortKey: 'projectTypeSortKey', 
      editable: false, 
      inputType: 'text', 
      render: (item: any) => {
        if (!item.isFirstInProject) return '';
        return OPTIONS.PROJECT_TYPE_OPTIONS.find(o => o.value === item.projectType)?.label || '';
      },
      style: (item: any) => ({
        borderBottom: item.isLastInProject ? undefined : 'none'
      })
    },
    { 
      key: 'projectName', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      sortKey: 'projectYomigana', 
      editable: false, 
      inputType: 'text',
      render: (item: any) => {
        if (!item.isFirstInProject) return '';
        return item.projectName;
      },
      style: (item: any) => ({
        borderBottom: item.isLastInProject ? undefined : 'none'
      })
    },
    { 
      key: 'task', 
      header: TABLE_COLUMNS.TASK, 
      editable: false, 
      inputType: 'text', 
      sortable: false,
      render: (item: any) => {
        if (!item.isFirstInTask) return '';
        return item.task;
      },
      style: (item: any) => ({
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    {
      key: 'assigneeIds',
      header: TABLE_COLUMNS.ASSIGNEE,
      editable: true,
      inputType: 'text',
      sortable: false,
      style: { minWidth: '280px' },
      render: (item: any) => {
        const ids = item.assigneeIds || [];
        if (ids.length === 0) return '';
        
        const labels: string[] = ids.map((prefixedId: string) => {
          const [type, id] = prefixedId.split('_');
          if (type === 'member') {
            const name = dbMembers.find(u => u.id === id)?.name;
            return name ? `${name} (${WORDS_PERSON.ROLE_MEMBER})` : null;
          } else if (type === 'staff') {
            const name = dbStaffs.find(s => s.id === id)?.name;
            return name ? `${name} (${WORDS_PERSON.ROLE_STAFF})` : null;
          } else if (type === 'outsource') {
            const name = dbClients.find(c => c.id === id)?.name;
            return name ? `${name} (${WORDS_ORG_LOCATION.OUTSOURCE})` : null;
          }
          return null;
        }).filter(Boolean) as string[];
        
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {labels.map((label: string, idx: number) => (
              <span key={idx} style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '2px 8px', fontSize: 'var(--text-caption)' }}>
                {label}
              </span>
            ))}
          </div>
        );
      },
      customEditRender: (value: any, _item: any, onChange: (newValue: any) => void) => {
        const currentIds = value || [];
        const options = [
          ...dbMembers.map(u => ({ value: `member_${u.id}`, label: `${u.name} (${WORDS_PERSON.ROLE_MEMBER})` })),
          ...dbStaffs.map(s => ({ value: `staff_${s.id}`, label: `${s.name} (${WORDS_PERSON.ROLE_STAFF})` })),
          ...dbClients.map(c => ({ value: `outsource_${c.id}`, label: `${c.name} (${WORDS_ORG_LOCATION.OUTSOURCE})` }))
        ];
        
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

  const handleBatchSave = async (drafts: AllocationRow[], _deletedIds: string[]) => {
    try {
      setLoading(true);

      for (const t of drafts) {
        await supabase.from('project_task_assignees').delete().eq('task_id', t.id);
        if (t.assigneeIds && t.assigneeIds.length > 0) {
          const assigneeInserts = t.assigneeIds.map(prefixedId => {
            const [type, id] = prefixedId.split('_');
            return {
              task_id: t.id,
              member_id: type === 'member' ? id : null,
              staff_id: type === 'staff' ? id : null,
              client_id: type === 'outsource' ? id : null,
            };
          });
          await supabase.from('project_task_assignees').insert(assigneeInserts);
        }
      }

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
      await fetchAllData();
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
      title={PAGE_NAMES.ASSIGNEE_ALLOCATION}
      data={items}
      columns={columns}
      emptyMessage="案件データがありません"
      onBatchSave={handleBatchSave}
      disableAddButton={true}
      hideDeleteColumn={true}
      highlightInputColumns={true}
    />
  );
}
