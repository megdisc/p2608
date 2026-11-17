import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import { useAlert, useOffice } from '../contexts';
import { MESSAGES } from '../constants';
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

  const dayOptions = [
    { value: '99', label: '末日' },
    ...Array.from({ length: 31 }, (_, i) => ({
      value: String(i + 1),
      label: `${i + 1}日`,
    })),
  ];

  const monthTypeOptions = [
    { value: 'current', label: '当月' },
    { value: 'next', label: '翌月' },
    { value: 'next_next', label: '翌々月' },
  ];

  const columns: Column<SalaryClosingSettingItem>[] = [
    {
      key: 'closing_day',
      header: '給与締め日',
      sortable: false,
      editable: true,
      inputType: 'select',
      options: dayOptions,
      render: (item) => (Number(item.closing_day) === 99 ? '末日' : `${item.closing_day}日`),
    },
    {
      key: 'payment_month_type',
      header: '支給月',
      sortable: false,
      editable: true,
      inputType: 'select',
      options: monthTypeOptions,
      render: (item) => {
        const opt = monthTypeOptions.find(o => o.value === item.payment_month_type);
        return opt ? opt.label : item.payment_month_type;
      },
    },
    {
      key: 'payment_day',
      header: '給与支給日',
      sortable: false,
      editable: true,
      inputType: 'select',
      options: dayOptions,
      render: (item) => (Number(item.payment_day) === 99 ? '末日' : `${item.payment_day}日`),
    },
    {
      key: 'valid_from',
      header: '適用開始日',
      sortable: false,
      editable: true,
      inputType: 'date',
    },
    {
      key: 'valid_to',
      header: '適用終了日',
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
