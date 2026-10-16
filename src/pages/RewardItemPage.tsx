import { useEffect, useMemo, useCallback } from 'react';
import { DataPage, Button, type Column } from '../components';
import type { RewardItem, ServiceTypeItem } from '../hooks';
import { useAlert } from '../contexts';
import { MESSAGES, TABLE_COLUMNS } from '../constants';
import { useRewardItems, useServiceTypes } from '../hooks';
import { generateNextUnifiedCode } from '../utils';

type ServiceTypeWithRewardItems = ServiceTypeItem & {
  rewardItems: RewardItem[];
  isUnassigned?: boolean;
};

export function RewardItemPage() {
  const { items, loading: loadingItems, fetchRewardItems, batchSaveRewardItems } = useRewardItems();
  const { items: serviceTypes, loading: loadingServiceTypes, fetchServiceTypes } = useServiceTypes();
  const { showAlert } = useAlert();

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        fetchRewardItems(),
        fetchServiceTypes()
      ]);
    } catch {
      showAlert('加算・減算項目データの取得に失敗しました', 'error');
    }
  }, [fetchRewardItems, fetchServiceTypes, showAlert]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 支援種別ごとの階層データ構築
  const groupedData: ServiceTypeWithRewardItems[] = useMemo(() => {
    const list: ServiceTypeWithRewardItems[] = [];

    // 表示対象: 適用中の支援種別、またはすでに加算・減算項目が存在する支援種別
    const sortedST = [...serviceTypes].sort((a, b) => a.code.localeCompare(b.code));
    const targetServiceTypes = sortedST.filter(
      st => st.is_active || items.some(ri => ri.service_type_id === st.id)
    );

    targetServiceTypes.forEach(st => {
      const stItems = items
        .filter(ri => ri.service_type_id === st.id)
        .sort((a, b) => a.code.localeCompare(b.code));
      list.push({
        ...st,
        rewardItems: stItems
      });
    });

    // どの支援種別にも紐づいていない項目がある場合のフォールバック
    const unassignedItems = items.filter(
      ri => !targetServiceTypes.some(st => st.id === ri.service_type_id)
    );
    if (unassignedItems.length > 0) {
      list.push({
        id: 'UNASSIGNED',
        code: '99',
        name: '未分類',
        description: '',
        is_active: false,
        isUnassigned: true,
        rewardItems: unassignedItems
      });
    }

    return list;
  }, [serviceTypes, items]);

  const columns: Column<ServiceTypeWithRewardItems>[] = [
    { 
      key: 'name', 
      header: TABLE_COLUMNS.SERVICE_TYPE, 
      editable: false, 
      rowType: 'main',
      style: { backgroundColor: '#ffffff' },
      render: (item: ServiceTypeWithRewardItems) => (
        item.isUnassigned ? (
          <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>未分類</span>
        ) : (
          <span style={{ fontWeight: 500 }}>{item.name}</span>
        )
      )
    },
    { 
      key: 'code', 
      header: TABLE_COLUMNS.SERVICE_TYPE_CODE, 
      editable: true, 
      inputType: 'text', 
      rowType: 'sub',
      sortable: false,
      mainRender: (_item, addSubRow) => (
        <Button onClick={addSubRow}>
          ＋ 加算・減算追加
        </Button>
      )
    },
    { 
      key: 'name', 
      header: TABLE_COLUMNS.SERVICE_TYPE_NAME, 
      editable: true, 
      inputType: 'text', 
      rowType: 'sub',
      sortable: false 
    },
    { 
      key: 'item_category', 
      header: TABLE_COLUMNS.TYPE, 
      editable: true, 
      inputType: 'select',
      options: [
        { label: '体制加算', value: 'addition' },
        { label: '体制減算', value: 'subtraction' }
      ],
      rowType: 'sub',
      sortable: false
    },
    { 
      key: 'occurrence_type', 
      header: TABLE_COLUMNS.OCCURRENCE_TYPE, 
      editable: true, 
      inputType: 'select',
      options: [
        { label: '日次発生', value: 'daily' },
        { label: '月次発生', value: 'monthly' }
      ],
      rowType: 'sub',
      sortable: false
    },
    { 
      key: 'unit_value', 
      header: TABLE_COLUMNS.UNIT, 
      editable: true, 
      inputType: 'number', 
      rowType: 'sub',
      sortable: false 
    },
    { 
      key: 'calc_rate', 
      header: '定率算定率[%]', 
      editable: true, 
      inputType: 'number', 
      rowType: 'sub',
      sortable: false 
    },
    { 
      key: 'monthly_limit_count', 
      header: '月間上限回数', 
      editable: true, 
      inputType: 'number', 
      rowType: 'sub',
      sortable: false 
    },
    { 
      key: 'is_active', 
      header: '適用', 
      editable: true, 
      inputType: 'checkbox', 
      rowType: 'sub',
      sortable: false 
    },
  ];

  const handleBatchSave = async (drafts: ServiceTypeWithRewardItems[], deletedIds: string[]) => {
    try {
      const allRewardItems: RewardItem[] = [];
      drafts.forEach(group => {
        (group.rewardItems || []).forEach(item => {
          allRewardItems.push({
            ...item,
            service_type_id: group.isUnassigned ? item.service_type_id : group.id,
            service_type_name: group.name,
          });
        });
      });

      await batchSaveRewardItems(allRewardItems, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  const handleAddSubRow = (parentId: string) => {
    const targetSt = serviceTypes.find(st => st.id === parentId);
    const existingCodes = items.map(i => i.code);
    const prefix = targetSt?.code === '21' ? '5211' : targetSt?.code === '22' ? '5221' : '5000';

    return {
      id: `REW-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      service_type_id: parentId,
      service_type_name: targetSt?.name || '',
      code: generateNextUnifiedCode(existingCodes, prefix),
      name: '',
      item_category: 'addition',
      occurrence_type: 'daily',
      unit_value: 0,
      calc_rate: 0,
      monthly_limit_count: null,
      is_active: true,
    } as RewardItem;
  };

  const loading = loadingItems || loadingServiceTypes;

  if (loading && groupedData.length === 0) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage 
      title="加算・減算"
      data={groupedData} 
      columns={columns} 
      initialSort={{ key: 'code', direction: 'asc' }}
      emptyMessage="登録されている加算・減算項目がありません" 
      onBatchSave={handleBatchSave}
      subItemsKey="rewardItems"
      onAddSubRow={handleAddSubRow}
      canDeleteRow={() => false}
      hideHeader={true}
    />
  );
}

