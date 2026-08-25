import { useState } from 'react';
import { DataPage, type Column } from '../components';
import type { ReserveSettingItem } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_PROJECT } from '../constants';

const INITIAL_MOCK_DATA: ReserveSettingItem[] = [
  {
    id: 'RSV-001',
    reserveType: WORDS_PROJECT.SUBJECT_RESERVE_WAGE,
    method: '月次剰余金の定率積立',
    calculationBase: '月次剰余金の 10%',
    targetAmount: 1000000,
    autoExecution: true,
    description: '年度内の収支変動時において、利用者の基本工賃および目標工賃水準を安定的に維持・補填するための準備金。',
  },
  {
    id: 'RSV-002',
    reserveType: WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT,
    method: '毎月定額積立',
    calculationBase: '月額 30,000円',
    targetAmount: 500000,
    autoExecution: true,
    description: '生産活動に使用する作業機器、車両、施設設備の定期点検・突然の故障修繕および更新のための準備金。',
  },
];

export function ReserveSettingPage() {
  const [items, setItems] = useState<ReserveSettingItem[]>(INITIAL_MOCK_DATA);
  const { showAlert } = useAlert();

  const columns: Column<ReserveSettingItem>[] = [
    {
      key: 'reserveType',
      header: TABLE_COLUMNS.RESERVE_TYPE,
      editable: false,
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
      header: '上限',
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
      const activeDrafts = drafts.filter(d => !deletedIds.includes(d.id));
      setItems(activeDrafts);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  return (
    <DataPage
      title={PAGE_NAMES.TAB_RESERVE_SETTING}
      data={items}
      columns={columns}
      emptyMessage="積立金設定が登録されていません。"
      initialSort={{ key: 'reserveType', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      hideDeleteColumn={true}
      hideAddButton={true}
      hideCancelButton={true}
      hideHeader={true}
    />
  );
}
