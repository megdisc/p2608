import { DataPage, type Column } from '../components';
import { useEffect, useMemo } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PROJECT } from '../constants';
import type { FinancialRecordItem } from '../types';
import { useAlert } from '../contexts';
import { useFinancialRecords } from '../hooks';

export function FinancialRecordPage() {
  const { 
    items, 
    totalCount,
    page,
    setPage,
    handleSortChange,
    currentYear,
    handleYearChange,
    sortConfig,
    projects, 
    staffs, 
    clients,
    loading, 
    fetchRecords 
  } = useFinancialRecords();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchRecords().catch(() => {
      showAlert('収支一覧の取得に失敗しました', 'error');
    });
  }, [fetchRecords, showAlert]);

  const projectOptions = useMemo(() => [{ label: '', value: '' }, ...projects.map(p => ({ label: p.name, value: p.id }))], [projects]);
  const staffOptions = useMemo(() => [{ label: '', value: '' }, ...staffs.map(s => ({ label: s.name, value: s.id }))], [staffs]);
  const clientOptions = useMemo(() => [{ label: '-', value: '' }, ...clients.map(c => ({ label: c.name, value: c.id }))], [clients]);

  const columns: Column<FinancialRecordItem>[] = [
    { 
      key: 'period', 
      header: TABLE_COLUMNS.PERIOD,
      inputType: 'date'
    },
    { 
      key: 'type', 
      header: TABLE_COLUMNS.TYPE, 
      inputType: 'radio',
      options: [
        { label: WORDS_PROJECT.REVENUE, value: 'revenue' },
        { label: WORDS_PROJECT.EXPENSE, value: 'expense' },
        { label: WORDS_PROJECT.RESERVE, value: 'reserve' }
      ]
    },
    {
      key: 'activity_category',
      header: '事業区分',
      inputType: 'select',
      options: [
        { label: '生産活動', value: 'production' },
        { label: '福祉事業', value: 'welfare' }
      ],
      render: (item) => item.activity_category === 'welfare' ? '福祉事業' : '生産活動'
    },
    {
      key: 'subject',
      header: TABLE_COLUMNS.SUBJECT,
      inputType: 'select',
      options: (item) => {
        if (item.type === 'expense') {
          return [
            { label: '', value: '' },
            { label: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER, value: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER },
            { label: WORDS_PROJECT.SUBJECT_EXPENSE_DEDUCTION_MEMBER, value: WORDS_PROJECT.SUBJECT_EXPENSE_DEDUCTION_MEMBER },
            { label: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER, value: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER },
            { label: WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE, value: WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE },
            { label: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL, value: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL },
            { label: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER, value: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER }
          ];
        } else if (item.type === 'reserve') {
          return [
            { label: '', value: '' },
            { label: WORDS_PROJECT.SUBJECT_RESERVE_WAGE, value: WORDS_PROJECT.SUBJECT_RESERVE_WAGE },
            { label: WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT, value: WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT }
          ];
        }
        return [
          { label: '', value: '' },
          { label: WORDS_PROJECT.SUBJECT_REVENUE_SALES, value: WORDS_PROJECT.SUBJECT_REVENUE_SALES }
        ];
      }
    },
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      inputType: 'select', 
      options: projectOptions,
      render: (item) => projectOptions.find(o => o.value === item.projectId)?.label || '-'
    },
    { 
      key: 'clientId', 
      header: TABLE_COLUMNS.CLIENT_NAME, 
      inputType: 'select', 
      options: clientOptions,
      render: (item) => {
        if (
          item.subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER ||
          item.subject === WORDS_PROJECT.SUBJECT_EXPENSE_DEDUCTION_MEMBER
        ) {
          return '利用者一括';
        }
        if (
          item.subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER ||
          item.subject === WORDS_PROJECT.SUBJECT_RESERVE_WAGE ||
          item.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT
        ) {
          return '自社';
        }
        return clientOptions.find(o => o.value === item.clientId)?.label || '-';
      }
    },
    { 
      key: 'amount', 
      header: TABLE_COLUMNS.AMOUNT, 
      inputType: 'currency' 
    },
    {
      key: 'remarks',
      header: TABLE_COLUMNS.REMARKS,
      inputType: 'text'
    },
    { 
      key: 'recordedDate', 
      header: TABLE_COLUMNS.RECORDED_DATE,
      inputType: 'date'
    },
    { 
      key: 'recordedBy', 
      header: TABLE_COLUMNS.PERSON_IN_CHARGE, 
      inputType: 'select', 
      options: staffOptions,
      render: (item) => staffOptions.find(o => o.value === item.recordedBy)?.label || '-'
    }
  ];

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.FINANCIAL_RECORD}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_FINANCIAL_RECORD}
      showYearFilter={true}
      singleYear={currentYear}
      onSingleYearChange={handleYearChange}
      initialSort={{ key: 'period', direction: 'desc' }}
      sortConfig={sortConfig}
      hideHeader={true}
      serverSidePagination={true}
      totalCount={totalCount}
      currentPage={page}
      onPageChange={setPage}
      onSortChange={handleSortChange}
    />
  );
}
