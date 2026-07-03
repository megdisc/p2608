import { DataPage, type Column } from '../components';
import { useEffect, useMemo } from 'react';
import { PAGE_NAMES, MESSAGES } from '../constants';
import { useAlert } from '../contexts/AlertContext';
import { useFinancialSummary, type FinancialSummaryRow } from '../hooks';

export function FinancialSummaryPage() {
  const { data, loading, fetchSummary } = useFinancialSummary();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchSummary().catch(() => {
      showAlert(MESSAGES.FETCH_ERROR, 'error');
    });
  }, [fetchSummary, showAlert]);

  const columns: Column<FinancialSummaryRow>[] = useMemo(() => [
    {
      key: 'period',
      header: '時期',
      sortable: true,
      render: (item) => item.period
    },
    { 
      key: 'revenue', 
      header: '収益',
      sortable: true,
      render: (item) => `¥${item.revenue.toLocaleString()}`,
      style: { textAlign: 'right' }
    },
    { 
      key: 'expense', 
      header: '費用',
      sortable: true,
      render: (item) => `¥${item.expense.toLocaleString()}`,
      style: { textAlign: 'right' }
    },
    { 
      key: 'reserve', 
      header: '積立金',
      sortable: true,
      render: (item) => `¥${item.reserve.toLocaleString()}`,
      style: { textAlign: 'right' }
    }
  ], []);

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <DataPage
      title={PAGE_NAMES.FINANCIAL_SUMMARY}
      data={data}
      columns={columns}
      emptyMessage="表示するデータがありません"
    />
  );
}
