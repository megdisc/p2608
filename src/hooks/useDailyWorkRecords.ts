import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib';
import type { MemberItem, ProjectItem } from '../types';
import { getCurrentJSTDateOnly } from '../utils';

export type DailyRecord = {
  id: string;
  date: string;
  member_id: string;
  task_id: string;
  work_time: number;
};

export type DailyFlatRecord = {
  id: string;
  userId: string;
  userName: string;
  userYomigana: string;
  date: string;
  projectId: string;
  projectYomigana: string;
  projectType: string;
  taskId: string;
  workTime: number;
  isSaved: boolean;
  isEmptyRow?: boolean;
  isFirstInUser?: boolean;
  isFirstInProject?: boolean;
  isLastInUser?: boolean;
  isLastInProject?: boolean;
};

export function useDailyWorkRecords() {
  const [dbMembers, setDbMembers] = useState<MemberItem[]>([]);
  const [dbProjects, setDbProjects] = useState<ProjectItem[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => getCurrentJSTDateOnly());

  const fetchMasters = useCallback(async () => {
    try {
      setLoading(true);
      const [membersRes, projectsRes] = await Promise.all([
        supabase.from('members').select('*').order('yomigana', { ascending: true }),
        supabase.from('projects').select(`
          id, code, name, project_type, is_deleted,
          project_tasks (
            id, code, name, is_deleted,
            project_task_assignees ( member_id )
          )
        `).order('code', { ascending: true }),
      ]);

      if (membersRes.error) throw membersRes.error;
      if (projectsRes.error) throw projectsRes.error;

      const membersData = (membersRes.data || []).map((m: any) => ({
        ...m,
        name: m.is_deleted ? `${m.name} (削除済)` : m.name
      }));

      setDbMembers(membersData);
      
      const formattedProjects = (projectsRes.data || []).map((p: any) => ({
        id: p.id,
        code: p.code || '',
        name: p.is_deleted ? `${p.name} (削除済)` : p.name,
        is_deleted: p.is_deleted,
        projectType: p.project_type || 'one-off',
        tasks: (p.project_tasks || [])
          .map((pt: any) => ({
            id: pt.id,
            code: pt.code || '',
            task: pt.is_deleted ? `${pt.name} (削除済)` : pt.name,
            is_deleted: pt.is_deleted,
            assigneeIds: (pt.project_task_assignees || [])
              .map((pta: any) => pta.member_id)
              .filter(Boolean)
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

  const fetchRecords = useCallback(async (date: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_work_records')
        .select('*')
        .eq('date', date);
      
      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const [confirmedDates, setConfirmedDates] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('daily_work_confirmations');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      '2026-06-15', '2026-06-16', '2026-06-17', '2026-06-29', '2026-06-30',
      '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05',
      '2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10',
      '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15',
      '2026-08-16'
    ];
  });

  const displayData = useMemo(() => {
    if (dbMembers.length === 0) return [];
    
    const isConfirmed = confirmedDates.includes(currentDate);
    const activeProjects = dbProjects;
    const flatRows: DailyFlatRecord[] = [];

    const OTHER_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
    const OTHER_TASK_ID = '00000000-0000-0000-0000-000000000002';

    for (const member of dbMembers) {
      const userRecords = records.filter(r => r.member_id === member.id);
      if (member.is_deleted && userRecords.length === 0) continue;
      const taskMap = new Map<string, DailyFlatRecord>();

      // 1. 作業記録テーブル（daily_work_records）に記録されているデータ
      for (const r of userRecords) {
        if (r.task_id === OTHER_TASK_ID) {
          taskMap.set(r.task_id, {
            id: r.id,
            userId: member.id,
            userName: member.name,
            userYomigana: member.yomigana || '',
            date: currentDate,
            projectId: OTHER_PROJECT_ID,
            projectYomigana: 'んんん',
            projectType: 'その他',
            taskId: r.task_id,
            workTime: Number(r.work_time),
            isSaved: true
          });
        } else {
          let projectId = '';
          for (const p of dbProjects) {
            if (p.tasks.some(t => t.id === r.task_id)) {
              projectId = p.id;
              break;
            }
          }
          const targetProject = dbProjects.find(p => p.id === projectId);
          taskMap.set(r.task_id, {
            id: r.id,
            userId: member.id,
            userName: member.name,
            userYomigana: member.yomigana || '',
            date: currentDate,
            projectId,
            projectYomigana: targetProject?.yomigana || '',
            projectType: targetProject?.projectType || 'one-off',
            taskId: r.task_id,
            workTime: Number(r.work_time),
            isSaved: true
          });
        }
      }

      // 2. 案件タスク担当者テーブルで各利用者毎に割り当てられているタスク（未確定の日のみ表示）
      if (!isConfirmed) {
        for (const p of activeProjects) {
          if (p.is_deleted) continue;
          for (const t of p.tasks) {
            if (t.is_deleted) continue;
            if (t.assigneeIds?.includes(member.id) && !taskMap.has(t.id)) {
              taskMap.set(t.id, {
                id: `UNSAVED-${currentDate}-${member.id}-${t.id}`,
                userId: member.id,
                userName: member.name,
                userYomigana: member.yomigana || '',
                date: currentDate,
                projectId: p.id,
                projectYomigana: p.yomigana || '',
                projectType: p.projectType || 'one-off',
                taskId: t.id,
                workTime: 0,
                isSaved: false
              });
            }
          }
        }

        // 3. その他（未確定の日のみ追加）
        if (!taskMap.has(OTHER_TASK_ID)) {
          taskMap.set(OTHER_TASK_ID, {
            id: `UNSAVED-${currentDate}-${member.id}-${OTHER_TASK_ID}`,
            userId: member.id,
            userName: member.name,
            userYomigana: member.yomigana || '',
            date: currentDate,
            projectId: OTHER_PROJECT_ID,
            projectYomigana: 'んんん',
            projectType: 'その他',
            taskId: OTHER_TASK_ID,
            workTime: 0,
            isSaved: false
          });
        }
      } else {
        // 確定済の日：記録データが1つも無い利用者は、氏名以外のセルは「-」と表示
        if (taskMap.size === 0) {
          taskMap.set('EMPTY_RECORD', {
            id: `EMPTY-${currentDate}-${member.id}`,
            userId: member.id,
            userName: member.name,
            userYomigana: member.yomigana || '',
            date: currentDate,
            projectId: '',
            projectYomigana: '',
            projectType: '',
            taskId: '',
            workTime: 0,
            isSaved: false,
            isEmptyRow: true
          });
        }
      }

      flatRows.push(...Array.from(taskMap.values()));
    }

    flatRows.sort((a, b) => {
      const mA = dbMembers.find(m => m.id === a.userId)?.yomigana || '';
      const mB = dbMembers.find(m => m.id === b.userId)?.yomigana || '';
      if (mA !== mB) return mA.localeCompare(mB);

      const getPTypeOrder = (p: string) => p === 'ongoing' ? 0 : p === 'その他' ? 2 : 1;
      const pOrderA = getPTypeOrder(a.projectType);
      const pOrderB = getPTypeOrder(b.projectType);
      if (pOrderA !== pOrderB) return pOrderA - pOrderB;

      const pA = dbProjects.find(p => p.id === a.projectId)?.code || '';
      const pB = dbProjects.find(p => p.id === b.projectId)?.code || '';
      if (pA !== pB) return pA.localeCompare(pB);

      const tA = dbProjects.flatMap(p => p.tasks).find(t => t.id === a.taskId)?.code || '';
      const tB = dbProjects.flatMap(p => p.tasks).find(t => t.id === b.taskId)?.code || '';
      return tA.localeCompare(tB);
    });

    let prevUserId = '';
    let prevProjectId = '';

    const finalRows = flatRows.map((r, i) => {
      const isFirstInUser = r.userId !== prevUserId;
      const isFirstInProject = isFirstInUser || r.projectId !== prevProjectId;

      let isLastInUser = true;
      let isLastInProject = true;

      if (i < flatRows.length - 1) {
        const next = flatRows[i + 1];
        if (next.userId === r.userId) {
          isLastInUser = false;
          if (next.projectId === r.projectId) {
            isLastInProject = false;
          }
        }
      }

      prevUserId = r.userId;
      prevProjectId = r.projectId;

      return { ...r, isFirstInUser, isFirstInProject, isLastInUser, isLastInProject };
    });

    return finalRows;
  }, [currentDate, dbMembers, dbProjects, records, confirmedDates]);

  const batchSaveDailyWorkRecords = async (drafts: DailyFlatRecord[], deletedIds: string[]) => {
    try {
      setLoading(true);
      
      const upserts: any[] = [];
      const deletes: string[] = [];

      for (const r of drafts) {
        if (deletedIds.includes(r.id)) {
          if (r.isSaved) deletes.push(r.id);
          continue;
        }

        if (r.projectId && r.taskId && r.workTime > 0) {
          upserts.push({
            ...(r.isSaved ? { id: r.id } : {}),
            date: currentDate,
            member_id: r.userId,
            task_id: r.taskId,
            work_time: r.workTime
          });
        } else if (r.isSaved && r.workTime === 0) {
           deletes.push(r.id);
        }
      }

      if (deletes.length > 0) {
        if (confirmedDates.includes(currentDate)) {
          throw new Error('確定済みの日の作業記録は削除できません。');
        }
        const { error } = await supabase.from('daily_work_records').delete().in('id', deletes);
        if (error) throw error;
      }
      
      if (upserts.length > 0) {
        const { error } = await supabase.from('daily_work_records').upsert(upserts, { onConflict: 'date,member_id,task_id' });
        if (error) throw error;
      }

      await fetchRecords(currentDate);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };


  const fetchConfirmations = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('daily_work_records').select('date').eq('is_confirmed', true);
      if (!error && data && data.length > 0) {
        const dbDates = data.map(d => d.date);
        setConfirmedDates(prev => {
          const merged = Array.from(new Set([...prev, ...dbDates]));
          localStorage.setItem('daily_work_confirmations', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      console.error('Error fetching daily work confirmations:', err);
    }
  }, []);

  const confirmDate = useCallback(async (date: string) => {
    try {
      setConfirmedDates(prev => {
        if (prev.includes(date)) return prev;
        const next = [...prev, date];
        localStorage.setItem('daily_work_confirmations', JSON.stringify(next));
        return next;
      });
      await supabase.from('daily_work_records').update({ is_confirmed: true }).eq('date', date);
    } catch (err) {
      console.error('Error confirming date:', err);
    }
  }, []);

  const unconfirmDate = useCallback(async (date: string) => {
    try {
      setConfirmedDates(prev => {
        const next = prev.filter(d => d !== date);
        localStorage.setItem('daily_work_confirmations', JSON.stringify(next));
        return next;
      });
      await supabase.from('daily_work_records').update({ is_confirmed: false }).eq('date', date);
    } catch (err) {
      console.error('Error unconfirming date:', err);
    }
  }, []);

  return {
    dbMembers,
    dbProjects,
    records,
    loading,
    currentDate,
    setCurrentDate,
    displayData,
    confirmedDates,
    confirmDate,
    unconfirmDate,
    fetchConfirmations,
    fetchMasters,
    fetchRecords,
    batchSaveDailyWorkRecords
  };
}
