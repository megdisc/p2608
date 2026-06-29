import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib';
import type { MemberItem, ProjectItem, StaffItem, ClientItem } from '../types';
import { getCurrentJSTMonth, getPreviousMonth } from '../utils';

export type MonthlyTaskRecord = {
  id: string;
  year_month: string;
  task_id: string;
  current_progress: number;
};

export type MonthlyContributionRecord = {
  id: string;
  year_month: string;
  member_id?: string;
  staff_id?: string;
  client_id?: string;
  task_id: string;
  contribution_ratio: number;
};

export type ProgressFlatRecord = {
  id: string;
  projectId: string;
  projectName: string;
  projectYomigana: string;
  projectType: string;
  projectTypeSortKey: string;
  yearMonth: string;
  taskId: string;
  taskName: string;
  prevProgress: number | string;
  currentProgress: number;
  userId: string;
  userName: string;
  assigneeType: string;
  userYomigana: string;
  workTime: number | string;
  contributionRatio: number;
  isSaved: boolean;
  isFirstInProject?: boolean;
  isFirstInTask?: boolean;
  isLastInProject?: boolean;
  isLastInTask?: boolean;
  isCanceled?: boolean;
  deductionAmount?: number;
};

export function useProgressRecords() {
  const [dbMembers, setDbMembers] = useState<MemberItem[]>([]);
  const [dbStaffs, setDbStaffs] = useState<StaffItem[]>([]);
  const [dbClients, setDbClients] = useState<ClientItem[]>([]);
  const [dbProjects, setDbProjects] = useState<ProjectItem[]>([]);
  
  const [currentMonthTaskRecords, setCurrentMonthTaskRecords] = useState<MonthlyTaskRecord[]>([]);
  const [prevMonthTaskRecords, setPrevMonthTaskRecords] = useState<MonthlyTaskRecord[]>([]);
  const [currentMonthMemberRecords, setCurrentMonthMemberRecords] = useState<MonthlyContributionRecord[]>([]);
  const [prevMonthMemberRecords, setPrevMonthMemberRecords] = useState<MonthlyContributionRecord[]>([]);
  
  const [workTimeSummary, setWorkTimeSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => getCurrentJSTMonth());

  const fetchMasters = useCallback(async () => {
    try {
      setLoading(true);
      const [membersRes, staffsRes, clientsRes, budgetsRes, projectsRes] = await Promise.all([
        supabase.from('members').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('staffs').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('clients').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('project_budget_items').select('*').eq('category', 'expense'),
        supabase.from('projects').select(`
          id, name, yomigana, project_type, start_date, end_date,
          project_tasks (
            id, name, yomigana, is_deleted, is_canceled,
            project_task_assignees ( member_id, staff_id, client_id )
          )
        `).eq('is_deleted', false).order('yomigana', { ascending: true }),
      ]);

      if (membersRes.error) throw membersRes.error;
      if (staffsRes.error) throw staffsRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (budgetsRes.error) throw budgetsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setDbMembers(membersRes.data || []);
      setDbStaffs(staffsRes.data || []);
      setDbClients(clientsRes.data || []);
      
      const budgetItems = budgetsRes.data || [];
      
      const formattedProjects = (projectsRes.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        yomigana: p.yomigana || '',
        projectType: p.project_type || 'one-off',
        startDate: p.start_date,
        endDate: p.end_date,
        tasks: (p.project_tasks || [])
          .filter((pt: any) => !pt.is_deleted)
          .map((pt: any) => ({
            id: pt.id,
            task: pt.name,
            taskYomigana: pt.yomigana || '',
            assigneeIds: (pt.project_task_assignees || [])
              .flatMap((pta: any) => {
                const res = [];
                if (pta.member_id) res.push(`member_${pta.member_id}`);
                if (pta.staff_id) res.push(`staff_${pta.staff_id}`);
                if (pta.client_id) res.push(`outsource_${pta.client_id}`);
                return res;
              }),
            isCanceled: pt.is_canceled || false,
            laborBudget: budgetItems.find((b: any) => b.task_id === pt.id && b.subject?.includes('労務費・外注加工費'))?.amount || 0
          }))
      }));
      setDbProjects(formattedProjects as ProjectItem[]);

    } catch (error) {
      console.error('Error fetching masters:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecords = useCallback(async (monthStr: string) => {
    try {
      setLoading(true);
      const prevMonthStr = getPreviousMonth(monthStr);

      const [year, month] = monthStr.split('-').map(Number);
      const startDate = `${monthStr}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

      const [cTaskRes, pTaskRes, cMemRes, pMemRes, workTimeRes] = await Promise.all([
        supabase.from('monthly_task_progress').select('*').eq('year_month', monthStr),
        supabase.from('monthly_task_progress').select('*').eq('year_month', prevMonthStr),
        supabase.from('monthly_member_contributions').select('*').eq('year_month', monthStr),
        supabase.from('monthly_member_contributions').select('*').eq('year_month', prevMonthStr),
        supabase.from('daily_work_records').select('member_id, task_id, work_time').gte('date', startDate).lt('date', endDate)
      ]);
      
      if (cTaskRes.error) throw cTaskRes.error;
      if (pTaskRes.error) throw pTaskRes.error;
      if (cMemRes.error) throw cMemRes.error;
      if (pMemRes.error) throw pMemRes.error;
      if (workTimeRes.error) throw workTimeRes.error;

      setCurrentMonthTaskRecords(cTaskRes.data || []);
      setPrevMonthTaskRecords(pTaskRes.data || []);
      setCurrentMonthMemberRecords(cMemRes.data || []);
      setPrevMonthMemberRecords(pMemRes.data || []);

      const timeMap: Record<string, number> = {};
      (workTimeRes.data || []).forEach((r: any) => {
        if (r.member_id) {
          const key = `member_${r.member_id}_${r.task_id}`;
          timeMap[key] = (timeMap[key] || 0) + Number(r.work_time);
        }
      });
      setWorkTimeSummary(timeMap);

    } catch (error) {
      console.error('Error fetching records:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const displayData = useMemo(() => {
    if (dbProjects.length === 0) return [];
    
    const flatRows: ProgressFlatRecord[] = [];

    for (const project of dbProjects) {
      const taskIdsInProject = project.tasks.map(t => t.id);
      
      const projectTaskRecords = currentMonthTaskRecords.filter(r => taskIdsInProject.includes(r.task_id));
      const projectMemberRecords = currentMonthMemberRecords.filter(r => taskIdsInProject.includes(r.task_id));
      
      for (const t of project.tasks) {
        const membersToProcess = new Set<string>(t.assigneeIds || []);
        
        for (const member of dbMembers) {
          if ((workTimeSummary[`member_${member.id}_${t.id}`] || 0) > 0) {
            membersToProcess.add(`member_${member.id}`);
          }
        }

        const taskMemberRecords = projectMemberRecords.filter(r => r.task_id === t.id);
        for (const r of taskMemberRecords) {
          if (r.member_id) membersToProcess.add(`member_${r.member_id}`);
          if (r.staff_id) membersToProcess.add(`staff_${r.staff_id}`);
          if (r.client_id) membersToProcess.add(`outsource_${r.client_id}`);
        }

        const taskRecord = projectTaskRecords.find(r => r.task_id === t.id);
        const prevTaskRecord = prevMonthTaskRecords.find(r => r.task_id === t.id);
        
        let taskPrevProgressRaw = prevTaskRecord ? Number(prevTaskRecord.current_progress) : 0;
        let taskPrevProgress = Math.min(100, Math.max(0, Math.round(taskPrevProgressRaw / 10) * 10));
        
        let taskCurrentProgressRaw = taskRecord ? Number(taskRecord.current_progress) : taskPrevProgressRaw;
        let taskCurrentProgress = Math.min(100, Math.max(0, Math.round(taskCurrentProgressRaw / 10) * 10));
        
        let hasAssignees = false;

        const getUserIdYomigana = (userId: string) => {
          const [type, id] = userId.split('_');
          if (type === 'member') return dbMembers.find(m => m.id === id)?.yomigana || '';
          if (type === 'staff') return dbStaffs.find(s => s.id === id)?.yomigana || '';
          if (type === 'outsource') return dbClients.find(c => c.id === id)?.yomigana || '';
          return '';
        };

        const getUserName = (userId: string) => {
          const [type, id] = userId.split('_');
          if (type === 'member') return dbMembers.find(m => m.id === id)?.name || '';
          if (type === 'staff') return dbStaffs.find(s => s.id === id)?.name || '';
          if (type === 'outsource') return dbClients.find(c => c.id === id)?.name || '';
          return '';
        };

        const getAssigneeType = (userId: string) => {
          const [type] = userId.split('_');
          if (type === 'member') return '利用者';
          if (type === 'staff') return '職員';
          if (type === 'outsource') return '外注先';
          return '';
        };

        for (const prefixedId of membersToProcess) {
          hasAssignees = true;
          const [type, id] = prefixedId.split('_');
          let savedMemberRecord;
          if (type === 'member') savedMemberRecord = taskMemberRecords.find(r => r.member_id === id);
          else if (type === 'staff') savedMemberRecord = taskMemberRecords.find(r => r.staff_id === id);
          else if (type === 'outsource') savedMemberRecord = taskMemberRecords.find(r => r.client_id === id);

          const workTime = type === 'member' ? (workTimeSummary[`${prefixedId}_${t.id}`] || 0) : '-';

          flatRows.push({
            id: savedMemberRecord ? savedMemberRecord.id : `UNSAVED-${currentMonth}-${prefixedId}-${t.id}`,
            projectId: project.id,
            projectName: project.name,
            projectYomigana: project.yomigana || '',
            projectType: project.projectType || 'one-off',
            projectTypeSortKey: (project.projectType || 'one-off') === 'ongoing' ? '0' : '1',
            yearMonth: currentMonth,
            taskId: t.id,
            taskName: t.task,
            prevProgress: taskPrevProgress,
            currentProgress: taskCurrentProgress,
            userId: prefixedId,
            userName: getUserName(prefixedId),
            assigneeType: getAssigneeType(prefixedId),
            userYomigana: getUserIdYomigana(prefixedId),
            workTime,
            contributionRatio: savedMemberRecord ? Number(savedMemberRecord.contribution_ratio) : 0,
            deductionAmount: savedMemberRecord ? Number(savedMemberRecord.deduction_amount) : 0,
            isSaved: !!savedMemberRecord,
            isCanceled: t.isCanceled
          });
        }

        if (!hasAssignees) {
           flatRows.push({
             id: taskRecord ? taskRecord.id : `UNSAVED-TASK-${currentMonth}-${t.id}`,
             projectId: project.id,
             projectName: project.name,
             projectYomigana: project.yomigana || '',
             projectType: project.projectType || 'one-off',
             projectTypeSortKey: (project.projectType || 'one-off') === 'ongoing' ? '0' : '1',
             yearMonth: currentMonth,
             taskId: t.id,
             taskName: t.task,
             prevProgress: taskPrevProgress,
             currentProgress: taskCurrentProgress,
             userId: '',
             userName: '',
             assigneeType: '',
             userYomigana: '',
             workTime: '-',
             contributionRatio: 0,
             deductionAmount: 0,
             isSaved: !!taskRecord,
             isCanceled: t.isCanceled
           });
        }
      }
    }

    flatRows.sort((a, b) => {
      const pA = dbProjects.find(p => p.id === a.projectId)?.yomigana || '';
      const pB = dbProjects.find(p => p.id === b.projectId)?.yomigana || '';
      if (pA !== pB) return pA.localeCompare(pB);

      const tA = dbProjects.flatMap(p => p.tasks).find(t => t.id === a.taskId)?.taskYomigana || '';
      const tB = dbProjects.flatMap(p => p.tasks).find(t => t.id === b.taskId)?.taskYomigana || '';
      if (tA !== tB) return tA.localeCompare(tB);
      
      const getTypePrio = (userId: string) => {
        if (userId.startsWith('member_')) return 1;
        if (userId.startsWith('staff_')) return 2;
        if (userId.startsWith('outsource_')) return 3;
        return 4;
      };

      const aPrio = getTypePrio(a.userId);
      const bPrio = getTypePrio(b.userId);
      if (aPrio !== bPrio) return aPrio - bPrio;

      return a.userYomigana.localeCompare(b.userYomigana);
    });

    let prevProjectId = '';
    let prevTaskId = '';

    const finalRows = flatRows.map((r, i) => {
      const isFirstInProject = r.projectId !== prevProjectId;
      const isFirstInTask = isFirstInProject || r.taskId !== prevTaskId;

      let isLastInProject = true;
      let isLastInTask = true;

      if (i < flatRows.length - 1) {
        const next = flatRows[i + 1];
        if (next.projectId === r.projectId) isLastInProject = false;
        if (next.taskId === r.taskId) isLastInTask = false;
      }

      prevProjectId = r.projectId;
      prevTaskId = r.taskId;

      return { ...r, isFirstInProject, isFirstInTask, isLastInProject, isLastInTask };
    });

    return finalRows;
  }, [currentMonth, dbMembers, dbStaffs, dbClients, dbProjects, currentMonthTaskRecords, prevMonthTaskRecords, currentMonthMemberRecords, prevMonthMemberRecords, workTimeSummary]);

  const batchSaveProgressRecords = async (drafts: ProgressFlatRecord[], deletedIds: string[]) => {
    try {
      setLoading(true);
      
      const taskUpserts: any[] = [];
      const taskDeletes: string[] = [];
      const memberUpserts: any[] = [];
      const memberDeletes: string[] = [];
      const projectTaskUpdates: any[] = [];

      for (const r of drafts) {
        if (deletedIds.includes(r.id)) continue;

        if (r.taskId && r.isFirstInTask && !deletedIds.includes(`TASK-${r.taskId}`)) { 
          taskUpserts.push({
            year_month: currentMonth,
            task_id: r.taskId,
            current_progress: r.currentProgress || 0
          });
          if (r.isCanceled !== undefined) {
            projectTaskUpdates.push({
              id: r.taskId,
              is_canceled: r.isCanceled
            });
          }
        }

        if (r.userId && r.taskId) {
          const [type, id] = r.userId.split('_');
          memberUpserts.push({
            ...(r.isSaved && !r.id.startsWith('TEMP') && !r.id.startsWith('UNSAVED') ? { id: r.id } : {}),
            year_month: currentMonth,
            member_id: type === 'member' ? id : null,
            staff_id: type === 'staff' ? id : null,
            client_id: type === 'outsource' ? id : null,
            task_id: r.taskId,
            contribution_ratio: Number(r.contributionRatio) || 0,
            deduction_amount: Number(r.deductionAmount) || 0
          });
        }
      }

      const uniqueTaskUpserts = Array.from(new Map(taskUpserts.map(t => [t.task_id, t])).values());

      const promises = [];

      if (taskDeletes.length > 0) {
        promises.push(supabase.from('monthly_task_progress').delete().in('id', taskDeletes));
      }
      if (memberDeletes.length > 0) {
        promises.push(supabase.from('monthly_member_contributions').delete().in('id', memberDeletes));
      }
      
      if (uniqueTaskUpserts.length > 0) {
        promises.push(supabase.from('monthly_task_progress').upsert(uniqueTaskUpserts, { onConflict: 'year_month,task_id' }));
      }
      if (memberUpserts.length > 0) {
        promises.push(supabase.from('monthly_member_contributions').upsert(memberUpserts));
      }

      if (projectTaskUpdates.length > 0) {
        const uniqueProjectTasks = Array.from(new Map(projectTaskUpdates.map(t => [t.id, t])).values());
        for (const t of uniqueProjectTasks) {
          promises.push(supabase.from('project_tasks').update({ is_canceled: t.is_canceled }).eq('id', t.id));
        }
      }

      const results = await Promise.all(promises);
      for (const res of results) {
        if (res.error) throw res.error;
      }

      await fetchRecords(currentMonth);
      await fetchMasters();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    dbMembers,
    dbStaffs,
    dbClients,
    dbProjects,
    loading,
    currentMonth,
    setCurrentMonth,
    displayData,
    fetchMasters,
    fetchRecords,
    batchSaveProgressRecords
  };
}
