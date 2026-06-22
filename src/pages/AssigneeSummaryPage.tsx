import { DataPage, type Column } from '../components';
import { useState, useEffect, useMemo } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PERSON, WORDS_ORG_LOCATION } from '../constants';
import { useAlert } from '../contexts/AlertContext';
import { supabase } from '../lib';
import { getCurrentISOString, formatJST } from '../utils';

type SummaryRow = {
  id: string;
  assigneeId: string;
  assigneeType: string;
  assigneeTypeSortKey: number;
  assigneeName: string;
  assigneeYomigana: string;
  projectId: string;
  projectName: string;
  projectYomigana: string;
  projectType: string;
  projectTypeSortKey: string;
  taskName: string;
  progressRate: number;
  isFirstInAssignee: boolean;
  isFirstInProject: boolean;
  isLastInAssignee: boolean;
  isLastInProject: boolean;
};

export function AssigneeSummaryPage() {
  const [data, setData] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetDate] = useState(() => getCurrentISOString());
  const { showAlert } = useAlert();

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
            id, name, yomigana, project_type,
            project_tasks (
              id, name, yomigana, is_deleted,
              project_task_assignees (
                id, member_id, client_id, staff_id
              )
            )
          `).eq('is_deleted', false),
          supabase.from('members').select('id, name, yomigana').eq('is_deleted', false),
          supabase.from('clients').select('id, name, yomigana').eq('is_deleted', false),
          supabase.from('staffs').select('id, name, yomigana').eq('is_deleted', false),
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
        const memberMap = new Map(members.map(m => [m.id, { name: m.name, yomigana: m.yomigana }]));
        const clientMap = new Map(clients.map(c => [c.id, { name: c.name, yomigana: c.yomigana }]));
        const staffMap = new Map(staffs.map(s => [s.id, { name: s.name, yomigana: s.yomigana }]));

        // task_id ごとに最新の進捗率を取得
        const latestProgressMap = new Map<string, number>();
        const sortedRecords = [...records].sort((a, b) => a.year_month.localeCompare(b.year_month));
        for (const r of sortedRecords) {
          latestProgressMap.set(r.task_id, Number(r.current_progress));
        }

        // 行データを生成
        const tempRows: any[] = [];

        for (const p of projects) {
          const projectTasks = (p.project_tasks || []).filter((t: any) => !t.is_deleted);

          for (const t of projectTasks) {
            const assignees = t.project_task_assignees || [];
            const progressRate = latestProgressMap.get(t.id) || 0;
            
            if (assignees.length === 0) {
              tempRows.push({
                assigneeType: '',
                assigneeTypeSortKey: 99,
                assigneeId: 'unassigned',
                assigneeName: '未割り当て',
                assigneeYomigana: '',
                projectId: p.id,
                projectName: p.name,
                projectYomigana: p.yomigana || '',
                projectType: p.project_type || 'one-off',
                projectTypeSortKey: (p.project_type || 'one-off') === 'ongoing' ? '0' : '1',
                taskId: t.id,
                taskName: t.name,
                taskYomigana: t.yomigana || '',
                progressRate,
              });
            } else {
              for (const a of assignees) {
                let assigneeName = '不明';
                let assigneeYomigana = '';
                let displayAssigneeType = '';
                let assigneeTypeSortKey = 99;

                if (a.member_id) {
                  const m = memberMap.get(a.member_id);
                  assigneeName = m?.name || '不明';
                  assigneeYomigana = m?.yomigana || '';
                  displayAssigneeType = WORDS_PERSON.ROLE_MEMBER;
                  assigneeTypeSortKey = 1;
                } else if (a.staff_id) {
                  const s = staffMap.get(a.staff_id);
                  assigneeName = s?.name || '不明';
                  assigneeYomigana = s?.yomigana || '';
                  displayAssigneeType = WORDS_PERSON.ROLE_STAFF;
                  assigneeTypeSortKey = 2;
                } else if (a.client_id) {
                  const c = clientMap.get(a.client_id);
                  assigneeName = c?.name || '不明';
                  assigneeYomigana = c?.yomigana || '';
                  displayAssigneeType = WORDS_ORG_LOCATION.OUTSOURCE;
                  assigneeTypeSortKey = 3;
                }

                tempRows.push({
                  assigneeType: displayAssigneeType,
                  assigneeTypeSortKey,
                  assigneeId: `${displayAssigneeType}_${a.member_id || a.staff_id || a.client_id || 'unassigned'}`,
                  assigneeName,
                  assigneeYomigana,
                  projectId: p.id,
                  projectName: p.name,
                  projectYomigana: p.yomigana || '',
                  projectType: p.project_type || 'one-off',
                  projectTypeSortKey: (p.project_type || 'one-off') === 'ongoing' ? '0' : '1',
                  taskId: t.id,
                  taskName: t.name,
                  taskYomigana: t.yomigana || '',
                  progressRate,
                });
              }
            }
          }
        }

        // ソート: 担当者区分 -> 担当者よみがな -> 案件区分（継続優先） -> 案件よみがな -> タスクよみがな
        tempRows.sort((a, b) => {
          if (a.assigneeTypeSortKey !== b.assigneeTypeSortKey) return a.assigneeTypeSortKey - b.assigneeTypeSortKey;
          if (a.assigneeYomigana !== b.assigneeYomigana) return a.assigneeYomigana.localeCompare(b.assigneeYomigana);
          if (a.projectTypeSortKey !== b.projectTypeSortKey) return a.projectTypeSortKey.localeCompare(b.projectTypeSortKey);
          if (a.projectYomigana !== b.projectYomigana) return a.projectYomigana.localeCompare(b.projectYomigana);
          return a.taskYomigana.localeCompare(b.taskYomigana);
        });

        // フラグ付け
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
            projectYomigana: r.projectYomigana,
            projectType: r.projectType,
            projectTypeSortKey: r.projectTypeSortKey,
            taskName: r.taskName,
            progressRate: r.progressRate,
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
        showAlert(MESSAGES.FETCH_ERROR, 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const columns: Column<SummaryRow>[] = useMemo(() => [
    {
      key: 'assigneeType',
      header: TABLE_COLUMNS.ASSIGNEE_TYPE,
      sortable: true,
      sortKey: 'assigneeTypeSortKey',
      render: (item) => {
        if (!item.isFirstInAssignee) return '';
        return item.assigneeType;
      },
      style: (item) => ({
        borderBottom: item.isLastInAssignee ? undefined : 'none'
      })
    },
    { 
      key: 'assigneeName', 
      header: TABLE_COLUMNS.ASSIGNEE,
      sortable: true,
      sortKey: 'assigneeYomigana',
      render: (item) => {
        if (!item.isFirstInAssignee) return '';
        return item.assigneeName;
      },
      style: (item) => ({
        borderBottom: item.isLastInAssignee ? undefined : 'none'
      })
    },
    {
      key: 'projectType',
      header: TABLE_COLUMNS.PROJECT_TYPE,
      sortable: false,
      render: (item) => {
        if (!item.isFirstInProject) return '';
        return item.projectType === 'ongoing' ? '継続' : '単発';
      },
      style: (item) => ({
        borderBottom: item.isLastInProject ? undefined : 'none'
      })
    },
    { 
      key: 'projectName', 
      header: TABLE_COLUMNS.PROJECT_NAME,
      sortable: false,
      render: (item) => {
        if (!item.isFirstInProject) return '';
        if (item.projectType === 'ongoing') {
          const date = new Date(targetDate);
          const month = String(date.getMonth() + 1).padStart(2, '0');
          return `${item.projectName}（${date.getFullYear()}年${month}月分）`;
        }
        return item.projectName;
      },
      style: (item) => ({
        borderBottom: item.isLastInProject ? undefined : 'none'
      })
    },
    { 
      key: 'taskName', 
      header: TABLE_COLUMNS.TASK,
      sortable: false,
      render: (item) => item.taskName
    },
    { 
      key: 'progressRate', 
      header: TABLE_COLUMNS.PROGRESS_RATE,
      sortable: false,
      render: (item) => item.progressRate,
      style: { textAlign: 'right' }
    }
  ], []);

  if (loading) return <div>Loading...</div>;

  const formattedDate = formatJST(targetDate);

  return (
    <DataPage
      title={PAGE_NAMES.ASSIGNEE_SUMMARY}
      data={data}
      columns={columns}
      emptyMessage="表示するデータがありません"
      footerLeft={<span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-caption)' }}>集計日時：{formattedDate}</span>}
    />
  );
}
