import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS } from '../constants';
import { useBaseRewards, type BaseRewardItem } from '../hooks';

export function BaseRewardItemPage() {
  const { items, loading, fetchBaseRewards } = useBaseRewards();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchBaseRewards().catch(() => {
      showAlert('基本報酬データの取得に失敗しました', 'error');
    });
  }, [fetchBaseRewards, showAlert]);

  const columns: Column<BaseRewardItem>[] = [
    {
      key: 'service_type_name',
      header: TABLE_COLUMNS.SERVICE_TYPE,
      sortable: true,
      style: { width: '160px' },
      render: (item: BaseRewardItem) => item.service_type_name || '就労継続支援B型',
    },
    {
      key: 'capacity_tier',
      header: TABLE_COLUMNS.CAPACITY_TIER || '定員規模区分',
      sortable: true,
      style: { width: '130px' },
    },
    {
      key: 'staffing_ratio',
      header: TABLE_COLUMNS.STAFFING_RATIO,
      sortable: true,
      style: { width: '130px' },
    },
    {
      key: 'wage_achievement_tier',
      header: TABLE_COLUMNS.WAGE_ACHIEVEMENT_TIER,
      sortable: true,
      style: { minWidth: '190px' },
    },
    {
      key: 'base_units',
      header: TABLE_COLUMNS.BASE_UNITS || '基本単位数',
      sortable: true,
      className: 'quantity',
      style: { width: '130px', textAlign: 'right', fontWeight: 'bold' },
      render: (item: BaseRewardItem) => `${item.base_units.toLocaleString()} 単位`,
    },
    {
      key: 'valid_from',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_FROM || '適用開始日',
      sortable: true,
      style: { width: '130px', textAlign: 'center' },
    },
    {
      key: 'valid_to',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_TO || '適用終了日',
      sortable: true,
      style: { width: '130px', textAlign: 'center' },
      render: (item: BaseRewardItem) => item.valid_to || '-',
    },
  ];

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage
      title="基本報酬"
      data={items}
      columns={columns}
      initialSort={{ key: 'base_units', direction: 'desc' }}
      emptyMessage="登録されている基本報酬データがありません"
      hideHeader={true}
      hideAddButton={true}
      hideDeleteColumn={true}
      canDeleteRow={() => false}
    />
  );
}
