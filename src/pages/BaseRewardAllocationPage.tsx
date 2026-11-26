import { useEffect } from 'react';
import { DataPage, type Column, NumberDisplay, DateDisplay } from '../components';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, WORDS_SYSTEM } from '../constants';
import { useBaseRewardAllocations, type BaseRewardAllocationItem } from '../hooks';

export function BaseRewardAllocationPage() {
  const { items, loading, fetchAllocations } = useBaseRewardAllocations();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchAllocations().catch(() => {
      showAlert('基本報酬割当データの取得に失敗しました', 'error');
    });
  }, [fetchAllocations, showAlert]);

  const columns: Column<BaseRewardAllocationItem>[] = [
    {
      key: 'service_type_name',
      header: TABLE_COLUMNS.SERVICE_TYPE,
      sortable: true,
      style: { width: '160px' },
    },
    {
      key: 'capacity_tier_name',
      header: TABLE_COLUMNS.CAPACITY_TIER,
      sortable: true,
      style: { width: '140px' },
    },
    {
      key: 'staffing_ratio_tier_name',
      header: TABLE_COLUMNS.STAFFING_RATIO,
      sortable: true,
      style: { width: '130px' },
    },
    {
      key: 'wage_achievement_tier_name',
      header: TABLE_COLUMNS.WAGE_ACHIEVEMENT_TIER,
      sortable: true,
      style: { minWidth: '190px' },
    },
    {
      key: 'base_units',
      header: TABLE_COLUMNS.BASE_UNITS,
      sortable: true,
      className: 'quantity',
      style: { width: '130px', textAlign: 'right', fontWeight: 'bold' },
      render: (item: BaseRewardAllocationItem) => <NumberDisplay value={item.base_units} unit=" 単位" />,
    },
    {
      key: 'valid_from',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_FROM,
      sortable: true,
      style: { width: '130px', textAlign: 'center' },
      render: (item: BaseRewardAllocationItem) => item.valid_from || '-',
    },
    {
      key: 'valid_to',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_TO,
      sortable: true,
      style: { width: '130px', textAlign: 'center' },
      render: (item: BaseRewardAllocationItem) => item.valid_to ? <DateDisplay value={item.valid_to} /> : '-',
    },
  ];

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <DataPage
      title={WORDS_SYSTEM.BASE_REWARD_ALLOCATION}
      data={items}
      columns={columns}
      initialSort={{ key: 'base_units', direction: 'desc' }}
      emptyMessage="登録されている基本報酬割当データがありません"
      hideHeader={true}
      hideAddButton={true}
      hideDeleteColumn={true}
      canDeleteRow={() => false}
    />
  );
}
