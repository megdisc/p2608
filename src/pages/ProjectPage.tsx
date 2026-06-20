import { useState, useEffect } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import { MultiSelectDropdown, Button } from '../components/ui';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { supabase } from '../lib/supabase';
import type { ProjectItem, MemberItem, ClientItem, SkillItem, StaffItem } from '../types';
import { useAlert } from '../contexts/AlertContext';

export function ProjectPage() {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [dbMembers, setDbMembers] = useState<MemberItem[]>([]);
  const [dbClients, setDbClients] = useState<ClientItem[]>([]);
  const [dbSkills, setDbSkills] = useState<SkillItem[]>([]);
  const [dbStaffs, setDbStaffs] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [membersRes, clientsRes, skillsRes, staffsRes, projectsRes] = await Promise.all([
        supabase.from('members').select('*').eq('is_deleted', false),
        supabase.from('clients').select('*').eq('is_deleted', false),
        supabase.from('skills').select('*').eq('is_deleted', false),
        supabase.from('staffs').select('*').eq('is_deleted', false),
        supabase.from('projects').select(`
          id, name, yomigana, client_id, start_date, end_date,
          project_tasks (
            id, name, assignee_type, is_deleted,
            project_task_skills ( skill_id, skills(name) ),
            project_task_assignees ( member_id, client_id, staff_id )
          )
        `).eq('is_deleted', false)
      ]);

      if (membersRes.error) throw membersRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (skillsRes.error) throw skillsRes.error;
      if (staffsRes.error) throw staffsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setDbMembers(membersRes.data || []);
      setDbClients(clientsRes.data || []);
      setDbSkills(skillsRes.data || []);
      setDbStaffs(staffsRes.data || []);

      const formattedProjects: ProjectItem[] = (projectsRes.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        yomigana: p.yomigana || '',
        customerId: p.client_id || '',
        startDate: p.start_date,
        endDate: p.end_date,
        tasks: (p.project_tasks || [])
          .filter((pt: any) => !pt.is_deleted)
          .map((pt: any) => {
            const assignees = pt.project_task_assignees || [];

            return {
              id: pt.id,
              task: pt.name,
              requiredSkills: (pt.project_task_skills || []).map((pts: any) => ({
                id: pts.skill_id,
                skill: pts.skills?.name
              })),
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
    { key: 'name', header: TABLE_COLUMNS.PROJECT_NAME, editable: true, inputType: 'text', rowType: 'main' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text', rowType: 'main' },
    { 
      key: 'customerId', 
      header: TABLE_COLUMNS.CUSTOMER, 
      editable: true, 
      inputType: 'select', 
      options: [{ label: '未選択', value: '' }, ...dbClients.map(c => ({ label: c.name, value: c.id }))],
      render: (item: any) => dbClients.find(c => c.id === item.customerId)?.name || '',
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
            {skills.map((s: any, idx: number) => (
              <span key={idx} style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '2px 8px', fontSize: '12px' }}>
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
        
        const labels: string[] = ids.map((prefixedId: string) => {
          const [type, id] = prefixedId.split('_');
          if (type === 'member') {
            const name = dbMembers.find(u => u.id === id)?.name;
            return name ? `${name} (利用者)` : null;
          } else if (type === 'staff') {
            const name = dbStaffs.find(s => s.id === id)?.name;
            return name ? `${name} (職員)` : null;
          } else if (type === 'outsource') {
            const name = dbClients.find(c => c.id === id)?.name;
            return name ? `${name} (外注先)` : null;
          }
          return null;
        }).filter(Boolean) as string[];
        
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
      customEditRender: (value: any, _item: any, onChange: (newValue: any) => void) => {
        const currentIds = value || [];
        const options = [
          ...dbMembers.map(u => ({ value: `member_${u.id}`, label: `${u.name} (利用者)` })),
          ...dbStaffs.map(s => ({ value: `staff_${s.id}`, label: `${s.name} (職員)` })),
          ...dbClients.map(c => ({ value: `outsource_${c.id}`, label: `${c.name} (外注先)` }))
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

  const handleBatchSave = async (drafts: ProjectItem[], deletedIds: string[]) => {
    try {
      setLoading(true);

      // Handle project deletions (logical delete)
      if (deletedIds.length > 0) {
        const pIdsToDelete = deletedIds.filter(id => !id.includes('TASK'));
        const tIdsToDelete = deletedIds.filter(id => id.includes('TASK'));

        if (pIdsToDelete.length > 0) {
          await supabase.from('projects').update({ is_deleted: true }).in('id', pIdsToDelete);
        }
        if (tIdsToDelete.length > 0) {
          await supabase.from('project_tasks').update({ is_deleted: true }).in('id', tIdsToDelete);
        }
      }

      const activeProjects = drafts.filter(item => !deletedIds.includes(item.id));

      for (const p of activeProjects) {
        // Prepare project data
        const projData = {
          id: p.id,
          name: p.name,
          yomigana: p.yomigana,
          client_id: p.customerId || null,
          start_date: p.startDate,
          end_date: p.endDate
        };

        // Upsert project
        const { error: pErr } = await supabase.from('projects').upsert(projData);
        if (pErr) throw pErr;

        // Upsert tasks
        for (const t of p.tasks) {
          if (deletedIds.includes(t.id)) continue;

          const taskData = {
            id: t.id,
            project_id: p.id,
            name: t.task,
            assignee_type: null
          };

          const { error: tErr } = await supabase.from('project_tasks').upsert(taskData);
          if (tErr) throw tErr;

          // Replace skills
          await supabase.from('project_task_skills').delete().eq('task_id', t.id);
          if (t.requiredSkills?.length > 0) {
            const skillInserts = t.requiredSkills.map(s => ({
              task_id: t.id,
              skill_id: s.id
            })).filter(s => s.skill_id); // ensure valid UUID
            if (skillInserts.length > 0) {
              await supabase.from('project_task_skills').insert(skillInserts);
            }
          }

          // Replace assignees
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
      customerId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      tasks: [],
    } as ProjectItem;
  };

  const handleAddSubRow = (_parentId: string) => {
    return {
      id: generateId(),
      task: '',
      requiredSkills: [],
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
