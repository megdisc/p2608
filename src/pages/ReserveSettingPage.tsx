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
      header: '方式',
      editable: true,
      inputType: 'text',
      style: { width: '220px' }
    },
    {
      key: 'calculationBase',
      header: '基準',
      editable: true,
      inputType: 'text',
      style: { width: '220px' }
    },
    {
      key: 'targetAmount',
      header: '積立額',
      editable: true,
      inputType: 'currency',
      style: { width: '160px', textAlign: 'right' }
    },
    {
      key: 'autoExecution',
      header: '自動処理',
      editable: true,
      inputType: 'checkbox',
      style: { width: '100px', textAlign: 'center' },
      render: (item: ReserveSettingItem) => (
        <span style={{ 
          padding: '2px 8px', 
          borderRadius: '4px', 
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: item.autoExecution ? 'rgba(76, 175, 80, 0.15)' : 'rgba(158, 158, 158, 0.15)',
          color: item.autoExecution ? '#2e7d32' : '#616161',
          border: item.autoExecution ? '1px solid #a5d6a7' : '1px solid #e0e0e0'
        }}>
          {item.autoExecution ? '有効' : '手動'}
        </span>
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
      initialSort={{ key: 'reserveType', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      hideAddButton={true}
      hideDeleteColumn={true}
      hideHeader={true}
    />
  );
}

