import { useEffect, useMemo, useCallback } from 'react';
import { DataPage, type Column } from '../components';
import type { RewardItem, ServiceTypeItem } from '../hooks';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS } from '../constants';
import { useRewardItems, useServiceTypes } from '../hooks';

type ServiceTypeWithRewardItems = ServiceTypeItem & {
  rewardItems: RewardItem[];
  isUnassigned?: boolean;
};

export function RewardItemPage() {
  const { items, loading: loadingItems, fetchRewardItems } = useRewardItems();
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

  // 支援種別ごとの階層データ構築（加算・減算項目が存在する支援種別をグループ化）
  const groupedData: ServiceTypeWithRewardItems[] = useMemo(() => {
    const list: ServiceTypeWithRewardItems[] = [];

    const sortedST = [...serviceTypes].sort((a, b) => a.code.localeCompare(b.code));
    const targetServiceTypes = sortedST.filter(
      st => items.some(ri => ri.service_type_id === st.id)
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
      rowType: 'sub',
      sortable: false
    },
    { 
      key: 'name', 
      header: TABLE_COLUMNS.SERVICE_TYPE_NAME, 
      rowType: 'sub',
      sortable: false 
    },
    { 
      key: 'item_category', 
      header: TABLE_COLUMNS.TYPE, 
      rowType: 'sub',
      sortable: false,
      render: (item: ServiceTypeWithRewardItems | RewardItem) => {
        const category = (item as RewardItem).item_category;
        const isAddition = category === 'addition' || (category as string) === 'reward_addition';
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
      header: TABLE_COLUMNS.OCCURRENCE_TYPE, 
      rowType: 'sub',
      sortable: false,
      render: (item: ServiceTypeWithRewardItems | RewardItem) => {
        const occurrence = (item as RewardItem).occurrence_type;
        return (
          <span>{occurrence === 'monthly' ? '月次発生' : '日次発生'}</span>
        );
      }
    },
    { 
      key: 'unit_value', 
      header: TABLE_COLUMNS.UNIT, 
      rowType: 'sub',
      sortable: false 
    },
    { 
      key: 'calc_rate', 
      header: '定率算定率[%]', 
      rowType: 'sub',
      sortable: false 
    },
    { 
      key: 'monthly_limit_count', 
      header: '月間上限回数', 
      rowType: 'sub',
      sortable: false 
    },
  ];

  const loading = loadingItems || loadingServiceTypes;

  if (loading && groupedData.length === 0) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage 
      title="加算・減算"
      data={groupedData} 
      columns={columns} 
      initialSort={{ key: 'code', direction: 'asc' }}
      emptyMessage="登録されている加算・減算項目がありません" 
      subItemsKey="rewardItems"
      mergeParentRow={true}
      hideHeader={true}
    />
  );
}


