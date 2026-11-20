import { useEffect } from 'react';
import { DataPage, type Column, CurrencyDisplay } from '../components';
import type { ReserveSettingItem } from '../types';
import { useAlert, useOffice } from '../contexts';
import {
  TABLE_COLUMNS,
  PAGE_NAMES,
  MESSAGES,
  CLOSING_DAY_STRING_OPTIONS,
  CLOSING_MONTH_TYPE_OPTIONS,
  formatClosingDay,
  formatClosingMonthType,
} from '../constants';
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
      header: TABLE_COLUMNS.CALCULATION_METHOD,
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
      header: TABLE_COLUMNS.FIXED_AMOUNT,
      editable: (item: ReserveSettingItem) => item.calcType === 'fixed_amount',
      inputType: 'currency',
      sortable: false,
      className: 'number-column',
      style: { width: '180px', textAlign: 'right' },
      render: (item: ReserveSettingItem) => (
        item.calcType === 'fixed_amount' ? (
          <CurrencyDisplay value={item.fixedAmount || 0} />
        ) : (
          <span className="text-muted">-</span>
        )
      )
    },
    {
      key: 'fixedRate',
      header: TABLE_COLUMNS.FIXED_RATE,
      editable: (item: ReserveSettingItem) => item.calcType === 'fixed_rate',
      inputType: 'number',
      sortable: false,
      className: 'number-column',
      style: { width: '140px', textAlign: 'right' },
      render: (item: ReserveSettingItem) => (
        item.calcType === 'fixed_rate' ? (
          <span className="tabular-nums">{Number(item.fixedRate || 0)} %</span>
        ) : (
          <span className="text-muted">-</span>
        )
      )
    },
    {
      key: 'transferInMonthType',
      header: TABLE_COLUMNS.RESERVE_INFLOW_MONTH,
      editable: true,
      inputType: 'select',
      sortable: false,
      options: CLOSING_MONTH_TYPE_OPTIONS,
      style: { width: '120px' },
      render: (item: ReserveSettingItem) => (
        <span>{formatClosingMonthType(item.transferInMonthType)}</span>
      )
    },
    {
      key: 'transferInDay',
      header: TABLE_COLUMNS.RESERVE_INFLOW_DAY,
      editable: true,
      inputType: 'select',
      sortable: false,
      options: CLOSING_DAY_STRING_OPTIONS,
      style: { width: '120px' },
      render: (item: ReserveSettingItem) => (
        <span>{formatClosingDay(item.transferInDay)}</span>
      )
    },
    {
      key: 'transferOutMonthType',
      header: TABLE_COLUMNS.RESERVE_WITHDRAWAL_MONTH,
      editable: true,
      inputType: 'select',
      sortable: false,
      options: CLOSING_MONTH_TYPE_OPTIONS,
      style: { width: '120px' },
      render: (item: ReserveSettingItem) => (
        <span>{formatClosingMonthType(item.transferOutMonthType)}</span>
      )
    },
    {
      key: 'transferOutDay',
      header: TABLE_COLUMNS.RESERVE_WITHDRAWAL_DAY,
      editable: true,
      inputType: 'select',
      sortable: false,
      options: CLOSING_DAY_STRING_OPTIONS,
      style: { width: '120px' },
      render: (item: ReserveSettingItem) => (
        <span>{formatClosingDay(item.transferOutDay)}</span>
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

