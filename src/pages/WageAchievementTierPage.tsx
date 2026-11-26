import { useEffect } from 'react';
import { DataPage, type Column, NumberDisplay, DateDisplay } from '../components';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, WORDS_SYSTEM } from '../constants';
import { useWageAchievementTiers, type WageAchievementTierItem } from '../hooks';

export function WageAchievementTierPage() {
  const { items, loading, fetchWageAchievementTiers } = useWageAchievementTiers();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchWageAchievementTiers().catch(() => {
      showAlert('平均工賃月額達成区分データの取得に失敗しました', 'error');
    });
  }, [fetchWageAchievementTiers, showAlert]);

  const columns: Column<WageAchievementTierItem>[] = [
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
      key: 'tier_rank',
      header: 'ランク',
      sortable: true,
      style: { textAlign: 'center' },
      render: (item: WageAchievementTierItem) => `第${item.tier_rank}区分`,
    },
    {
      key: 'name',
      header: TABLE_COLUMNS.WAGE_ACHIEVEMENT_TIER,
      sortable: true,
      className: 'bg-base-data',
      style: { backgroundColor: 'var(--palette-yellow-300)' },
    },
    {
      key: 'min_wage',
      header: '下限工賃(円)',
      sortable: true,
      className: 'quantity bg-base-data',
      style: { textAlign: 'right', backgroundColor: 'var(--palette-yellow-300)' },
      render: (item: WageAchievementTierItem) => <NumberDisplay value={item.min_wage} />,
    },
    {
      key: 'max_wage',
      header: '上限工賃(円)',
      sortable: true,
      className: 'quantity bg-base-data',
      style: { textAlign: 'right', backgroundColor: 'var(--palette-yellow-300)' },
      render: (item: WageAchievementTierItem) => item.max_wage !== null ? <NumberDisplay value={item.max_wage} /> : '-',
    },
    {
      key: 'valid_from',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_FROM,
      sortable: true,
      style: { textAlign: 'center' },
      render: (item: WageAchievementTierItem) => item.valid_from || '-',
    },
    {
      key: 'valid_to',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_TO,
      sortable: true,
      style: { textAlign: 'center' },
      render: (item: WageAchievementTierItem) => item.valid_to ? <DateDisplay value={item.valid_to} /> : '-',
    },
  ];

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <DataPage
      title={WORDS_SYSTEM.WAGE_ACHIEVEMENT_TIER}
      data={items}
      columns={columns}
      initialSort={{ key: 'code', direction: 'asc' }}
      emptyMessage="登録されている平均工賃月額達成区分データがありません"
      hideHeader={true}
      hideAddButton={true}
      hideDeleteColumn={true}
      canDeleteRow={() => false}
    />
  );
}
