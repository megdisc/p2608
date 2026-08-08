import { DataPage, type Column } from '../components';
import { useEffect, useMemo } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PROJECT } from '../constants';
import type { FinancialRecordItem } from '../types';
import { useAlert, useAuth } from '../contexts';
import { useFinancialRecords } from '../hooks';
import { getCurrentJSTDateOnly, getCurrentJSTMonth } from '../utils';

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
    fetchRecords, 
    batchSaveRecords 
  } = useFinancialRecords();
  const { showAlert } = useAlert();
  const { user } = useAuth();

  useEffect(() => {
    fetchRecords().catch(() => {
      showAlert('収支記録の取得に失敗しました', 'error');
    });
  }, [fetchRecords, showAlert]);

  const projectOptions = useMemo(() => [{ label: '', value: '' }, ...projects.map(p => ({ label: p.name, value: p.id }))], [projects]);
  const staffOptions = useMemo(() => [{ label: '', value: '' }, ...staffs.map(s => ({ label: s.name, value: s.id }))], [staffs]);
  const clientOptions = useMemo(() => [{ label: '-', value: '' }, ...clients.map(c => ({ label: c.name, value: c.id }))], [clients]);

  const columns: Column<FinancialRecordItem>[] = [
    { 
      key: 'period', 
      header: TABLE_COLUMNS.PERIOD,
      editable: true,
      inputType: 'month'
    },
    { 
      key: 'type', 
      header: TABLE_COLUMNS.TYPE, 
      editable: true, 
      inputType: 'radio',
      options: [
        { label: WORDS_PROJECT.REVENUE, value: 'revenue' },
        { label: WORDS_PROJECT.EXPENSE, value: 'expense' },
        { label: WORDS_PROJECT.RESERVE, value: 'reserve' }
      ],
      onCellChange: (newType, item) => {
        // If type changes, clear the subject as it might no longer be valid
        if (newType !== item.type) {
          return { subject: '' };
        }
        return {};
      }
    },
    {
      key: 'subject',
      header: TABLE_COLUMNS.SUBJECT,
      editable: true,
      inputType: 'select',
      options: (item) => {
        if (item.type === 'expense') {
          return [
            { label: '', value: '' },
            { label: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER, value: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER },
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
        // default to revenue subjects
        return [
          { label: '', value: '' },
          { label: WORDS_PROJECT.SUBJECT_REVENUE_SALES, value: WORDS_PROJECT.SUBJECT_REVENUE_SALES }
        ];
      },
      onCellChange: (newSubject) => {
        if (
          newSubject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER ||
          newSubject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER ||
          newSubject === WORDS_PROJECT.SUBJECT_RESERVE_WAGE ||
          newSubject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT
        ) {
          return { clientId: '' };
        }
        return {};
      }
    },
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      editable: true, 
      inputType: 'select', 
      options: projectOptions
    },
    { 
      key: 'clientId', 
      header: TABLE_COLUMNS.CLIENT_NAME, 
      editable: (item) => {
        if (
          item.subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER ||
          item.subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER ||
          item.subject === WORDS_PROJECT.SUBJECT_RESERVE_WAGE ||
          item.subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT
        ) {
          return false;
        }
        return true;
      }, 
      inputType: 'select', 
      options: clientOptions,
      render: (item) => {
        if (item.subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER) {
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
      editable: true, 
      inputType: 'currency' 
    },
    { 
      key: 'recordedDate', 
      header: TABLE_COLUMNS.RECORDED_DATE,
      editable: true,
      inputType: 'date'
    },
    { 
      key: 'recordedBy', 
      header: TABLE_COLUMNS.PERSON_IN_CHARGE, 
      editable: true, 
      inputType: 'select', 
      options: staffOptions
    }
  ];

  const handleBatchSave = async (drafts: FinancialRecordItem[], _deletedIds: string[]) => {
    try {
      await batchSaveRecords(drafts);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error(err);
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAddRow = (): FinancialRecordItem => ({
    id: `draft-${Date.now()}`,
    period: getCurrentJSTMonth(),
    projectId: '',
    clientId: '',
    type: 'revenue',
    subject: '',
    amount: 0,
    recordedDate: getCurrentJSTDateOnly(),
    recordedBy: user?.id || '',
    isLimited: false
  });

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.FINANCIAL_RECORD}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_FINANCIAL_RECORD}
      onBatchSave={handleBatchSave}
      onAddRow={handleAddRow}
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
