import { DataPage, type Column } from '../components';
import { useEffect, useMemo } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PROJECT } from '../constants';
import type { FinancialRecordItem } from '../types';
import { useAlert, useAuth } from '../contexts';
import { useFinancialRecords } from '../hooks';
import { getCurrentJSTDateOnly } from '../utils';

export function FinancialRecordPage() {
  const { 
    items, 
    projects, 
    staffs, 
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

  const columns: Column<FinancialRecordItem>[] = [
    { 
      key: 'period', 
      header: TABLE_COLUMNS.PERIOD,
      editable: true,
      inputType: 'date'
    },
    { 
      key: 'projectId', 
      header: TABLE_COLUMNS.PROJECT_NAME, 
      editable: true, 
      inputType: 'select', 
      options: projectOptions
    },
    { 
      key: 'type', 
      header: TABLE_COLUMNS.TYPE, 
      editable: true, 
      inputType: 'radio',
      options: [
        { label: WORDS_PROJECT.REVENUE, value: 'revenue' },
        { label: WORDS_PROJECT.EXPENSE, value: 'expense' }
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
            { label: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER, value: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER }
          ];
        }
        // default to revenue subjects
        return [
          { label: '', value: '' },
          { label: WORDS_PROJECT.SUBJECT_REVENUE_SALES, value: WORDS_PROJECT.SUBJECT_REVENUE_SALES },
          { label: WORDS_PROJECT.SUBJECT_REVENUE_OTHER, value: WORDS_PROJECT.SUBJECT_REVENUE_OTHER }
        ];
      }
    },
    { 
      key: 'amount', 
      header: TABLE_COLUMNS.AMOUNT, 
      editable: true, 
      inputType: 'number' 
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
    },
    {
      key: 'isLimited',
      header: TABLE_COLUMNS.RESTRICTION,
      editable: true,
      inputType: 'checkbox'
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
    period: getCurrentJSTDateOnly(),
    projectId: '',
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
      showDateFilter={true}
      dateFilterKey="period"
    />
  );
}
