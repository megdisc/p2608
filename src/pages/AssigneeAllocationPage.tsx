import { useState, useEffect } from 'react';
import { Button, Pagination, MultiSelectDropdown, SortIcon, Tooltip } from '../components';
import { TABLE_COLUMNS, MESSAGES, OPTIONS, BUTTON_LABELS } from '../constants';

import { supabase } from '../lib';
import type { MemberItem, ClientItem } from '../types';
import { useAlert } from '../contexts';

type AllocationRow = {
  id: string; // task id
  projectId: string;
  projectType: string;
  projectTypeSortKey: string;
  projectName: string;
  projectCode: string;
  task: string;
  memberIds: string[];
  clientIds: string[];
  assigneeType: string;
  isProjectFinished?: boolean;
  isFirstInProject?: boolean;
  isLastInProject?: boolean;
  isFirstInTask?: boolean;
  isLastInTask?: boolean;
  requiredSkills: { skillId: string, levelValue: number }[];
  hasNoTask?: boolean;
};

export function AssigneeAllocationPage() {
  const [drafts, setDrafts] = useState<AllocationRow[]>([]);
  const [originalDrafts, setOriginalDrafts] = useState<AllocationRow[]>([]);
  const [dbMembers, setDbMembers] = useState<MemberItem[]>([]);
  const [dbClients, setDbClients] = useState<ClientItem[]>([]);
  const [memberSkillMap, setMemberSkillMap] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'projectCode', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  
  const { showAlert } = useAlert();

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [membersRes, clientsRes, projectsRes, evalsRes] = await Promise.all([
        supabase.from('members').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('partners').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('projects').select(`
          id, code, name, project_type, client_id,
          project_tasks (
            id, name, is_deleted, assignee_type, is_completed, completed_at,
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
      if (projectsRes.error) throw projectsRes.error;
      if (evalsRes.error) throw evalsRes.error;

      setDbMembers(membersRes.data || []);
      setDbClients((clientsRes.data || []).map((c: any) => ({
        id: c.id,
        code: c.code || '',
        name: c.name,
        yomigana: c.yomigana || '',
        contactPerson: c.contact_person || '',
        phone: c.phone || '',
        isCustomer: c.is_customer ?? true,
        isSubcontractor: c.is_subcontractor ?? true,
        is_deleted: c.is_deleted
      })));

      const evals = evalsRes.data || [];
      const skillMap: Record<string, Record<string, number>> = {};
      evals.forEach((e: any) => {
        if (!skillMap[e.member_id]) skillMap[e.member_id] = {};
        skillMap[e.member_id][e.skill_id] = e.skill_levels?.level_value || 0;
      });
      setMemberSkillMap(skillMap);

      const formattedTasks: AllocationRow[] = [];
      
      (projectsRes.data || [])
        .filter((p: any) => p.project_type !== 'other' && p.project_type !== 'その他')
        .forEach((p: any) => {
        const projectTypeSortKey = p.project_type === 'ongoing' ? '0' : (p.project_type === 'その他' ? '2' : '1');
        const activeTasks = (p.project_tasks || []).filter((pt: any) => !pt.is_deleted);
        const isFinished = activeTasks.length > 0 && activeTasks.every((pt: any) => pt.is_completed);

        if (activeTasks.length === 0) {
          formattedTasks.push({
            id: `NO_TASK_${p.id}`,
            projectId: p.id,
            projectType: p.project_type || 'one-off',
            projectTypeSortKey,
            projectName: p.name,
            projectCode: p.code || '',
            task: '-',
            assigneeType: 'internal',
            isProjectFinished: false,
            memberIds: [],
            clientIds: [],
            requiredSkills: [],
            hasNoTask: true
          });
        } else {
          activeTasks.forEach((pt: any) => {
            const assignees = pt.project_task_assignees || [];
            formattedTasks.push({
              id: pt.id,
              projectId: p.id,
              projectType: p.project_type || 'one-off',
              projectTypeSortKey,
              projectName: p.name,
              projectCode: p.code || '',
              task: pt.name,
              assigneeType: pt.assignee_type || 'internal',
              isProjectFinished: isFinished,
              memberIds: assignees.filter((a: any) => a.member_id).map((a: any) => a.member_id),
              clientIds: assignees.filter((a: any) => a.client_id).map((a: any) => a.client_id),
              requiredSkills: (pt.project_task_skills || []).map((pts: any) => ({
                skillId: pts.skill_id,
                levelValue: pts.skill_levels?.level_value || 0
              }))
            });
          });
        }
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
        if (t.hasNoTask) continue;
        await supabase.from('project_task_assignees').delete().eq('task_id', t.id);
        
        const assigneeInserts: any[] = [];
        t.memberIds.forEach(id => assigneeInserts.push({ task_id: t.id, member_id: id }));
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

  const handleChange = (id: string, field: 'memberIds' | 'clientIds' | 'assigneeType', newValue: any) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, [field]: newValue } : d));
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

  const displayDrafts = [...drafts].sort((a, b) => {
    if (sortConfig) {
      let aVal = '';
      let bVal = '';
      if (sortConfig.key === 'projectCode') {
        aVal = a.projectCode;
        bVal = b.projectCode;
      } else if (sortConfig.key === 'name') {
        aVal = a.projectName;
        bVal = b.projectName;
      } else if (sortConfig.key === 'projectType') {
        aVal = a.projectTypeSortKey;
        bVal = b.projectTypeSortKey;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    }
    
    const projA = a.projectCode;
    const projB = b.projectCode;
    if (projA !== projB) return projB.localeCompare(projA);
    return 0;
  });

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
  const paginatedDrafts = finalDrafts.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((r, i, arr) => {
    let item = r;
    if (i === 0) {
      item = { ...item, isFirstInProject: true, isFirstInTask: true };
    }
    if (i === arr.length - 1) {
      item = { ...item, isLastInProject: true, isLastInTask: true };
    }
    return item;
  });

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <>
      <div className="table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th rowSpan={1} style={{ width: '100px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('projectCode')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {TABLE_COLUMNS.PROJECT_ID}
                  <SortIcon active={sortConfig?.key === 'projectCode'} direction={sortConfig?.direction || 'asc'} />
                </div>
              </th>
              <th rowSpan={1} style={{ width: '200px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {TABLE_COLUMNS.PROJECT_NAME}
                  <SortIcon active={sortConfig?.key === 'name'} direction={sortConfig?.direction || 'asc'} />
                </div>
              </th>
              <th rowSpan={1} style={{ width: '200px' }}>{TABLE_COLUMNS.TASK}</th>
              <th rowSpan={1} style={{ width: '120px' }}>{TABLE_COLUMNS.ASSIGNEE_TYPE}</th>
              <th rowSpan={1} style={{ textAlign: 'left' }}>{TABLE_COLUMNS.ASSIGNEE}</th>
              <th className="sticky-right" rowSpan={1} style={{ width: '60px', textAlign: 'center', right: '0' }}>{TABLE_COLUMNS.RESTRICTION}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDrafts.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-message">案件データがありません</td>
              </tr>
            ) : (
              paginatedDrafts.map((item) => (
                <Tooltip text="案件終了のため変更不可" as="tr" disabled={!item.isProjectFinished} key={item.id}>
                  <td style={{ borderBottom: item.isLastInProject ? undefined : 'none' }}>
                    {item.isFirstInProject ? item.projectCode : ''}
                  </td>
                  <td style={{ borderBottom: item.isLastInProject ? undefined : 'none' }}>
                    {item.isFirstInProject ? <span>{item.projectName}</span> : ''}
                  </td>
                  <td style={{ borderBottom: item.isLastInTask ? undefined : 'none' }}>
                    {item.isFirstInTask ? item.task : ''}
                  </td>
                  <td style={{ borderBottom: item.isLastInTask ? undefined : 'none' }}>
                    {item.hasNoTask ? '-' : (OPTIONS.ASSIGNEE_TYPE_OPTIONS.find(opt => opt.value === item.assigneeType)?.label || item.assigneeType)}
                  </td>
                  <td className={item.isProjectFinished || item.hasNoTask ? undefined : 'bg-input-highlight'}>
                    {item.hasNoTask ? (
                      <span style={{ color: 'var(--color-text-muted)', paddingLeft: '4px' }}>-</span>
                    ) : item.assigneeType === 'internal' ? (
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
                        placeholder="利用者を選択"
                        disabled={item.isProjectFinished}
                      />
                    ) : (
                      <MultiSelectDropdown 
                        options={dbClients
                          .filter(c => c.isSubcontractor !== false || (item.clientIds && item.clientIds.includes(c.id)))
                          .map(c => ({ value: c.id, label: c.name }))}
                        value={item.clientIds}
                        onChange={(newVal) => handleChange(item.id, 'clientIds', newVal)}
                        placeholder="外注先を選択"
                        disabled={item.isProjectFinished}
                      />
                    )}
                  </td>
                  <td className="sticky-right" style={{ textAlign: 'center', borderBottom: item.isLastInProject ? undefined : 'none' }}>
                    {item.isFirstInProject && item.isProjectFinished && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    )}
                  </td>
                </Tooltip>
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
