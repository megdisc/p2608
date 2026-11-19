import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import { useAlert, useOffice } from '../contexts';
import {
  MESSAGES,
  TABLE_COLUMNS,
  CLOSING_DAY_STRING_OPTIONS,
  CLOSING_MONTH_TYPE_OPTIONS,
  formatClosingDay,
  formatClosingMonthType,
} from '../constants';
import { useSalaryClosingSettings, type SalaryClosingSettingItem } from '../hooks';

export function SalaryClosingSettingPage() {
  const { items, loading, fetchSalaryClosingSettings, batchSaveSalaryClosingSettings } = useSalaryClosingSettings();
  const { selectedOfficeId, offices } = useOffice();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchSalaryClosingSettings(selectedOfficeId).catch(() => {
      showAlert('基準日設定の取得に失敗しました', 'error');
    });
  }, [fetchSalaryClosingSettings, selectedOfficeId, showAlert]);

  const columns: Column<SalaryClosingSettingItem>[] = [
    {
      key: 'closing_day',
      header: TABLE_COLUMNS.SALARY_CLOSING_DAY,
      sortable: false,
      editable: true,
      inputType: 'select',
      options: CLOSING_DAY_STRING_OPTIONS,
      render: (item) => formatClosingDay(item.closing_day),
    },
    {
      key: 'payment_month_type',
      header: TABLE_COLUMNS.PAYMENT_MONTH,
      sortable: false,
      editable: true,
      inputType: 'select',
      options: CLOSING_MONTH_TYPE_OPTIONS,
      render: (item) => formatClosingMonthType(item.payment_month_type),
    },
    {
      key: 'payment_day',
      header: TABLE_COLUMNS.SALARY_PAYMENT_DAY,
      sortable: false,
      editable: true,
      inputType: 'select',
      options: CLOSING_DAY_STRING_OPTIONS,
      render: (item) => formatClosingDay(item.payment_day),
    },
    {
      key: 'valid_from',
      header: TABLE_COLUMNS.APPLY_START_DATE,
      sortable: false,
      editable: true,
      inputType: 'date',
    },
    {
      key: 'valid_to',
      header: TABLE_COLUMNS.APPLY_END_DATE,
      sortable: false,
      editable: true,
      inputType: 'date',
      render: (item) => item.valid_to || '継続中',
    },
  ];

  const effectiveOfficeId = (selectedOfficeId && selectedOfficeId !== 'all')
    ? selectedOfficeId
    : (offices[0]?.id || '');

  const handleAdd = () => {
    return {
      id: `new_${Date.now()}`,
      office_id: effectiveOfficeId,
      office_name: '',
      closing_day: 20,
      payment_month_type: 'next',
      payment_day: 10,
      valid_from: new Date().toISOString().slice(0, 10),
      valid_to: null,
    } as SalaryClosingSettingItem;
  };

  const handleBatchSave = async (drafts: SalaryClosingSettingItem[], deletedIds: string[]) => {
    try {
      await batchSaveSalaryClosingSettings(drafts, deletedIds);
      await fetchSalaryClosingSettings(selectedOfficeId);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  if (loading && items.length === 0) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage
      title="基準日設定"
      data={items}
      columns={columns}
      emptyMessage="基準日設定データがありません"
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}
