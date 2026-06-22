import { DataPage, type Column } from '../components';
import { useState, useMemo, useEffect } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PERSON, WORDS_ORG_LOCATION } from '../constants';
import { supabase } from '../lib';
import type { MemberItem, ProjectItem, StaffItem, ClientItem } from '../types';
import { useAlert } from '../contexts';
import { getCurrentJSTMonth, getPreviousMonth } from '../utils';

type MonthlyTaskRecord = {
  id: string;
  year_month: string;
  task_id: string;
  current_progress: number;
};

type MonthlyContributionRecord = {
  id: string;
  year_month: string;
  member_id?: string;
  staff_id?: string;
  client_id?: string;
  task_id: string;
  contribution_ratio: number;
};

type FlatRecord = {
  id: string;
  projectId: string;
  projectYomigana: string;
  projectType: string;
  yearMonth: string;
  taskId: string;
  prevProgress: number | string;
  currentProgress: number;
  userId: string;
  userYomigana: string;
  workTime: number | string;
  contributionRatio: number;
  isSaved: boolean;
  isFirstInProject?: boolean;
  isFirstInTask?: boolean;
  isLastInProject?: boolean;
  isLastInTask?: boolean;
};

export function ProgressRecordPage() {
  const [dbMembers, setDbMembers] = useState<MemberItem[]>([]);
  const [dbStaffs, setDbStaffs] = useState<StaffItem[]>([]);
  const [dbClients, setDbClients] = useState<ClientItem[]>([]);
  const [dbProjects, setDbProjects] = useState<ProjectItem[]>([]);
  
  const [currentMonthTaskRecords, setCurrentMonthTaskRecords] = useState<MonthlyTaskRecord[]>([]);
  const [prevMonthTaskRecords, setPrevMonthTaskRecords] = useState<MonthlyTaskRecord[]>([]);
  const [currentMonthMemberRecords, setCurrentMonthMemberRecords] = useState<MonthlyContributionRecord[]>([]);
  const [prevMonthMemberRecords, setPrevMonthMemberRecords] = useState<MonthlyContributionRecord[]>([]);
  
  const [workTimeSummary, setWorkTimeSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();
  const [currentMonth, setCurrentMonth] = useState(() => getCurrentJSTMonth());

  useEffect(() => {
    async function fetchMasters() {
      try {
        setLoading(true);
        const [membersRes, staffsRes, clientsRes, projectsRes] = await Promise.all([
          supabase.from('members').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
          supabase.from('staffs').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
          supabase.from('clients').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
          supabase.from('projects').select(`
            id, name, yomigana, project_type, start_date, end_date,
            project_tasks (
              id, name, is_deleted,
              project_task_assignees ( member_id, staff_id, client_id )
            )
          `).eq('is_deleted', false).order('yomigana', { ascending: true }),
        ]);

        if (membersRes.error) throw membersRes.error;
        if (staffsRes.error) throw staffsRes.error;
        if (clientsRes.error) throw clientsRes.error;
        if (projectsRes.error) throw projectsRes.error;

        setDbMembers(membersRes.data || []);
        setDbStaffs(staffsRes.data || []);
        setDbClients(clientsRes.data || []);
        
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
              assigneeIds: (pt.project_task_assignees || [])
                .flatMap((pta: any) => {
                  const res = [];
                  if (pta.member_id) res.push(`member_${pta.member_id}`);
                  if (pta.staff_id) res.push(`staff_${pta.staff_id}`);
                  if (pta.client_id) res.push(`outsource_${pta.client_id}`);
                  return res;
                })
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

  const fetchRecords = async (monthStr: string) => {
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
      showAlert('進捗記録の取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dbProjects.length > 0) {
      fetchRecords(currentMonth);
    }
  }, [currentMonth, dbProjects]);

  const displayData = useMemo(() => {
    if (dbProjects.length === 0) return [];
    
    const flatRows: FlatRecord[] = [];

    for (const project of dbProjects) {
      const taskIdsInProject = project.tasks.map(t => t.id);
      
      const projectTaskRecords = currentMonthTaskRecords.filter(r => taskIdsInProject.includes(r.task_id));
      const projectMemberRecords = currentMonthMemberRecords.filter(r => taskIdsInProject.includes(r.task_id));
      
      for (const t of project.tasks) {
        const membersToProcess = new Set<string>(t.assigneeIds || []);
        
        // 今月作業時間があるメンバーを追加
        for (const member of dbMembers) {
          if ((workTimeSummary[`member_${member.id}_${t.id}`] || 0) > 0) {
            membersToProcess.add(`member_${member.id}`);
          }
        }

        // 今月の保存済み貢献記録がある担当者を追加
        const taskMemberRecords = projectMemberRecords.filter(r => r.task_id === t.id);
        for (const r of taskMemberRecords) {
          if (r.member_id) membersToProcess.add(`member_${r.member_id}`);
          if (r.staff_id) membersToProcess.add(`staff_${r.staff_id}`);
          if (r.client_id) membersToProcess.add(`outsource_${r.client_id}`);
        }

        const taskRecord = projectTaskRecords.find(r => r.task_id === t.id);
        const prevTaskRecord = prevMonthTaskRecords.find(r => r.task_id === t.id);
        
        const taskCurrentProgress = taskRecord ? Number(taskRecord.current_progress) : 0;
        let taskPrevProgress: string | number = prevTaskRecord ? Number(prevTaskRecord.current_progress) : '-';
        
        if (project.projectType === 'ongoing') {
          taskPrevProgress = 0;
        }
        
        let hasAssignees = false;

        const getUserIdYomigana = (userId: string) => {
          const [type, id] = userId.split('_');
          if (type === 'member') return dbMembers.find(m => m.id === id)?.yomigana || '';
          if (type === 'staff') return dbStaffs.find(s => s.id === id)?.yomigana || '';
          if (type === 'outsource') return dbClients.find(c => c.id === id)?.yomigana || '';
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
            projectYomigana: project.yomigana || '',
            projectType: project.projectType || 'one-off',
            yearMonth: currentMonth,
            taskId: t.id,
            prevProgress: taskPrevProgress,
            currentProgress: taskCurrentProgress,
            userId: prefixedId,
            userYomigana: getUserIdYomigana(prefixedId),
            workTime,
            contributionRatio: savedMemberRecord ? Number(savedMemberRecord.contribution_ratio) : 0,
            isSaved: !!savedMemberRecord
          });
        }

        if (!hasAssignees) {
           // 担当者がいないタスク行
           flatRows.push({
             id: taskRecord ? taskRecord.id : `UNSAVED-TASK-${currentMonth}-${t.id}`,
             projectId: project.id,
             projectYomigana: project.yomigana || '',
             projectType: project.projectType || 'one-off',
             yearMonth: currentMonth,
             taskId: t.id,
             prevProgress: taskPrevProgress,
             currentProgress: taskCurrentProgress,
             userId: '',
             userYomigana: '',
             workTime: '-',
             contributionRatio: 0,
             isSaved: !!taskRecord
           });
        }
      }
    }

    flatRows.sort((a, b) => {
      const pA = dbProjects.find(p => p.id === a.projectId)?.yomigana || '';
      const pB = dbProjects.find(p => p.id === b.projectId)?.yomigana || '';
      if (pA !== pB) return pA.localeCompare(pB);
      const tA = dbProjects.flatMap(p => p.tasks).find(t => t.id === a.taskId)?.task || '';
      const tB = dbProjects.flatMap(p => p.tasks).find(t => t.id === b.taskId)?.task || '';
      if (tA !== tB) return tA.localeCompare(tB);
      
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

  const columns: Column<any>[] = [
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      sortKey: 'projectYomigana',
      editable: false, 
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...dbProjects.map(p => ({ label: p.name, value: p.id }))],
      render: (item: any) => {
        if (!item.isFirstInProject) return '';
        const project = dbProjects.find(p => p.id === item.projectId);
        if (!project) return '';
        if (project.projectType === 'ongoing') {
          const [year, month] = currentMonth.split('-');
          return `${project.name}（${year}年${month}月分）`;
        }
        return project.name;
      },
      style: (item: any) => ({
        borderBottom: item.isLastInProject ? undefined : 'none'
      })
    },
    {
      key: 'projectType',
      header: TABLE_COLUMNS.PROJECT_TYPE,
      sortable: false,
      render: (item: any) => {
        if (!item.isFirstInProject) return '';
        const project = dbProjects.find(p => p.id === item.projectId);
        if (!project) return '';
        return project.projectType === 'ongoing' ? '継続' : '単発';
      },
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
      options: (_item: any) => {
        const taskOptions = dbProjects.flatMap(p => p.tasks).map(t => ({ label: t.task, value: t.id }));
        return [{ label: '選択してください', value: '' }, ...taskOptions];
      },
      render: (item: any) => {
        if (!item.isFirstInTask) return '';
        const task = dbProjects.flatMap(p => p.tasks).find(t => t.id === item.taskId);
        return task?.task || '';
      },
      style: (item: any) => ({
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    { 
      key: 'prevProgress', 
      header: TABLE_COLUMNS.PREV_MONTH_PROGRESS, 
      sortable: false,
      editable: false,
      render: (item: any) => item.isFirstInTask && item.taskId ? item.prevProgress : '',
      style: (item: any) => ({
        width: '120px', 
        textAlign: 'right',
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    { 
      key: 'currentProgress', 
      header: TABLE_COLUMNS.CURRENT_MONTH_PROGRESS, 
      sortable: false,
      editable: (item: any) => item.isFirstInTask,
      inputType: 'number',
      render: (item: any) => item.isFirstInTask ? item.currentProgress : '',
      style: (item: any) => ({
        width: '120px',
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    { 
      key: 'assigneeType', 
      header: TABLE_COLUMNS.ASSIGNEE_TYPE, 
      sortable: false,
      editable: false, 
      render: (item: any) => {
        if (!item.userId) return '';
        const [type] = item.userId.split('_');
        if (type === 'member') return WORDS_PERSON.ROLE_MEMBER;
        if (type === 'staff') return WORDS_PERSON.ROLE_STAFF;
        if (type === 'outsource') return WORDS_ORG_LOCATION.OUTSOURCE;
        return '';
      }
    },
    { 
      key: 'userId', 
      header: TABLE_COLUMNS.ASSIGNEE, 
      sortKey: 'userYomigana',
      sortable: false,
      editable: false, 
      inputType: 'select',
      options: [
        { label: '選択してください', value: '' },
        ...dbMembers.map(u => ({ label: u.name, value: `member_${u.id}` })),
        ...dbStaffs.map(s => ({ label: s.name, value: `staff_${s.id}` })),
        ...dbClients.map(c => ({ label: c.name, value: `outsource_${c.id}` }))
      ],
      render: (item: any) => {
        if (!item.userId) return '';
        const [type, id] = item.userId.split('_');
        if (type === 'member') return dbMembers.find(u => u.id === id)?.name || '';
        if (type === 'staff') return dbStaffs.find(s => s.id === id)?.name || '';
        if (type === 'outsource') return dbClients.find(c => c.id === id)?.name || '';
        return '';
      }
    },
    { 
      key: 'workTime', 
      header: TABLE_COLUMNS.CURRENT_MONTH_WORK_TIME, 
      sortable: false,
      editable: false,
      style: { width: '120px', textAlign: 'right' }
    },
    { 
      key: 'contributionRatio', 
      header: TABLE_COLUMNS.CONTRIBUTION_RATIO, 
      sortable: false,
      editable: true,
      inputType: 'number',
      style: { width: '120px' }
    },
  ];

  const handleBatchSave = async (drafts: FlatRecord[], deletedIds: string[]) => {
    try {
      setLoading(true);
      
      const taskUpserts: any[] = [];
      const taskDeletes: string[] = [];
      const memberUpserts: any[] = [];
      const memberDeletes: string[] = [];

      for (const r of drafts) {
        if (deletedIds.includes(r.id)) continue;

        if (r.taskId && r.isFirstInTask && !deletedIds.includes(`TASK-${r.taskId}`)) { // taskIdベースで重複排除など考慮
          taskUpserts.push({
            year_month: currentMonth,
            task_id: r.taskId,
            current_progress: r.currentProgress || 0
          });
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
            contribution_ratio: Number(r.contributionRatio) || 0
          });
        }
      }

      // taskUpsertsの重複を排除
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

      const results = await Promise.all(promises);
      for (const res of results) {
        if (res.error) throw res.error;
      }

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
      await fetchRecords(currentMonth);
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
      title={PAGE_NAMES.PROGRESS_RECORD}
      data={displayData}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_PROGRESS_RECORD}
      onBatchSave={handleBatchSave}
      showMonthFilter={true}
      singleMonth={currentMonth}
      onSingleMonthChange={setCurrentMonth}
      hideDeleteColumn={true}
      highlightInputColumns={true}
    />
  );
}
