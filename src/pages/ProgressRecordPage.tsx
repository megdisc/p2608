import { DataPage, Button, type Column } from '../components';
import { useState, useMemo, useEffect } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
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

type DisplayAssigneeRow = {
  id: string;
  userId: string;
  workTime: number | string;
  contributionRatio: number;
  isSaved: boolean;
};

type DisplayTaskRow = {
  id: string;
  taskId: string;
  prevProgress: string | number;
  currentProgress: number;
  isSaved: boolean;
  assignees: DisplayAssigneeRow[];
};

type DisplayProjectRow = {
  id: string;
  projectId: string;
  yearMonth: string;
  tasks: DisplayTaskRow[];
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
          supabase.from('members').select('*').eq('is_deleted', false),
          supabase.from('staffs').select('*').eq('is_deleted', false),
          supabase.from('clients').select('*').eq('is_deleted', false),
          supabase.from('projects').select(`
            id, name, start_date, end_date,
            project_tasks (
              id, name, is_deleted,
              project_task_assignees ( member_id, staff_id, client_id )
            )
          `).eq('is_deleted', false)
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
    
    const rows: DisplayProjectRow[] = [];

    for (const project of dbProjects) {
      const taskIdsInProject = project.tasks.map(t => t.id);
      
      const projectTaskRecords = currentMonthTaskRecords.filter(r => taskIdsInProject.includes(r.task_id));
      const projectMemberRecords = currentMonthMemberRecords.filter(r => taskIdsInProject.includes(r.task_id));
      
      const tasks: DisplayTaskRow[] = [];

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

        const assignees: DisplayAssigneeRow[] = [];
        
        const taskRecord = projectTaskRecords.find(r => r.task_id === t.id);
        const prevTaskRecord = prevMonthTaskRecords.find(r => r.task_id === t.id);
        
        const taskCurrentProgress = taskRecord ? Number(taskRecord.current_progress) : 0;
        const taskPrevProgress = prevTaskRecord ? Number(prevTaskRecord.current_progress) : '-';

        for (const prefixedId of membersToProcess) {
          const [type, id] = prefixedId.split('_');
          let savedMemberRecord;
          if (type === 'member') savedMemberRecord = taskMemberRecords.find(r => r.member_id === id);
          else if (type === 'staff') savedMemberRecord = taskMemberRecords.find(r => r.staff_id === id);
          else if (type === 'outsource') savedMemberRecord = taskMemberRecords.find(r => r.client_id === id);

          const workTime = type === 'member' ? (workTimeSummary[`${prefixedId}_${t.id}`] || 0) : '-';

          if (savedMemberRecord) {
            assignees.push({
              id: savedMemberRecord.id,
              userId: prefixedId,
              workTime,
              contributionRatio: Number(savedMemberRecord.contribution_ratio),
              isSaved: true
            });
          } else {
            assignees.push({
              id: `${PAGE_NAMES.PROGRESS_RECORD}（${currentMonth}）-${prefixedId}-${t.id}`,
              userId: prefixedId,
              workTime,
              contributionRatio: 0,
              isSaved: false
            });
          }
        }

        if (assignees.length > 0 || project.tasks.includes(t)) {
          tasks.push({
            id: taskRecord ? taskRecord.id : `UNSAVED-TASK-${currentMonth}-${t.id}`,
            taskId: t.id,
            prevProgress: taskPrevProgress,
            currentProgress: taskCurrentProgress,
            isSaved: !!taskRecord,
            assignees
          });
        }
      }

      rows.push({
        id: project.id,
        projectId: project.id,
        yearMonth: currentMonth,
        tasks
      });
    }

    return rows;
  }, [currentMonth, dbMembers, dbStaffs, dbClients, dbProjects, currentMonthTaskRecords, prevMonthTaskRecords, currentMonthMemberRecords, prevMonthMemberRecords, workTimeSummary]);

  const columns: Column<any>[] = [
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      editable: false, 
      inputType: 'select',
      options: [{ label: '選択してください', value: '' }, ...dbProjects.map(p => ({ label: p.name, value: p.id }))],
      render: (item: any) => dbProjects.find(p => p.id === item.projectId)?.name || '',
      rowType: 'main'
    },
    { 
      key: 'taskId', 
      header: TABLE_COLUMNS.TASK, 
      editable: true, 
      inputType: 'select',
      options: (_item: any) => {
        const taskOptions = dbProjects.flatMap(p => p.tasks).map(t => ({ label: t.task, value: t.id }));
        return [{ label: '選択してください', value: '' }, ...taskOptions];
      },
      render: (item: any) => {
        const task = dbProjects.flatMap(p => p.tasks).find(t => t.id === item.taskId);
        return task?.task || '';
      },
      rowType: 'sub',
      mainRender: (_item: any, addSubRow?: () => void) => (
        <Button 
          onClick={addSubRow}
          style={{ padding: '4px 8px', fontSize: 'var(--text-caption)' }}
        >
          ＋ タスク追加
        </Button>
      ),
    },
    { 
      key: 'prevProgress', 
      header: TABLE_COLUMNS.PREV_MONTH_PROGRESS, 
      editable: false,
      rowType: 'sub',
      style: { width: '120px', textAlign: 'right' }
    },
    { 
      key: 'currentProgress', 
      header: TABLE_COLUMNS.CURRENT_MONTH_PROGRESS, 
      editable: true,
      inputType: 'number',
      rowType: 'sub',
      style: { width: '120px' }
    },
    { 
      key: 'userId', 
      header: TABLE_COLUMNS.USER_NAME, 
      editable: true, 
      inputType: 'select',
      options: [
        { label: '選択してください', value: '' },
        ...dbMembers.map(u => ({ label: `${u.name} (利用者)`, value: `member_${u.id}` })),
        ...dbStaffs.map(s => ({ label: `${s.name} (職員)`, value: `staff_${s.id}` })),
        ...dbClients.map(c => ({ label: `${c.name} (外注先)`, value: `outsource_${c.id}` }))
      ],
      render: (item: any) => {
        if (!item.userId) return '';
        const [type, id] = item.userId.split('_');
        if (type === 'member') return `${dbMembers.find(u => u.id === id)?.name || ''} (利用者)`;
        if (type === 'staff') return `${dbStaffs.find(s => s.id === id)?.name || ''} (職員)`;
        if (type === 'outsource') return `${dbClients.find(c => c.id === id)?.name || ''} (外注先)`;
        return '';
      },
      rowType: 'sub-sub',
      mainRender: (_item: any, addSubSubRow?: () => void) => (
        <Button 
          onClick={addSubSubRow}
          style={{ padding: '4px 8px', fontSize: 'var(--text-caption)' }}
        >
          ＋ 担当者追加
        </Button>
      ),
    },
    { 
      key: 'workTime', 
      header: TABLE_COLUMNS.CURRENT_MONTH_WORK_TIME, 
      editable: false,
      rowType: 'sub-sub',
      style: { width: '120px', textAlign: 'right' }
    },
    { 
      key: 'contributionRatio', 
      header: TABLE_COLUMNS.CONTRIBUTION_RATIO, 
      editable: true,
      inputType: 'number',
      rowType: 'sub-sub',
      style: { width: '120px' }
    },
  ];

  const handleBatchSave = async (drafts: DisplayProjectRow[], deletedIds: string[]) => {
    try {
      setLoading(true);
      
      const taskUpserts: any[] = [];
      const taskDeletes: string[] = [];
      const memberUpserts: any[] = [];
      const memberDeletes: string[] = [];

      for (const projectRow of drafts) {
        if (deletedIds.includes(projectRow.id)) continue;

        for (const t of projectRow.tasks) {
          if (deletedIds.includes(t.id)) {
            if (t.isSaved) taskDeletes.push(t.id);
            for (const r of t.assignees) {
              if (r.isSaved) memberDeletes.push(r.id);
            }
            continue;
          }

          if (t.taskId) {
            taskUpserts.push({
              ...(t.isSaved && !t.id.startsWith('TEMP') && !t.id.startsWith('UNSAVED') ? { id: t.id } : {}),
              year_month: currentMonth,
              task_id: t.taskId,
              current_progress: t.currentProgress || 0
            });
          }

          for (const r of t.assignees) {
            if (deletedIds.includes(r.id)) {
              if (r.isSaved) memberDeletes.push(r.id);
              continue;
            }

            if (t.taskId && r.userId) {
              const [type, id] = r.userId.split('_');
              memberUpserts.push({
                ...(r.isSaved && !r.id.startsWith('TEMP') && !r.id.startsWith('UNSAVED') ? { id: r.id } : {}),
                year_month: currentMonth,
                member_id: type === 'member' ? id : null,
                staff_id: type === 'staff' ? id : null,
                client_id: type === 'outsource' ? id : null,
                task_id: t.taskId,
                contribution_ratio: Number(r.contributionRatio) || 0
              });
            }
          }
        }
      }

      const promises = [];

      if (taskDeletes.length > 0) {
        promises.push(supabase.from('monthly_task_progress').delete().in('id', taskDeletes));
      }
      if (memberDeletes.length > 0) {
        promises.push(supabase.from('monthly_member_contributions').delete().in('id', memberDeletes));
      }
      
      if (taskUpserts.length > 0) {
        promises.push(supabase.from('monthly_task_progress').upsert(taskUpserts, { onConflict: 'year_month,task_id' }));
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

  const handleAddRow = () => {
    return {
      id: `TEMP-MAIN-${Date.now()}`,
      projectId: '',
      yearMonth: currentMonth,
      tasks: []
    };
  };

  const handleAddSubRow = (_parentId: string) => {
    return {
      id: `TEMP-TASK-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      taskId: '',
      prevProgress: '-',
      currentProgress: 0,
      isSaved: false,
      assignees: []
    };
  };

  const handleAddSubSubRow = (_parentId: string, _subParentId: string) => {
    return {
      id: `TEMP-ASSIGNEE-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      userId: '',
      workTime: '-',
      contributionRatio: 0,
      isSaved: false
    };
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
      subItemsKey="tasks"
      onAddRow={handleAddRow}
      onAddSubRow={handleAddSubRow}
      subSubItemsKey="assignees"
      onAddSubSubRow={handleAddSubSubRow}
      disableAddButton={true}
    />
  );
}
