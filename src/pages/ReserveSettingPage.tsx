import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import type { ReserveSettingItem } from '../types';
import { useAlert, useOffice } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useReserveSettings } from '../hooks';

export function ReserveSettingPage() {
  const { items, loading, fetchReserveSettings, batchSaveReserveSettings } = useReserveSettings();
  const { selectedOfficeId } = useOffice();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchReserveSettings(selectedOfficeId).catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchReserveSettings, selectedOfficeId, showAlert]);

  const transferDayOptions = [
    { value: '', label: '未設定' },
    { value: 'next_99', label: '翌月末日' },
    { value: 'current_99', label: '当月末日' },
    { value: 'next_10', label: '翌月10日' },
    { value: 'next_15', label: '翌月15日' },
    { value: 'next_20', label: '翌月20日' },
    { value: 'next_25', label: '翌月25日' },
    { value: 'current_25', label: '当月25日' },
    { value: 'next_next_10', label: '翌々月10日' },
    { value: 'next_next_99', label: '翌々月末日' },
    ...Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      return { value: `next_${day}`, label: `翌月${day}日` };
    }).filter(o => !['next_10', 'next_15', 'next_20', 'next_25'].includes(o.value))
  ];

  const getTransferDayLabel = (val?: string | null) => {
    if (!val) return '';
    const opt = transferDayOptions.find(o => o.value === val);
    return opt ? opt.label : val;
  };

  const columns: Column<ReserveSettingItem>[] = [
    {
      key: 'reserveType',
      header: TABLE_COLUMNS.RESERVE_TYPE,
      editable: false,
      inputType: 'text',
      sortable: false,
      style: { width: '220px', fontWeight: 'bold' }
    },
    {
      key: 'calcType',
      header: '計算方式',
      editable: true,
      inputType: 'select',
      sortable: false,
      options: [
        { label: '定額（円）', value: 'fixed_amount' },
        { label: '定率（%）', value: 'fixed_rate' }
      ],
      style: { width: '160px' },
      render: (item: ReserveSettingItem) => (
        <span>{item.calcType === 'fixed_rate' ? '定率（%）' : '定額（円）'}</span>
      )
    },
    {
      key: 'fixedAmount',
      header: '定額金額（円）',
      editable: (item: ReserveSettingItem) => item.calcType === 'fixed_amount',
      inputType: 'currency',
      sortable: false,
      className: 'number-column',
      style: { width: '180px', textAlign: 'right' },
      render: (item: ReserveSettingItem) => (
        item.calcType === 'fixed_amount' ? (
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>¥{Number(item.fixedAmount || 0).toLocaleString()}</span>
        ) : (
          <span style={{ color: 'var(--color-text-muted, #a0aec0)' }}>-</span>
        )
      )
    },
    {
      key: 'fixedRate',
      header: '定率（%）',
      editable: (item: ReserveSettingItem) => item.calcType === 'fixed_rate',
      inputType: 'number',
      sortable: false,
      className: 'number-column',
      style: { width: '140px', textAlign: 'right' },
      render: (item: ReserveSettingItem) => (
        item.calcType === 'fixed_rate' ? (
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Number(item.fixedRate || 0)} %</span>
        ) : (
          <span style={{ color: 'var(--color-text-muted, #a0aec0)' }}>-</span>
        )
      )
    },
    {
      key: 'transferInDay',
      header: TABLE_COLUMNS.RESERVE_INFLOW_DAY,
      editable: true,
      inputType: 'select',
      sortable: false,
      options: transferDayOptions,
      style: { width: '150px' },
      render: (item: ReserveSettingItem) => (
        <span>{getTransferDayLabel(item.transferInDay) || '-'}</span>
      )
    },
    {
      key: 'transferOutDay',
      header: TABLE_COLUMNS.RESERVE_WITHDRAWAL_DAY,
      editable: true,
      inputType: 'select',
      sortable: false,
      options: transferDayOptions,
      style: { width: '150px' },
      render: (item: ReserveSettingItem) => (
        <span>{getTransferDayLabel(item.transferOutDay) || '-'}</span>
      )
    }
  ];

  const handleBatchSave = async (drafts: ReserveSettingItem[], deletedIds: string[]) => {
    try {
      await batchSaveReserveSettings(drafts, deletedIds, selectedOfficeId);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  if (loading && items.length === 0) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.TAB_RESERVE_SETTING}
      data={items}
      columns={columns}
      emptyMessage="積立金設定が登録されていません。"
      initialSort={{ key: '', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      hideAddButton={true}
      hideDeleteColumn={true}
      hideHeader={true}
    />
  );
}

