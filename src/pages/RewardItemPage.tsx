import { useEffect, useMemo, useCallback } from 'react';
import { DataPage, type Column, DateDisplay } from '../components';
import type { RewardItem } from '../hooks';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS } from '../constants';
import { useRewardItems, useServiceTypes } from '../hooks';

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

  // 支援種別名称のマップとデータ整形（フラット表示用）
  const formattedItems = useMemo(() => {
    const stMap = new Map<string, string>();
    serviceTypes.forEach(st => stMap.set(st.id, st.name));

    return items.map(item => ({
      ...item,
      service_type_name: item.service_type_name || stMap.get(item.service_type_id) || '就労継続支援B型',
    }));
  }, [items, serviceTypes]);

  // 就労継続支援B型判定
  const isBType = (item: RewardItem) => {
    const name = item.service_type_name || '';
    return name.includes('B型') || item.service_type_id === '11111111-0000-0000-0000-000000000001';
  };

  const columns: Column<RewardItem>[] = [
    { 
      key: 'service_type_name', 
      header: TABLE_COLUMNS.SERVICE_TYPE, 
      sortable: true,
    },
    { 
      key: 'code', 
      header: TABLE_COLUMNS.SERVICE_TYPE_CODE, 
      sortable: true,
    },
    { 
      key: 'name', 
      header: TABLE_COLUMNS.SERVICE_TYPE_NAME, 
      sortable: true,
      className: 'bg-base-data',
      style: (item: RewardItem) => ({
        backgroundColor: isBType(item) ? 'var(--palette-yellow-300)' : 'transparent',
      }),
    },
    { 
      key: 'item_category', 
      header: TABLE_COLUMNS.TYPE, 
      sortable: true,
      className: 'bg-base-data',
      style: (item: RewardItem) => ({
        backgroundColor: isBType(item) ? 'var(--palette-yellow-300)' : 'transparent',
      }),
      render: (item: RewardItem) => {
        const isAddition = item.item_category === 'addition' || (item.item_category as string) === 'reward_addition';
        return isAddition ? '体制加算' : '体制減算';
      }
    },
    { 
      key: 'occurrence_type', 
      header: TABLE_COLUMNS.OCCURRENCE_TYPE, 
      sortable: true,
      className: 'bg-base-data',
      style: (item: RewardItem) => ({
        backgroundColor: isBType(item) ? 'var(--palette-yellow-300)' : 'transparent',
      }),
      render: (item: RewardItem) => {
        return item.occurrence_type === 'monthly' ? '月次発生' : '日次発生';
      }
    },
    { 
      key: 'unit_value', 
      header: TABLE_COLUMNS.UNIT, 
      sortable: true,
      className: 'quantity bg-base-data',
      style: (item: RewardItem) => ({
        textAlign: 'right',
        backgroundColor: isBType(item) ? 'var(--palette-yellow-300)' : 'transparent',
      }),
    },
    { 
      key: 'calc_rate', 
      header: TABLE_COLUMNS.CALC_RATE_PERCENT, 
      sortable: true,
      className: 'quantity bg-base-data',
      style: (item: RewardItem) => ({
        textAlign: 'right',
        backgroundColor: isBType(item) ? 'var(--palette-yellow-300)' : 'transparent',
      }),
    },
    { 
      key: 'monthly_limit_count', 
      header: TABLE_COLUMNS.MONTHLY_LIMIT_COUNT, 
      sortable: true,
      className: 'quantity bg-base-data',
      style: (item: RewardItem) => ({
        textAlign: 'right',
        backgroundColor: isBType(item) ? 'var(--palette-yellow-300)' : 'transparent',
      }),
      render: (item: RewardItem) => {
        return item.monthly_limit_count !== null && item.monthly_limit_count !== undefined ? item.monthly_limit_count : '-';
      }
    },
    {
      key: 'valid_from',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_FROM,
      sortable: true,
      style: { textAlign: 'center' },
      render: (item: RewardItem) => (
        <DateDisplay value={item.valid_from} fallback="-" />
      )
    },
    {
      key: 'valid_to',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_TO,
      sortable: true,
      style: { textAlign: 'center' },
      render: (item: RewardItem) => (
        <DateDisplay value={item.valid_to} fallback="-" />
      )
    },
  ];

  const loading = loadingItems || loadingServiceTypes;

  if (loading && formattedItems.length === 0) return <div className="loading-container">Loading...</div>;

  return (
    <DataPage 
      title="加算・減算"
      data={formattedItems} 
      columns={columns} 
      rowClassName={(item: RewardItem) => !isBType(item) ? 'row-muted' : undefined}
      initialSort={{ key: 'code', direction: 'asc' }}
      emptyMessage="登録されている加算・減算項目がありません" 
      hideHeader={true}
      hideAddButton={true}
      hideDeleteColumn={true}
      canDeleteRow={() => false}
    />
  );
}
