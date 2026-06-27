import { DataPage, type Column } from '../components';
import { useEffect, useMemo } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useAlert } from '../contexts/AlertContext';
import { formatJST } from '../utils';
import { useAssigneeSummary, type SummaryRow } from '../hooks';

export function AssigneeSummaryPage() {
  const { data, loading, targetDate, fetchAssigneeSummary } = useAssigneeSummary();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchAssigneeSummary().catch(() => {
      showAlert(MESSAGES.FETCH_ERROR, 'error');
    });
  }, [fetchAssigneeSummary, showAlert]);

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
  ], [targetDate]);

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
