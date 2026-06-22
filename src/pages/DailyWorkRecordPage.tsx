import { DataPage, type Column } from '../components';
import { useState, useMemo, useEffect } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { supabase } from '../lib';
import type { MemberItem, ProjectItem } from '../types';
import { useAlert } from '../contexts';
import { getCurrentJSTDateOnly } from '../utils';

type DailyRecord = {
  id: string;
  date: string;
  member_id: string;
  task_id: string;
  work_time: number;
};

type FlatRecord = {
  id: string;
  userId: string;
  userName: string;
  date: string;
  projectId: string;
  taskId: string;
  workTime: number;
  isSaved: boolean;
  isFirstInUser?: boolean;
  isFirstInProject?: boolean;
  isLastInUser?: boolean;
  isLastInProject?: boolean;
};

export function DailyWorkRecordPage() {
  const [dbMembers, setDbMembers] = useState<MemberItem[]>([]);
  const [dbProjects, setDbProjects] = useState<ProjectItem[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();
  const [currentDate, setCurrentDate] = useState(() => getCurrentJSTDateOnly());

  // マスターデータ取得
  useEffect(() => {
    async function fetchMasters() {
      try {
        setLoading(true);
        const [membersRes, projectsRes] = await Promise.all([
          supabase.from('members').select('*').eq('is_deleted', false),
          supabase.from('projects').select(`
            id, name, start_date, end_date,
            project_tasks (
              id, name, is_deleted,
              project_task_assignees ( member_id )
            )
          `).eq('is_deleted', false)
        ]);

        if (membersRes.error) throw membersRes.error;
        if (projectsRes.error) throw projectsRes.error;

        setDbMembers(membersRes.data || []);
        
        const formattedProjects = (projectsRes.data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          startDate: p.start_date,
          endDate: p.end_date,
          tasks: (p.project_tasks || [])
            .filter((pt: any) => !pt.is_deleted)
            .map((pt: any) => ({
              id: pt.id,
              task: pt.name,
              assigneeIds: (pt.project_task_assignees || [])
                .map((pta: any) => pta.member_id)
                .filter(Boolean)
            }))
        }));
        setDbProjects(formattedProjects as ProjectItem[]);

      } catch (error) {
        console.error('Error fetching masters:', error);
        showAlert('データ取得に失敗しました', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchMasters();
  }, []);

  // 選択された日付の実績データ取得
  const fetchRecords = async (date: string) => {
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
      showAlert('作業記録の取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dbMembers.length > 0) {
      fetchRecords(currentDate);
    }
  }, [currentDate, dbMembers]);

  // 表示用データの生成（実績＋未入力の割り当てタスク）
  const displayData = useMemo(() => {
    if (dbMembers.length === 0) return [];
    
    const activeProjects = dbProjects.filter(p => p.startDate <= currentDate && currentDate <= p.endDate);
    const flatRows: FlatRecord[] = [];

    for (const member of dbMembers) {
      const userRecords = records.filter(r => r.member_id === member.id);
      const taskMap = new Map<string, FlatRecord>();

      // 1. 保存済みの実績をセット
      for (const r of userRecords) {
        let projectId = '';
        for (const p of dbProjects) {
          if (p.tasks.some(t => t.id === r.task_id)) {
            projectId = p.id;
            break;
          }
        }
        
        taskMap.set(r.task_id, {
          id: r.id,
          userId: member.id,
          userName: member.name,
          date: currentDate,
          projectId,
          taskId: r.task_id,
          workTime: Number(r.work_time),
          isSaved: true
        });
      }

      // 2. 現在の割り当てタスクをセット（保存されていないもののみ）
      for (const p of activeProjects) {
        for (const t of p.tasks) {
          if (t.assigneeIds?.includes(member.id) && !taskMap.has(t.id)) {
            taskMap.set(t.id, {
              id: `UNSAVED-${currentDate}-${member.id}-${t.id}`,
              userId: member.id,
              userName: member.name,
              date: currentDate,
              projectId: p.id,
              taskId: t.id,
              workTime: 0,
              isSaved: false
            });
          }
        }
      }

      flatRows.push(...Array.from(taskMap.values()));
    }

    flatRows.sort((a, b) => {
      if (a.userName !== b.userName) return a.userName.localeCompare(b.userName);
      const pA = dbProjects.find(p => p.id === a.projectId)?.name || '';
      const pB = dbProjects.find(p => p.id === b.projectId)?.name || '';
      if (pA !== pB) return pA.localeCompare(pB);
      const tA = dbProjects.flatMap(p => p.tasks).find(t => t.id === a.taskId)?.task || '';
      const tB = dbProjects.flatMap(p => p.tasks).find(t => t.id === b.taskId)?.task || '';
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
        if (next.userId === r.userId) isLastInUser = false;
        if (next.projectId === r.projectId) isLastInProject = false;
      }

      prevUserId = r.userId;
      prevProjectId = r.projectId;

      return { ...r, isFirstInUser, isFirstInProject, isLastInUser, isLastInProject };
    });

    return finalRows;
  }, [currentDate, dbMembers, dbProjects, records]);

  const columns: Column<any>[] = [
    { 
      key: 'userId', 
      header: TABLE_COLUMNS.NAME, 
      editable: false, 
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...dbMembers.map(u => ({ label: u.name, value: u.id }))],
      render: (item: any) => item.isFirstInUser ? (dbMembers.find(u => u.id === item.userId)?.name || '') : '',
      style: (item: any) => ({
        borderBottom: item.isLastInUser ? undefined : 'none'
      })
    },
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      sortable: false,
      editable: false, 
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...dbProjects.map(p => ({ label: p.name, value: p.id }))],
      render: (item: any) => item.isFirstInProject ? (dbProjects.find(p => p.id === item.projectId)?.name || '') : '',
      style: (item: any) => ({
        borderBottom: item.isLastInProject ? undefined : 'none'
      })
    },
    { 
      key: 'taskId', 
      header: TABLE_COLUMNS.TASK, 
      sortable: false,
      editable: false, 
      inputType: 'select',
      options: (item: any) => {
        const project = dbProjects.find(p => p.id === item.projectId);
        const taskOptions = project ? project.tasks.map(t => ({ label: t.task, value: t.id })) : [];
        return [{ label: '選択してください', value: '' }, ...taskOptions];
      },
      render: (item: any) => {
        const project = dbProjects.find(p => p.id === item.projectId);
        const task = project?.tasks.find(t => t.id === item.taskId);
        return task?.task || '';
      }
    },
    { 
      key: 'workTime', 
      header: TABLE_COLUMNS.WORK_TIME, 
      sortable: false,
      editable: true,
      inputType: 'number',
      style: { width: '120px' }
    },
  ];

  const handleBatchSave = async (drafts: FlatRecord[], deletedIds: string[]) => {
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
           // 0時間に更新された場合は削除する（作業していないのと同じ）
           deletes.push(r.id);
        }
      }

      if (deletes.length > 0) {
        const { error } = await supabase.from('daily_work_records').delete().in('id', deletes);
        if (error) throw error;
      }
      
      if (upserts.length > 0) {
        const { error } = await supabase.from('daily_work_records').upsert(upserts, { onConflict: 'date,member_id,task_id' });
        if (error) throw error;
      }

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
      await fetchRecords(currentDate);
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
      title={PAGE_NAMES.DAILY_WORK_RECORD}
      data={displayData}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_DAILY_WORK_RECORD}
      onBatchSave={handleBatchSave}
      showSingleDateFilter={true}
      singleDate={currentDate}
      onSingleDateChange={setCurrentDate}
      hideDeleteColumn={true}
      highlightInputColumns={true}
    />
  );
}
