import { useState, useEffect } from 'react';
import { Button, Pagination, MultiSelectDropdown, SortIcon } from '../components';
import { PAGE_NAMES, TABLE_COLUMNS, MESSAGES, WORDS_PERSON, WORDS_ORG_LOCATION, OPTIONS, BUTTON_LABELS } from '../constants';
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
  memberIds: string[];
  staffIds: string[];
  clientIds: string[];
  isFirstInProject?: boolean;
  isLastInProject?: boolean;
  isFirstInTask?: boolean;
  isLastInTask?: boolean;
  requiredSkills: { skillId: string, levelValue: number }[];
};

export function AssigneeAllocationPage() {
  const [drafts, setDrafts] = useState<AllocationRow[]>([]);
  const [originalDrafts, setOriginalDrafts] = useState<AllocationRow[]>([]);
  const [dbMembers, setDbMembers] = useState<MemberItem[]>([]);
  const [dbClients, setDbClients] = useState<ClientItem[]>([]);
  const [dbStaffs, setDbStaffs] = useState<StaffItem[]>([]);
  const [memberSkillMap, setMemberSkillMap] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'projectType', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  
  const { showAlert } = useAlert();

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [membersRes, clientsRes, staffsRes, projectsRes, evalsRes] = await Promise.all([
        supabase.from('members').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('clients').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('staffs').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('projects').select(`
          id, name, yomigana, project_type, client_id, start_date, end_date,
          project_tasks (
            id, name, yomigana, is_deleted,
            project_task_assignees ( member_id, client_id, staff_id ),
            project_task_skills ( skill_id, skill_levels ( level_value ) )
          )
        `).eq('is_deleted', false),
        supabase.from('member_skill_evaluations').select(`
          member_id, skill_id, skill_levels(level_value)
        `)
      ]);

      if (membersRes.error) throw membersRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (staffsRes.error) throw staffsRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (evalsRes.error) throw evalsRes.error;

      setDbMembers(membersRes.data || []);
      setDbClients(clientsRes.data || []);
      setDbStaffs(staffsRes.data || []);

      const evals = evalsRes.data || [];
      const skillMap: Record<string, Record<string, number>> = {};
      evals.forEach((e: any) => {
        if (!skillMap[e.member_id]) skillMap[e.member_id] = {};
        skillMap[e.member_id][e.skill_id] = e.skill_levels?.level_value || 0;
      });
      setMemberSkillMap(skillMap);

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
              memberIds: assignees.filter((a: any) => a.member_id).map((a: any) => a.member_id),
              staffIds: assignees.filter((a: any) => a.staff_id).map((a: any) => a.staff_id),
              clientIds: assignees.filter((a: any) => a.client_id).map((a: any) => a.client_id),
              requiredSkills: (pt.project_task_skills || []).map((pts: any) => ({
                skillId: pts.skill_id,
                levelValue: pts.skill_levels?.level_value || 0
              }))
            });
          });
      });

      setDrafts(formattedTasks);
      setOriginalDrafts(JSON.parse(JSON.stringify(formattedTasks)));
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

  const handleBatchSave = async () => {
    try {
      setLoading(true);

      for (const t of drafts) {
        await supabase.from('project_task_assignees').delete().eq('task_id', t.id);
        
        const assigneeInserts: any[] = [];
        t.memberIds.forEach(id => assigneeInserts.push({ task_id: t.id, member_id: id }));
        t.staffIds.forEach(id => assigneeInserts.push({ task_id: t.id, staff_id: id }));
        t.clientIds.forEach(id => assigneeInserts.push({ task_id: t.id, client_id: id }));
        
        if (assigneeInserts.length > 0) {
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

  const handleChange = (id: string, field: 'memberIds' | 'staffIds' | 'clientIds', newIds: string[]) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, [field]: newIds } : d));
  };

  const isModified = JSON.stringify(drafts) !== JSON.stringify(originalDrafts);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current && current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Compute sorted drafts on the fly
  const displayDrafts = [...drafts].sort((a, b) => {
    if (sortConfig) {
      let aVal = '';
      let bVal = '';
      if (sortConfig.key === 'projectType') {
        aVal = a.projectTypeSortKey;
        bVal = b.projectTypeSortKey;
      } else if (sortConfig.key === 'name') {
        aVal = a.projectYomigana;
        bVal = b.projectYomigana;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    }
    
    // Default fallback sorting
    const keyA = a.projectTypeSortKey;
    const keyB = b.projectTypeSortKey;
    if (keyA !== keyB) return keyA.localeCompare(keyB);
    const projA = a.projectYomigana;
    const projB = b.projectYomigana;
    if (projA !== projB) return projA.localeCompare(projB);
    return a.taskYomigana.localeCompare(b.taskYomigana);
  });

  // Re-apply grouping flags dynamically
  let prevProjectId = '';
  let prevTaskId = '';
  
  const finalDrafts = displayDrafts.map((r, i) => {
    const isFirstInProject = r.projectId !== prevProjectId;
    const isFirstInTask = r.id !== prevTaskId;

    let isLastInProject = true;
    let isLastInTask = true;

    if (i < displayDrafts.length - 1) {
      const next = displayDrafts[i + 1];
      if (next.projectId === r.projectId) isLastInProject = false;
      if (next.id === r.id) isLastInTask = false;
    }

    prevProjectId = r.projectId;
    prevTaskId = r.id;

    return { ...r, isFirstInProject, isLastInProject, isFirstInTask, isLastInTask };
  });

  const totalPages = Math.ceil(finalDrafts.length / pageSize);
  const paginatedDrafts = finalDrafts.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((r, i) => {
    if (i === 0) {
      return { ...r, isFirstInProject: true, isFirstInTask: true };
    }
    return r;
  });

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{PAGE_NAMES.ASSIGNEE_ALLOCATION}</h2>
      </div>

      <div className="table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: '120px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('projectType')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {TABLE_COLUMNS.PROJECT_TYPE}
                  <SortIcon active={sortConfig?.key === 'projectType'} direction={sortConfig?.direction || 'asc'} />
                </div>
              </th>
              <th rowSpan={2} style={{ width: '200px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {TABLE_COLUMNS.PROJECT_NAME}
                  <SortIcon active={sortConfig?.key === 'name'} direction={sortConfig?.direction || 'asc'} />
                </div>
              </th>
              <th rowSpan={2} style={{ width: '200px' }}>{TABLE_COLUMNS.TASK}</th>
              <th colSpan={3} style={{ textAlign: 'left' }}>{TABLE_COLUMNS.ASSIGNEE}</th>
            </tr>
            <tr>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px', width: '200px' }}>{WORDS_PERSON.ROLE_MEMBER}</th>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px', width: '200px' }}>{WORDS_PERSON.ROLE_STAFF}</th>
              <th style={{ backgroundColor: 'var(--color-bg-subtle)', top: '43px', width: '200px' }}>{WORDS_ORG_LOCATION.OUTSOURCE}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDrafts.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-message">案件データがありません</td>
              </tr>
            ) : (
              paginatedDrafts.map((item) => (
                <tr key={item.id}>
                  <td style={{ borderBottom: item.isLastInProject ? undefined : 'none' }}>
                    {item.isFirstInProject ? (OPTIONS.PROJECT_TYPE_OPTIONS.find(o => o.value === item.projectType)?.label || '') : ''}
                  </td>
                  <td style={{ borderBottom: item.isLastInProject ? undefined : 'none' }}>
                    {item.isFirstInProject ? item.projectName : ''}
                  </td>
                  <td style={{ borderBottom: item.isLastInTask ? undefined : 'none' }}>
                    {item.isFirstInTask ? item.task : ''}
                  </td>
                  <td style={{ backgroundColor: 'var(--color-bg-input-highlight)' }}>
                    <MultiSelectDropdown 
                      options={dbMembers.filter(u => {
                        const reqSkills = item.requiredSkills || [];
                        if (reqSkills.length === 0) return true;
                        
                        const uSkills = memberSkillMap[u.id] || {};
                        return reqSkills.every(rs => {
                           const uLevel = uSkills[rs.skillId] || 0;
                           return uLevel >= rs.levelValue;
                        });
                      }).map(u => ({ value: u.id, label: u.name }))}
                      value={item.memberIds}
                      onChange={(newVal) => handleChange(item.id, 'memberIds', newVal)}
                      placeholder="選択"
                    />
                  </td>
                  <td style={{ backgroundColor: 'var(--color-bg-input-highlight)' }}>
                    <MultiSelectDropdown 
                      options={dbStaffs.map(s => ({ value: s.id, label: s.name }))}
                      value={item.staffIds}
                      onChange={(newVal) => handleChange(item.id, 'staffIds', newVal)}
                      placeholder="選択"
                    />
                  </td>
                  <td style={{ backgroundColor: 'var(--color-bg-input-highlight)' }}>
                    <MultiSelectDropdown 
                      options={dbClients.map(c => ({ value: c.id, label: c.name }))}
                      value={item.clientIds}
                      onChange={(newVal) => handleChange(item.id, 'clientIds', newVal)}
                      placeholder="選択"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="action-bar">
        <div className="filter-controls"></div>
        <div className="action-buttons">
          <Button variant="secondary" onClick={() => setDrafts(JSON.parse(JSON.stringify(originalDrafts)))} disabled={!isModified}>
            {BUTTON_LABELS.CANCEL || '取消'}
          </Button>
          <Button variant="primary" onClick={handleBatchSave} disabled={!isModified}>
            {BUTTON_LABELS.SAVE || '確定'}
          </Button>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
}
