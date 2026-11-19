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
import { useWageClosingSettings, type WageClosingSettingItem } from '../hooks';

export function WageClosingSettingPage() {
  const { items, loading, fetchWageClosingSettings, batchSaveWageClosingSettings } = useWageClosingSettings();
  const { selectedOfficeId, offices } = useOffice();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchWageClosingSettings(selectedOfficeId).catch(() => {
      showAlert('基準日設定の取得に失敗しました', 'error');
    });
  }, [fetchWageClosingSettings, selectedOfficeId, showAlert]);

  const basisOptions = [
    { value: 'payment_date', label: '工賃支給日' },
    { value: 'closing_date', label: '工賃締め日' },
  ];

  const columns: Column<WageClosingSettingItem>[] = [
    {
      key: 'closing_day',
      header: TABLE_COLUMNS.WAGE_CLOSING_DAY,
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
      header: TABLE_COLUMNS.WAGE_PAYMENT_DAY,
      sortable: false,
      editable: true,
      inputType: 'select',
      options: CLOSING_DAY_STRING_OPTIONS,
      render: (item) => formatClosingDay(item.payment_day),
    },
    {
      key: 'average_wage_calc_basis',
      header: TABLE_COLUMNS.AVERAGE_WAGE_BASE_DATE,
      sortable: false,
      editable: true,
      inputType: 'select',
      options: basisOptions,
      render: (item) => {
        const opt = basisOptions.find(o => o.value === item.average_wage_calc_basis);
        return opt ? opt.label : item.average_wage_calc_basis;
      },
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
      closing_day: 25,
      payment_month_type: 'next',
      payment_day: 10,
      average_wage_calc_basis: 'payment_date',
      valid_from: new Date().toISOString().slice(0, 10),
      valid_to: null,
    } as WageClosingSettingItem;
  };

  const handleBatchSave = async (drafts: WageClosingSettingItem[], deletedIds: string[]) => {
    try {
      await batchSaveWageClosingSettings(drafts, deletedIds);
      await fetchWageClosingSettings(selectedOfficeId);
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
