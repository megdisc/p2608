import { DataPage, MultiSelectDropdown, type Column } from '../components';
import { useState, useEffect } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PERSON, WORDS_ORG_LOCATION, OPTIONS } from '../constants';
import { supabase } from '../lib';
import type { ProjectItem, MemberItem, ClientItem, StaffItem } from '../types';
import { useAlert } from '../contexts';

export function AssigneeAllocationPage() {
  const [items, setItems] = useState<ProjectItem[]>([]);
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

      const formattedProjects: ProjectItem[] = (projectsRes.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        yomigana: p.yomigana || '',
        projectType: p.project_type || 'one-off',
        projectTypeSortKey: (p.project_type || 'one-off') === 'ongoing' ? '0' : '1',
        customerId: p.client_id || '',
        startDate: p.start_date,
        endDate: p.end_date || '',
        tasks: (p.project_tasks || [])
          .filter((pt: any) => !pt.is_deleted)
          .sort((a: any, b: any) => (a.yomigana || '').localeCompare(b.yomigana || ''))
          .map((pt: any) => {
            const assignees = pt.project_task_assignees || [];
            return {
              id: pt.id,
              task: pt.name,
              taskYomigana: pt.yomigana || '',
              requiredSkills: [],
              assigneeIds: assignees.flatMap((pta: any) => {
                const res = [];
                if (pta.member_id) res.push(`member_${pta.member_id}`);
                if (pta.staff_id) res.push(`staff_${pta.staff_id}`);
                if (pta.client_id) res.push(`outsource_${pta.client_id}`);
                return res;
              })
            };
          })
      }));

      formattedProjects.sort((a, b) => {
        const keyA = a.projectTypeSortKey || '';
        const keyB = b.projectTypeSortKey || '';
        if (keyA !== keyB) {
          return keyA.localeCompare(keyB);
        }
        return (a.yomigana || '').localeCompare(b.yomigana || '');
      });

      setItems(formattedProjects);
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

  const columns: Column<ProjectItem>[] = [
    { key: 'projectType', header: TABLE_COLUMNS.PROJECT_TYPE, sortKey: 'projectTypeSortKey', editable: false, inputType: 'text', render: (item: any) => OPTIONS.PROJECT_TYPE_OPTIONS.find(o => o.value === item.projectType)?.label || '', rowType: 'main' },
    { key: 'name', header: TABLE_COLUMNS.PROJECT_NAME, sortKey: 'yomigana', editable: false, inputType: 'text', rowType: 'main' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: false, inputType: 'text', rowType: 'main' },
    { 
      key: 'customerId', 
      header: TABLE_COLUMNS.CUSTOMER, 
      editable: false, 
      inputType: 'text', 
      render: (item: any) => dbClients.find(c => c.id === item.customerId)?.name || WORDS_ORG_LOCATION.CLIENT_INTERNAL_BUSINESS,
      rowType: 'main' 
    },
    { 
      key: 'task', 
      header: TABLE_COLUMNS.TASK, 
      editable: false, 
      inputType: 'text', 
      rowType: 'sub',
      sortable: false
    },
    {
      key: 'assigneeIds',
      header: TABLE_COLUMNS.ASSIGNEE,
      editable: true,
      inputType: 'text',
      rowType: 'sub',
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

  const handleBatchSave = async (drafts: ProjectItem[], _deletedIds: string[]) => {
    try {
      setLoading(true);

      for (const p of drafts) {
        for (const t of p.tasks) {
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
      subItemsKey="tasks"
      disableAddButton={true}
      hideDeleteColumn={true}
    />
  );
}
