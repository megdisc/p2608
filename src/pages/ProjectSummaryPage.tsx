import { DataPage, type Column } from '../components';
import { useEffect, useMemo } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useAlert } from '../contexts/AlertContext';
import { formatJST } from '../utils';
import { useProjectSummary, type ProjectSummaryRow } from '../hooks';

export function ProjectSummaryPage() {
  const { data, loading, targetDate, fetchProjectSummary } = useProjectSummary();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchProjectSummary().catch(() => {
      showAlert(MESSAGES.FETCH_ERROR, 'error');
    });
  }, [fetchProjectSummary, showAlert]);

  const columns: Column<ProjectSummaryRow>[] = useMemo(() => [
    {
      key: 'projectType',
      header: TABLE_COLUMNS.PROJECT_TYPE,
      sortKey: 'projectTypeSortKey',
      sortable: true,
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
      sortKey: 'projectYomigana',
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
      render: (item) => item.isFirstInTask ? item.taskName : '',
      style: (item) => ({
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    { 
      key: 'progressRate', 
      header: TABLE_COLUMNS.PROGRESS_RATE, 
      sortable: false,
      className: 'quantity',
      render: (item) => item.isFirstInTask && item.taskName ? item.progressRate : '',
      style: (item) => ({
        borderBottom: item.isLastInTask ? undefined : 'none'
      })
    },
    { 
      key: 'assigneeType', 
      header: TABLE_COLUMNS.ASSIGNEE_TYPE, 
      sortable: false,
      render: (item) => item.assigneeType,
    },
    { 
      key: 'assigneeName', 
      header: TABLE_COLUMNS.ASSIGNEE,
      sortable: false,
      render: (item) => item.assigneeName,
    }
  ], [targetDate]);

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  const formattedDate = formatJST(targetDate);

  return (
    <DataPage 
      title={PAGE_NAMES.PROJECT_SUMMARY}
      data={data}
      columns={columns}
      emptyMessage="案件の集計データがありません"
      footerLeft={<span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-caption)' }}>集計日時：{formattedDate}</span>}
    />
  );
}
