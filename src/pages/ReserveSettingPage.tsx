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
      editable: true,
      inputType: 'select',
      options: [
        { label: WORDS_PROJECT.SUBJECT_RESERVE_WAGE, value: WORDS_PROJECT.SUBJECT_RESERVE_WAGE },
        { label: WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT, value: WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT },
      ],
      style: { width: '220px', fontWeight: 'bold' }
    },
    {
      key: 'settingSummary',
      header: TABLE_COLUMNS.RESERVE_SETTING,
      render: (item: ReserveSettingItem) => {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '4px', 
                fontSize: '12px', 
                fontWeight: 600,
                backgroundColor: 'rgba(56, 142, 60, 0.12)',
                color: '#2e7d32',
                border: '1px solid rgba(56, 142, 60, 0.3)'
              }}>
                方式: {item.method}
              </span>
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '4px', 
                fontSize: '12px', 
                fontWeight: 600,
                backgroundColor: 'rgba(255, 152, 0, 0.12)',
                color: '#e65100',
                border: '1px solid rgba(255, 152, 0, 0.3)'
              }}>
                基準: {item.calculationBase}
              </span>
              {item.targetAmount !== undefined && (
                <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  backgroundColor: 'rgba(33, 150, 243, 0.12)',
                  color: '#1565c0',
                  border: '1px solid rgba(33, 150, 243, 0.3)'
                }}>
                  目標上限: {item.targetAmount.toLocaleString()}円
                </span>
              )}
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '4px', 
                fontSize: '12px',
                backgroundColor: item.autoExecution ? 'rgba(76, 175, 80, 0.15)' : 'rgba(158, 158, 158, 0.15)',
                color: item.autoExecution ? '#2e7d32' : '#616161',
                border: item.autoExecution ? '1px solid #a5d6a7' : '1px solid #e0e0e0'
              }}>
                {item.autoExecution ? '自動処理: 有効' : '自動処理: 手動'}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted, #666)', lineHeight: '1.4' }}>
              {item.description}
            </div>
          </div>
        );
      }
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

  const handleAdd = () => {
    return {
      id: `RSV-${Date.now()}`,
      reserveType: WORDS_PROJECT.SUBJECT_RESERVE_WAGE,
      method: '月次剰余金の定率積立',
      calculationBase: '月次剰余金の 10%',
      targetAmount: 500000,
      autoExecution: true,
      description: '新規設定された積立金の用途・補足メモ。',
    } as ReserveSettingItem;
  };

  return (
    <DataPage
      title={PAGE_NAMES.TAB_RESERVE_SETTING}
      data={items}
      columns={columns}
      emptyMessage="積立金設定が登録されていません。"
      initialSort={{ key: 'reserveType', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideHeader={true}
    />
  );
}
