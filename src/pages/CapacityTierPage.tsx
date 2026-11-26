import { useEffect } from 'react';
import { DataPage, type Column, DateDisplay } from '../components';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, WORDS_SYSTEM } from '../constants';
import { useCapacityTiers, type CapacityTierItem } from '../hooks';

export function CapacityTierPage() {
  const { items, loading, fetchCapacityTiers } = useCapacityTiers();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchCapacityTiers().catch(() => {
      showAlert('利用定員規模区分データの取得に失敗しました', 'error');
    });
  }, [fetchCapacityTiers, showAlert]);

  const columns: Column<CapacityTierItem>[] = [
    {
      key: 'service_type_name',
      header: TABLE_COLUMNS.SERVICE_TYPE,
      sortable: true,
    },
    {
      key: 'code',
      header: '区分コード',
      sortable: true,
    },
    {
      key: 'name',
      header: TABLE_COLUMNS.CAPACITY_TIER,
      sortable: true,
      className: 'bg-base-data',
      style: { backgroundColor: 'var(--palette-yellow-300)' },
    },
    {
      key: 'min_capacity',
      header: '下限定員(人)',
      sortable: true,
      className: 'bg-base-data',
      style: { textAlign: 'right', backgroundColor: 'var(--palette-yellow-300)' },
      render: (item: CapacityTierItem) => item.min_capacity,
    },
    {
      key: 'max_capacity',
      header: '上限定員(人)',
      sortable: true,
      className: 'bg-base-data',
      style: { textAlign: 'right', backgroundColor: 'var(--palette-yellow-300)' },
      render: (item: CapacityTierItem) => item.max_capacity !== null ? item.max_capacity : '-',
    },
    {
      key: 'valid_from',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_FROM,
      sortable: true,
      style: { textAlign: 'center' },
      render: (item: CapacityTierItem) => <DateDisplay value={item.valid_from} fallback="-" />,
    },
    {
      key: 'valid_to',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_TO,
      sortable: true,
      style: { textAlign: 'center' },
      render: (item: CapacityTierItem) => <DateDisplay value={item.valid_to} fallback="-" />,
    },
  ];

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <DataPage
      title={WORDS_SYSTEM.CAPACITY_TIER}
      data={items}
      columns={columns}
      initialSort={{ key: 'code', direction: 'asc' }}
      emptyMessage="登録されている利用定員規模区分データがありません"
      hideHeader={true}
      hideAddButton={true}
      hideDeleteColumn={true}
      canDeleteRow={() => false}
    />
  );
}
