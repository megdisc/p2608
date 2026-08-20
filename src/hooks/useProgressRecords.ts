import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib';
import type { MemberItem, ProjectItem, StaffItem, ClientItem } from '../types';
import { getCurrentJSTMonth } from '../utils';

export type ProgressFlatRecord = {
  id: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  projectType: string;
  projectTypeSortKey: string;
  settlementYearMonth?: string;
  createdAt?: string;
  yearMonth: string;
  taskId: string;
  taskName: string;
  taskStatus: string;
  taskPrevStatus: string;
  taskCompletedAt?: string;
  laborBudget?: number;
  pastAllocationAmount?: number;
  projectStatus: string;
  userId: string;
  userName: string;
  assigneeType: string;
  userYomigana: string;
  workTime: number | string;
  cumulativeWorkTime: number | string;
  allocationAmount: number;
  isSaved: boolean;
  isFirstInProject?: boolean;
  isFirstInTask?: boolean;
  isLastInProject?: boolean;
  isLastInTask?: boolean;
  isCanceled?: boolean;
  isTaskCompleted?: boolean;
  hasWorkTime?: boolean;
  deductionAmount?: number;
};

export function useProgressRecords() {
  const [dbMembers, setDbMembers] = useState<MemberItem[]>([]);
  const [dbStaffs, setDbStaffs] = useState<StaffItem[]>([]);
  const [dbClients, setDbClients] = useState<ClientItem[]>([]);
  const [dbProjects, setDbProjects] = useState<ProjectItem[]>([]);

  const [workTimeSummary, setWorkTimeSummary] = useState<Record<string, number>>({});
  const [cumulativeWorkTimeSummary, setCumulativeWorkTimeSummary] = useState<Record<string, number>>({});
  const [taskHasWorkSummary, setTaskHasWorkSummary] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => getCurrentJSTMonth());

  const fetchMasters = useCallback(async () => {
    try {
      setLoading(true);
      const [membersRes, staffsRes, clientsRes, budgetsRes, projectsRes] = await Promise.all([
        supabase.from('members').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('staffs').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('partners').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('project_budgets').select('*').eq('category', 'expense'),
        supabase.from('projects').select(`
          id, code, name, project_type, settlement_year_month, created_at, client_id,
          project_tasks (
            id, code, name, is_deleted, is_canceled, status, completed_at,
            project_task_assignees ( member_id, staff_id, client_id )
          )
        `).eq('is_deleted', false).order('code', { ascending: true }),
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
      
      const formattedProjects = (projectsRes.data || [])
        .filter((p: any) => p.project_type !== 'other' && p.project_type !== 'その他')
        .map((p: any) => ({
        id: p.id,
        code: p.code || '',
        name: p.name,
        projectType: p.project_type || 'one-off',
        settlementYearMonth: p.settlement_year_month || undefined,
        createdAt: p.created_at || undefined,
        customerId: p.client_id,
        tasks: (p.project_tasks || [])
          .filter((pt: any) => !pt.is_deleted)
          .map((pt: any) => ({
            id: pt.id,
            code: pt.code || '',
            task: pt.name,
            assigneeIds: (pt.project_task_assignees || [])
              .flatMap((pta: any) => {
                const res = [];
                if (pta.member_id) res.push(`member_${pta.member_id}`);
                if (pta.staff_id) res.push(`staff_${pta.staff_id}`);
                if (pta.client_id) res.push(`outsource_${pta.client_id}`);
                return res;
              }),
            isCanceled: pt.is_canceled || false,
            status: pt.status || 'not_started',
            completedAt: pt.completed_at,
            laborBudget: budgetItems.find((b: any) => b.task_id === pt.id && b.category === 'expense')?.amount || 0
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

  const fetchRecords = useCallback(async (monthStr?: string) => {
    try {
      setLoading(true);
      const targetMonth = monthStr || currentMonth;
      const [year, month] = targetMonth.split('-').map(Number);
      const startDate = `${targetMonth}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

      const workTimeRes = await supabase
        .from('daily_work_records')
        .select('member_id, task_id, work_time, date')
        .lt('date', endDate);
      
      if (workTimeRes.error) throw workTimeRes.error;

      const timeMap: Record<string, number> = {};
      const cumulativeTimeMap: Record<string, number> = {};
      const taskHasWorkMap: Record<string, boolean> = {};

      (workTimeRes.data || []).forEach((r: any) => {
        if (r.task_id && Number(r.work_time) > 0) {
          taskHasWorkMap[r.task_id] = true;
        }
        if (r.member_id) {
          const key = `member_${r.member_id}_${r.task_id}`;
          const t = Number(r.work_time);
          
          cumulativeTimeMap[key] = (cumulativeTimeMap[key] || 0) + t;
          
          if (r.date >= startDate && r.date < endDate) {
             timeMap[key] = (timeMap[key] || 0) + t;
          }
        }
      });
      
      setWorkTimeSummary(timeMap);
      setCumulativeWorkTimeSummary(cumulativeTimeMap);
      setTaskHasWorkSummary(taskHasWorkMap);

    } catch (error) {
      console.error('Error fetching records:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  const displayData = useMemo(() => {
    if (dbProjects.length === 0) return [];
    
    const flatRows: ProgressFlatRecord[] = [];

    for (const project of dbProjects) {
      let projectStatus = 'not_started';
      if (project.tasks.length > 0) {
        let allNotStarted = true;
        let allCompletedOrCanceled = true;
        
        for (const pt of project.tasks) {
          const ptStatus = pt.status || 'not_started';
          
          if (ptStatus !== 'not_started') allNotStarted = false;
          if (ptStatus !== 'completed' && ptStatus !== 'canceled') allCompletedOrCanceled = false;
        }
        
        if (allNotStarted) {
          projectStatus = 'not_started';
        } else if (allCompletedOrCanceled) {
          projectStatus = 'completed';
        } else {
          projectStatus = 'in_progress';
        }
      }
      
      const settlementYearMonth = project.settlementYearMonth;

      for (const t of project.tasks) {
        const membersToProcess = new Set<string>();
        
        for (const assignee of (t.assigneeIds || [])) {
          if (assignee.startsWith('staff_') || assignee.startsWith('outsource_')) {
            membersToProcess.add(assignee);
          }
        }

        for (const member of dbMembers) {
          const isOngoing = project.projectType === 'ongoing';
          const targetWorkTime = isOngoing
            ? (workTimeSummary[`member_${member.id}_${t.id}`] || 0)
            : (cumulativeWorkTimeSummary[`member_${member.id}_${t.id}`] || 0);

          if (targetWorkTime > 0) {
            membersToProcess.add(`member_${member.id}`);
          }
        }

        const hasWorkTime = Boolean(taskHasWorkSummary[t.id]);
        const isTaskCompleted = t.status === 'completed' || t.status === 'canceled';

        let taskCurrentStatus = 'not_started';
        if (isTaskCompleted) {
          taskCurrentStatus = 'completed';
        } else if (hasWorkTime) {
          taskCurrentStatus = 'in_progress';
        } else {
          taskCurrentStatus = 'not_started';
        }

        const taskPrevStatus = t.status || 'not_started';
        
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
          const [type] = prefixedId.split('_');

          const workTime = type === 'member' ? (workTimeSummary[`${prefixedId}_${t.id}`] || 0) : '-';
          const cumulativeWorkTime = type === 'member' ? (cumulativeWorkTimeSummary[`${prefixedId}_${t.id}`] || 0) : '-';

          flatRows.push({
            id: `TASK-${t.id}-${prefixedId}`,
            projectId: project.id,
            projectName: project.name,
            projectCode: project.code || '',
            projectType: project.projectType || 'one-off',
            projectTypeSortKey: project.projectType === 'ongoing' ? '0' : (project.projectType === 'その他' ? '2' : '1'),
            settlementYearMonth,
            createdAt: project.createdAt,
            projectStatus: projectStatus,
            yearMonth: currentMonth,
            taskId: t.id,
            taskName: t.task,
            taskStatus: taskCurrentStatus,
            taskPrevStatus: taskPrevStatus,
            taskCompletedAt: t.completedAt,
            laborBudget: t.laborBudget || 0,
            pastAllocationAmount: 0,
            userId: prefixedId,
            userName: getUserName(prefixedId),
            assigneeType: getAssigneeType(prefixedId),
            userYomigana: getUserIdYomigana(prefixedId),
            workTime,
            cumulativeWorkTime,
            allocationAmount: 0,
            isSaved: true,
            isCanceled: t.isCanceled,
            isTaskCompleted,
            hasWorkTime
          });
        }

        if (!hasAssignees) {
           flatRows.push({
             id: `TASK-${t.id}`,
             projectId: project.id,
             projectName: project.name,
             projectCode: project.code || '',
             projectType: project.projectType || 'one-off',
             projectTypeSortKey: project.projectType === 'ongoing' ? '0' : (project.projectType === 'その他' ? '2' : '1'),
             settlementYearMonth,
             createdAt: project.createdAt,
             projectStatus: projectStatus,
             yearMonth: currentMonth,
             taskId: t.id,
             taskName: t.task,
             taskStatus: taskCurrentStatus,
             taskPrevStatus: taskPrevStatus,
             taskCompletedAt: t.completedAt,
             userId: '',
             userName: '',
             assigneeType: '',
             userYomigana: '',
             workTime: '-',
             cumulativeWorkTime: '-',
             allocationAmount: 0,
             isSaved: true,
             isCanceled: t.isCanceled,
             isTaskCompleted,
             hasWorkTime
           });
        }
      }
    }

    flatRows.sort((a, b) => {
      const pA = dbProjects.find(p => p.id === a.projectId)?.code || '';
      const pB = dbProjects.find(p => p.id === b.projectId)?.code || '';
      if (pA !== pB) return pB.localeCompare(pA);

      const tA = dbProjects.flatMap(p => p.tasks).find(t => t.id === a.taskId)?.code || '';
      const tB = dbProjects.flatMap(p => p.tasks).find(t => t.id === b.taskId)?.code || '';
      if (tA !== tB) return tA.localeCompare(tB);
      
      const getTypePrio = (userId: string) => {
        if (userId.startsWith('staff_')) return 1;
        if (userId.startsWith('member_')) return 2;
        if (userId.startsWith('outsource_')) return 3;
        return 4;
      };

      const aPrio = getTypePrio(a.userId);
      const bPrio = getTypePrio(b.userId);
      if (aPrio !== bPrio) return aPrio - bPrio;

      return a.userYomigana.localeCompare(b.userYomigana, 'ja');
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
  }, [currentMonth, dbMembers, dbStaffs, dbClients, dbProjects, workTimeSummary, cumulativeWorkTimeSummary, taskHasWorkSummary]);

  const batchSaveProgressRecords = async (drafts: ProgressFlatRecord[], deletedIds: string[]) => {
    try {
      setLoading(true);
      
      const projectTaskUpdates: { id: string; status: string; is_canceled: boolean }[] = [];
      const projectSettlementMonthUpdates = new Map<string, string>();

      for (const r of drafts) {
        if (deletedIds.includes(r.id)) continue;

        if (r.projectId && r.isFirstInProject && r.settlementYearMonth !== undefined) {
          projectSettlementMonthUpdates.set(r.projectId, r.settlementYearMonth);
        }

        if (r.taskId && r.isFirstInTask && !deletedIds.includes(`TASK-${r.taskId}`)) {
          const isCompleted = Boolean(r.isTaskCompleted || r.taskStatus === 'completed');
          const newStatus = isCompleted
            ? 'completed'
            : (r.hasWorkTime ? 'in_progress' : 'not_started');

          projectTaskUpdates.push({
            id: r.taskId,
            status: newStatus,
            is_canceled: false
          });
        }
      }

      if (projectTaskUpdates.length > 0) {
        const uniqueProjectTasks = Array.from(new Map(projectTaskUpdates.map(t => [t.id, t])).values());
        const promises = uniqueProjectTasks.map(t => {
          const updateData: any = {
            status: t.status,
            is_canceled: t.is_canceled
          };
          if (t.status === 'completed') {
            updateData.completed_at = new Date().toISOString();
          } else {
            updateData.completed_at = null;
          }
          return supabase.from('project_tasks').update(updateData).eq('id', t.id);
        });

        const results = await Promise.all(promises);
        for (const res of results) {
          if (res.error) throw res.error;
        }
      }

      if (projectSettlementMonthUpdates.size > 0) {
        const pPromises = Array.from(projectSettlementMonthUpdates.entries()).map(([pId, sMonth]) => {
          return supabase.from('projects').update({ settlement_year_month: sMonth || null }).eq('id', pId);
        });
        const pResults = await Promise.all(pPromises);
        for (const res of pResults) {
          if (res.error) throw res.error;
        }
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

