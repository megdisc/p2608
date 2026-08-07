import { DataPage, type Column } from '../components';
import { useEffect } from 'react';
import { PAGE_NAMES, MESSAGES, WORDS_PROJECT } from '../constants';
import type { ProjectFinancialSummaryRow } from '../types';
import { useAlert } from '../contexts';
import { useProjectFinancialRecords } from '../hooks';

export function ProjectFinancialRecordPage() {
  const { items, loading, fetchRecords } = useProjectFinancialRecords();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchRecords().catch(() => {
      showAlert('収支記録の取得に失敗しました', 'error');
    });
  }, [fetchRecords, showAlert]);

  const columns: Column<ProjectFinancialSummaryRow>[] = [
    { 
      key: 'projectName', 
      header: '案件名', 
      editable: false, 
      inputType: 'text', 
      rowType: 'main' 
    },
    { 
      key: 'totalRevenue', 
      header: '総収益', 
      editable: false, 
      inputType: 'currency', 
      rowType: 'main' 
    },
    { 
      key: 'totalExpense', 
      header: '総費用', 
      editable: false, 
      inputType: 'currency', 
      rowType: 'main' 
    },
    { 
      key: 'totalReserve', 
      header: '総積立金', 
      editable: false, 
      inputType: 'currency', 
      rowType: 'main' 
    },
    {
      key: 'type',
      header: '区分',
      editable: false,
      inputType: 'select',
      options: [
        { label: WORDS_PROJECT.REVENUE, value: 'revenue' },
        { label: WORDS_PROJECT.EXPENSE, value: 'expense' },
        { label: WORDS_PROJECT.RESERVE, value: 'reserve' }
      ],
      rowType: 'sub',
      sortable: false
    },
    {
      key: 'subject',
      header: '科目',
      editable: false,
      inputType: 'text',
      rowType: 'sub',
      sortable: false
    },
    {
      key: 'amount',
      header: '金額',
      editable: false,
      inputType: 'currency',
      rowType: 'sub',
      sortable: false
    },
    {
      key: 'period',
      header: '計上日',
      editable: false,
      inputType: 'date',
      rowType: 'sub',
      sortable: false
    }
  ];

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.PROJECT_FINANCIAL_RECORD}
      data={items}
      columns={columns}
      emptyMessage="案件データがありません"
      onBatchSave={async () => {}}
      onAddRow={() => ({} as any)} // 検討用なので追加不可
      disableAddButton={true}
      subItemsKey="records"
      hideHeader={true}
    />
  );
}
