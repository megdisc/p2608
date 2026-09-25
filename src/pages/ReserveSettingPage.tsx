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

  const columns: Column<ReserveSettingItem>[] = [
    {
      key: 'reserveType',
      header: TABLE_COLUMNS.RESERVE_TYPE,
      editable: false,
      inputType: 'text',
      style: { width: '200px', fontWeight: 'bold' }
    },
    {
      key: 'method',
      header: TABLE_COLUMNS.METHOD,
      editable: true,
      inputType: 'text',
      style: { width: '220px' }
    },
    {
      key: 'calculationBase',
      header: TABLE_COLUMNS.CALCULATION_BASE,
      editable: true,
      inputType: 'text',
      style: { width: '220px' }
    },
    {
      key: 'targetAmount',
      header: TABLE_COLUMNS.TARGET_AMOUNT,
      editable: true,
      inputType: 'currency',
      style: { width: '160px', textAlign: 'right' }
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
      initialSort={{ key: 'reserveType', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      hideAddButton={true}
      hideDeleteColumn={true}
      hideHeader={true}
    />
  );
}

