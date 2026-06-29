import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import { getCurrentISOString } from '../utils';
import { WORDS_PERSON, WORDS_ORG_LOCATION } from '../constants';

export type ProjectSummaryRow = {
  id: string;
  projectName: string;
  projectYomigana: string;
  projectType: string;
  projectTypeSortKey: string;
  taskName: string;
  progressRate: number;
  assigneeType: string;
  assigneeName: string;
  isFirstInProject: boolean;
  isFirstInTask: boolean;
  isLastInProject: boolean;
  isLastInTask: boolean;
};

export function useProjectSummary() {
  const [data, setData] = useState<ProjectSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetDate] = useState(() => getCurrentISOString());

  const fetchProjectSummary = useCallback(async () => {
    try {
      setLoading(true);
      const [
        projectsRes,
        membersRes,
        clientsRes,
        staffsRes,
        progressRes
      ] = await Promise.all([
        supabase.from('projects').select(`
          id, name, yomigana, project_type,
          project_tasks (
            id, name, yomigana, is_deleted,
            project_task_assignees (
              id, member_id, client_id, staff_id
            )
          )
        `).eq('is_deleted', false).neq('id', '00000000-0000-0000-0000-000000000001').order('yomigana', { ascending: true }),
        supabase.from('members').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('clients').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('staffs').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('monthly_task_progress').select('task_id, current_progress, year_month')
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (membersRes.error) throw membersRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (staffsRes.error) throw staffsRes.error;
      if (progressRes.error) throw progressRes.error;

      const projects = projectsRes.data || [];
      const members = membersRes.data || [];
      const clients = clientsRes.data || [];
      const staffs = staffsRes.data || [];
      const records = progressRes.data || [];

      const memberMap = new Map(members.map(m => [m.id, { name: m.name, yomigana: m.yomigana }]));
      const clientMap = new Map(clients.map(c => [c.id, { name: c.name, yomigana: c.yomigana }]));
      const staffMap = new Map(staffs.map(s => [s.id, { name: s.name, yomigana: s.yomigana }]));

      const latestProgressMap = new Map<string, number>();
      const sortedRecords = [...records].sort((a, b) => a.year_month.localeCompare(b.year_month));
      for (const r of sortedRecords) {
        latestProgressMap.set(r.task_id, Number(r.current_progress));
      }

      const tempRows: any[] = [];

      for (const p of projects) {
        const projectTasks = (p.project_tasks || []).filter((t: any) => !t.is_deleted);
        
        if (projectTasks.length === 0) {
          tempRows.push({
            projectId: p.id,
            projectName: p.name,
            projectYomigana: p.yomigana || '',
            projectType: p.project_type || 'one-off',
            projectTypeSortKey: (p.project_type || 'one-off') === 'ongoing' ? '0' : '1',
            taskId: 'no_task',
            taskName: '',
            taskYomigana: '',
            progressRate: 0,
            assigneeType: '',
            assigneeId: 'no_assignee',
            assigneeName: '',
            assigneeYomigana: ''
          });
          continue;
        }

        for (const t of projectTasks) {
          const assignees = t.project_task_assignees || [];
          const progressRate = latestProgressMap.get(t.id) || 0;
          
          if (assignees.length === 0) {
            tempRows.push({
              projectId: p.id,
              projectName: p.name,
              projectYomigana: p.yomigana || '',
              projectType: p.project_type || 'one-off',
              projectTypeSortKey: (p.project_type || 'one-off') === 'ongoing' ? '0' : '1',
              taskId: t.id,
              taskName: t.name,
              taskYomigana: t.yomigana || '',
              progressRate,
              assigneeType: '',
              assigneeId: 'unassigned',
              assigneeName: '未割り当て',
              assigneeYomigana: ''
            });
          } else {
            for (const a of assignees) {
              let assigneeName = '不明';
              let assigneeYomigana = '';
              let displayAssigneeType = '';
              if (a.member_id) {
                const m = memberMap.get(a.member_id);
                assigneeName = m?.name || '不明';
                assigneeYomigana = m?.yomigana || '';
                displayAssigneeType = WORDS_PERSON.ROLE_MEMBER;
              } else if (a.client_id) {
                const c = clientMap.get(a.client_id);
                assigneeName = c?.name || '不明';
                assigneeYomigana = c?.yomigana || '';
                displayAssigneeType = WORDS_ORG_LOCATION.OUTSOURCE;
              } else if (a.staff_id) {
                const s = staffMap.get(a.staff_id);
                assigneeName = s?.name || '不明';
                assigneeYomigana = s?.yomigana || '';
                displayAssigneeType = WORDS_PERSON.ROLE_STAFF;
              }

              tempRows.push({
                projectId: p.id,
                projectName: p.name,
                projectYomigana: p.yomigana || '',
                projectType: p.project_type || 'one-off',
                projectTypeSortKey: (p.project_type || 'one-off') === 'ongoing' ? '0' : '1',
                taskId: t.id,
                taskName: t.name,
                taskYomigana: t.yomigana || '',
                progressRate,
                assigneeType: displayAssigneeType,
                assigneeId: a.id || `${a.member_id || a.client_id || a.staff_id}`,
                assigneeName,
                assigneeYomigana
              });
            }
          }
        }
      }

      tempRows.sort((a, b) => {
        if (a.projectYomigana !== b.projectYomigana) return a.projectYomigana.localeCompare(b.projectYomigana);
        if (a.taskYomigana !== b.taskYomigana) return a.taskYomigana.localeCompare(b.taskYomigana);
        
        const getAssigneeTypePriority = (type: string) => {
          if (type === WORDS_PERSON.ROLE_MEMBER) return 1;
          if (type === WORDS_PERSON.ROLE_STAFF) return 2;
          if (type === WORDS_ORG_LOCATION.OUTSOURCE) return 3;
          return 4;
        };
        const aTypePrio = getAssigneeTypePriority(a.assigneeType);
        const bTypePrio = getAssigneeTypePriority(b.assigneeType);
        if (aTypePrio !== bTypePrio) return aTypePrio - bTypePrio;

        return a.assigneeYomigana.localeCompare(b.assigneeYomigana);
      });

      const flatRows: ProjectSummaryRow[] = [];
      let prevProjectId = '';
      let prevTaskId = '';

      for (let i = 0; i < tempRows.length; i++) {
        const r = tempRows[i];
        const isFirstInProject = r.projectId !== prevProjectId;
        const isFirstInTask = isFirstInProject || r.taskId !== prevTaskId;

        let isLastInProject = true;
        let isLastInTask = true;
        if (i < tempRows.length - 1) {
          const next = tempRows[i + 1];
          if (next.projectId === r.projectId) isLastInProject = false;
          if (next.taskId === r.taskId) isLastInTask = false;
        }

        flatRows.push({
          id: `${r.projectId}_${r.taskId}_${r.assigneeId}`,
          projectName: r.projectName,
          projectYomigana: r.projectYomigana,
          projectType: r.projectType,
          projectTypeSortKey: r.projectTypeSortKey,
          taskName: r.taskName,
          progressRate: r.progressRate,
          assigneeType: r.assigneeType,
          assigneeName: r.assigneeName,
          isFirstInProject,
          isFirstInTask,
          isLastInProject,
          isLastInTask
        });

        prevProjectId = r.projectId;
        prevTaskId = r.taskId;
      }

      setData(flatRows);
    } catch (err) {
      console.error('Error fetching project summary:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    targetDate,
    fetchProjectSummary
  };
}
