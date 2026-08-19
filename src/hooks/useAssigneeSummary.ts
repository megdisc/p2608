import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import { WORDS_PERSON } from '../constants';
import { getCurrentISOString } from '../utils';

export type SummaryRow = {
  id: string;
  assigneeId: string;
  assigneeType: string;
  assigneeTypeSortKey: number;
  assigneeName: string;
  assigneeYomigana: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  projectType: string;
  projectTypeSortKey: string;
  taskName: string;
  taskCode?: string;
  taskStatus: string;
  isFirstInAssignee: boolean;
  isFirstInProject: boolean;
  isLastInAssignee: boolean;
  isLastInProject: boolean;
};

export function useAssigneeSummary() {
  const [data, setData] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetDate] = useState(() => getCurrentISOString());

  const fetchAssigneeSummary = useCallback(async () => {
    try {
      setLoading(true);
      const [
        projectsRes,
        membersRes
      ] = await Promise.all([
        supabase.from('projects').select(`
          id, code, name, project_type,
          project_tasks (
            id, code, name, is_deleted, status,
            project_task_assignees (
              id, member_id, client_id, staff_id
            )
          )
        `).eq('is_deleted', false),
        supabase.from('members').select('id, name, yomigana').eq('is_deleted', false)
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (membersRes.error) throw membersRes.error;

      const projects = projectsRes.data || [];
      const members = membersRes.data || [];

      const memberMap = new Map(members.map(m => [m.id, { name: m.name, yomigana: m.yomigana }]));

      const tempRows: any[] = [];

      for (const p of projects) {
        const projectTasks = (p.project_tasks || []).filter((t: any) => !t.is_deleted);

        for (const t of projectTasks) {
          const assignees = t.project_task_assignees || [];
          const taskStatus = t.status || 'not_started';
          
          if (assignees.length === 0) {
            // Do not add unassigned tasks to Assignee Summary (担当状況集計)
            // User requested not to show "Other" (未割り当て) assignee data.
          } else {
            for (const a of assignees) {
              if (!a.member_id) continue;

              const m = memberMap.get(a.member_id);
              const assigneeName = m?.name || '不明';
              const assigneeYomigana = m?.yomigana || '';

              tempRows.push({
                assigneeType: WORDS_PERSON.ROLE_MEMBER,
                assigneeTypeSortKey: 2,
                assigneeId: `member_${a.member_id}`,
                assigneeName,
                assigneeYomigana,
                projectId: p.id,
                projectName: p.name,
                projectCode: p.code || '',
                projectType: p.project_type || 'one-off',
                projectTypeSortKey: p.project_type === 'ongoing' ? '0' : (p.project_type === 'その他' ? '2' : '1'),
                taskId: t.id,
                taskName: t.name,
                taskCode: t.code || '',
                taskStatus,
              });
            }
          }
        }
      }

      tempRows.sort((a, b) => {
        if (a.assigneeTypeSortKey !== b.assigneeTypeSortKey) return a.assigneeTypeSortKey - b.assigneeTypeSortKey;
        if (a.assigneeYomigana !== b.assigneeYomigana) return a.assigneeYomigana.localeCompare(b.assigneeYomigana);
        if (a.projectTypeSortKey !== b.projectTypeSortKey) return a.projectTypeSortKey.localeCompare(b.projectTypeSortKey);
        if (a.projectCode !== b.projectCode) return a.projectCode.localeCompare(b.projectCode);
        return (a.taskName || '').localeCompare(b.taskName || '');
      });

      const flatRows: SummaryRow[] = [];
      let prevAssigneeId = '';
      let prevProjectId = '';

      for (let i = 0; i < tempRows.length; i++) {
        const r = tempRows[i];
        const isFirstInAssignee = r.assigneeId !== prevAssigneeId;
        const isFirstInProject = isFirstInAssignee || r.projectId !== prevProjectId;

        let isLastInAssignee = true;
        let isLastInProject = true;
        if (i < tempRows.length - 1) {
          const next = tempRows[i + 1];
          if (next.assigneeId === r.assigneeId) {
            isLastInAssignee = false;
            if (next.projectId === r.projectId) {
              isLastInProject = false;
            }
          }
        }

        flatRows.push({
          id: `${r.assigneeId}_${r.projectId}_${r.taskId}`,
          assigneeId: r.assigneeId,
          assigneeType: r.assigneeType,
          assigneeTypeSortKey: r.assigneeTypeSortKey,
          assigneeName: r.assigneeName,
          assigneeYomigana: r.assigneeYomigana,
          projectId: r.projectId,
          projectName: r.projectName,
          projectCode: r.projectCode,
          projectType: r.projectType,
          projectTypeSortKey: r.projectTypeSortKey,
          taskName: r.taskName,
          taskCode: r.taskCode,
          taskStatus: r.taskStatus,
          isFirstInAssignee,
          isFirstInProject,
          isLastInAssignee,
          isLastInProject
        });

        prevAssigneeId = r.assigneeId;
        prevProjectId = r.projectId;
      }

      setData(flatRows);
    } catch (err) {
      console.error('Error fetching assignee summary:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    targetDate,
    fetchAssigneeSummary
  };
}
