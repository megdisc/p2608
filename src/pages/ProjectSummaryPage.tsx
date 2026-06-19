import { useState, useEffect, useMemo } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import { TABLE_COLUMNS, PAGE_NAMES } from '../constants';
import { supabase } from '../lib/supabase';
import { getCurrentISOString, formatJST } from '../utils/date';

type SummaryRow = {
  id: string;
  projectName: string;
  taskName: string;
  progressRate: number;
  assigneeType: string;
  assigneeName: string;
  isFirstInProject: boolean;
  isFirstInTask: boolean;
  isLastInProject: boolean;
  isLastInTask: boolean;
};

export function ProjectSummaryPage() {
  const [data, setData] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetDate] = useState(() => getCurrentISOString());

  useEffect(() => {
    async function fetchData() {
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
            id, name,
            project_tasks (
              id, name, is_deleted, assignee_type,
              project_task_assignees (
                id, member_id, client_id, staff_id
              )
            )
          `).eq('is_deleted', false),
          supabase.from('members').select('id, name').eq('is_deleted', false),
          supabase.from('clients').select('id, name').eq('is_deleted', false),
          supabase.from('staffs').select('id, name').eq('is_deleted', false),
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

        // Map作成
        const memberMap = new Map(members.map(m => [m.id, m.name]));
        const clientMap = new Map(clients.map(c => [c.id, c.name]));
        const staffMap = new Map(staffs.map(s => [s.id, s.name]));

        // task_id ごとに最新の進捗率を取得
        const latestProgressMap = new Map<string, number>();
        const sortedRecords = [...records].sort((a, b) => a.year_month.localeCompare(b.year_month));
        for (const r of sortedRecords) {
          latestProgressMap.set(r.task_id, Number(r.current_progress));
        }

        // プロジェクト名、タスク名でソートするために一時配列を作成
        const tempRows: any[] = [];

        for (const p of projects) {
          const projectTasks = (p.project_tasks || []).filter((t: any) => !t.is_deleted);
          
          if (projectTasks.length === 0) {
            tempRows.push({
              projectId: p.id,
              projectName: p.name,
              taskId: 'no_task',
              taskName: '',
              progressRate: 0,
              assigneeType: '',
              assigneeId: 'no_assignee',
              assigneeName: ''
            });
            continue;
          }

          for (const t of projectTasks) {
            const assignees = t.project_task_assignees || [];
            const progressRate = latestProgressMap.get(t.id) || 0;
            
            let aType = t.assignee_type;
            if (aType === 'inhouse') {
              if (assignees.some((a: any) => a.staff_id)) aType = 'staff';
              else aType = 'member';
            }
            const displayAssigneeType = 
              aType === 'member' ? '利用者' : 
              aType === 'staff' ? '職員' : 
              aType === 'outsource' ? '外注' : '';
            
            if (assignees.length === 0) {
              tempRows.push({
                projectId: p.id,
                projectName: p.name,
                taskId: t.id,
                taskName: t.name,
                progressRate,
                assigneeType: displayAssigneeType,
                assigneeId: 'unassigned',
                assigneeName: '未割り当て'
              });
            } else {
              for (const a of assignees) {
                let assigneeName = '不明';
                if (a.member_id) {
                  assigneeName = memberMap.get(a.member_id) || '不明';
                } else if (a.client_id) {
                  assigneeName = clientMap.get(a.client_id) || '不明';
                } else if (a.staff_id) {
                  assigneeName = staffMap.get(a.staff_id) || '不明';
                }

                tempRows.push({
                  projectId: p.id,
                  projectName: p.name,
                  taskId: t.id,
                  taskName: t.name,
                  progressRate,
                  assigneeType: displayAssigneeType,
                  assigneeId: a.id || `${a.member_id || a.client_id || a.staff_id}`,
                  assigneeName
                });
              }
            }
          }
        }

        // ソート: プロジェクト名 -> タスク名 -> 担当者名
        tempRows.sort((a, b) => {
          if (a.projectName !== b.projectName) return a.projectName.localeCompare(b.projectName);
          if (a.taskName !== b.taskName) return a.taskName.localeCompare(b.taskName);
          return a.assigneeName.localeCompare(b.assigneeName);
        });

        // フラグ付け
        const flatRows: SummaryRow[] = [];
        let prevProjectId = '';
        let prevTaskId = '';

        for (let i = 0; i < tempRows.length; i++) {
          const r = tempRows[i];
          const isFirstInProject = r.projectId !== prevProjectId;
          const isFirstInTask = isFirstInProject || r.taskId !== prevTaskId;

          // 次の行と比較してLastかどうかを判定
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
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const columns: Column<SummaryRow>[] = useMemo(() => [
    { 
      key: 'projectName', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      render: (item) => item.isFirstInProject ? item.projectName : '',
      style: (item) => ({
        borderBottom: item.isLastInProject ? undefined : 'none'
      })
    },
    { 
      key: 'taskName', 
      header: TABLE_COLUMNS.TASK, 
      render: (item) => item.isFirstInTask ? item.taskName : '',
      style: (item) => ({
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    { 
      key: 'progressRate', 
      header: TABLE_COLUMNS.PROGRESS_RATE, 
      className: 'quantity',
      render: (item) => item.isFirstInTask && item.taskName ? `${item.progressRate}%` : '',
      style: (item) => ({
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    { 
      key: 'assigneeType', 
      header: TABLE_COLUMNS.ASSIGNEE_TYPE, 
      render: (item) => item.isFirstInTask ? item.assigneeType : '',
      style: (item) => ({
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    { 
      key: 'assigneeName', 
      header: TABLE_COLUMNS.ASSIGNEE,
      render: (item) => item.assigneeName,
      // 担当者は毎行表示なので通常のボーダー
    }
  ], []);

  if (loading) return <div>Loading...</div>;

  const formattedDate = formatJST(targetDate);

  return (
    <DataPage 
      title={PAGE_NAMES.PROJECT_SUMMARY}
      data={data}
      columns={columns}
      emptyMessage="案件の集計データがありません"
      footerLeft={<span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>集計日時：{formattedDate}</span>}
      // 階層構造は使用しないため subItemsKey などは渡さない
    />
  );
}
