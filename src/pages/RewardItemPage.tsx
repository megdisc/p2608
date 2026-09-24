import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import type { RewardItem } from '../hooks';
import { useAlert } from '../contexts';
import { MESSAGES } from '../constants';
import { useRewardItems, useServiceTypes } from '../hooks';
import { generateNextUnifiedCode } from '../utils';

export function RewardItemPage() {
  const { items, loading, fetchRewardItems, batchSaveRewardItems } = useRewardItems();
  const { items: serviceTypes, fetchServiceTypes } = useServiceTypes();
  const { showAlert } = useAlert();

  useEffect(() => {
    Promise.all([
      fetchRewardItems(),
      fetchServiceTypes()
    ]).catch(() => {
      showAlert('加算・減算項目データの取得に失敗しました', 'error');
    });
  }, [fetchRewardItems, fetchServiceTypes, showAlert]);

  const serviceTypeOptions = serviceTypes.map(st => ({
    label: st.name,
    value: st.id
  }));

  const columns: Column<RewardItem>[] = [
    { key: 'code', header: '加減算コード', sortable: false, editable: true, inputType: 'text' },
    { 
      key: 'service_type_id', 
      header: '所属支援種別', 
      sortable: false, 
      editable: true, 
      inputType: 'select',
      options: serviceTypeOptions,
      render: (item) => {
        const matched = serviceTypes.find(st => st.id === item.service_type_id);
        return <span>{matched ? matched.name : item.service_type_name || '就労継続支援B型'}</span>;
      }
    },
    { key: 'name', header: '加算・減算項目名', sortable: false, editable: true, inputType: 'text' },
    { 
      key: 'item_category', 
      header: '項目区分', 
      sortable: false, 
      editable: true, 
      inputType: 'select',
      options: [
        { label: '体制加算', value: 'addition' },
        { label: '体制減算', value: 'subtraction' }
      ],
      render: (item) => {
        const isAddition = item.item_category === 'addition';
        return (
          <span style={{ 
            padding: '2px 8px', 
            borderRadius: '4px', 
            fontSize: '12px',
            backgroundColor: isAddition ? 'var(--palette-bluegreen-200)' : 'var(--palette-red-200)',
            color: isAddition ? 'var(--palette-bluegreen-900)' : 'var(--palette-red-900)'
          }}>
            {isAddition ? '体制加算' : '体制減算'}
          </span>
        );
      }
    },
    { 
      key: 'occurrence_type', 
      header: '発生単位', 
      sortable: false, 
      editable: true, 
      inputType: 'select',
      options: [
        { label: '日次発生', value: 'daily' },
        { label: '月次発生', value: 'monthly' }
      ],
      render: (item) => (
        <span>{item.occurrence_type === 'monthly' ? '月次発生' : '日次発生'}</span>
      )
    },
    { key: 'unit_value', header: '単位数', sortable: false, editable: true, inputType: 'number' },
    { key: 'calc_rate', header: '定率算定率[%]', sortable: false, editable: true, inputType: 'number' },
    { key: 'monthly_limit_count', header: '月間上限回数', sortable: false, editable: true, inputType: 'number' },
    { key: 'is_active', header: '適用', sortable: false, editable: true, inputType: 'checkbox' },
  ];

  const handleBatchSave = async (drafts: RewardItem[], deletedIds: string[]) => {
    try {
      await batchSaveRewardItems(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  const handleAdd = (currentDrafts?: RewardItem[]) => {
    const existingCodes = [
      ...items.map(i => i.code),
      ...(currentDrafts || []).map(i => i.code)
    ];

    const defaultServiceTypeId = serviceTypes.find(st => st.code === 'type_b')?.id || serviceTypes[0]?.id || '11111111-0000-0000-0000-000000000001';

    return {
      id: `REW-${Date.now()}-${Math.random()}`,
      service_type_id: defaultServiceTypeId,
      code: generateNextUnifiedCode(existingCodes, 'REW-'),
      name: '',
      item_category: 'addition',
      occurrence_type: 'daily',
      unit_value: 0,
      calc_rate: 0,
      monthly_limit_count: null,
      is_active: true,
    } as RewardItem;
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage 
      title="加算・減算"
      data={items} 
      columns={columns} 
      emptyMessage="登録されている加算・減算項目がありません" 
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
      hideDeleteColumn={true}
      hideHeader={true}
    />
  );
}
