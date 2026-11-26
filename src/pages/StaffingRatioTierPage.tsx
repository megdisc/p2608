import { useEffect } from 'react';
import { DataPage, type Column, DateDisplay } from '../components';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, WORDS_SYSTEM } from '../constants';
import { useStaffingRatioTiers, type StaffingRatioTierItem } from '../hooks';

export function StaffingRatioTierPage() {
  const { items, loading, fetchStaffingRatioTiers } = useStaffingRatioTiers();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchStaffingRatioTiers().catch(() => {
      showAlert('人員配置基準区分データの取得に失敗しました', 'error');
    });
  }, [fetchStaffingRatioTiers, showAlert]);

  const columns: Column<StaffingRatioTierItem>[] = [
    {
      key: 'service_type_name',
      header: TABLE_COLUMNS.SERVICE_TYPE,
      sortable: true,
      style: { width: '160px' },
    },
    {
      key: 'code',
      header: '区分コード',
      sortable: true,
      style: { width: '150px' },
    },
    {
      key: 'name',
      header: TABLE_COLUMNS.STAFFING_RATIO,
      sortable: true,
      className: 'bg-base-data',
      style: { minWidth: '160px', fontWeight: 'bold', backgroundColor: 'var(--palette-yellow-300)' },
    },
    {
      key: 'ratio_value',
      header: '配置比率',
      sortable: true,
      className: 'bg-base-data',
      style: { width: '130px', textAlign: 'right', backgroundColor: 'var(--palette-yellow-300)' },
      render: (item: StaffingRatioTierItem) => `${item.ratio_value.toFixed(1)} : 1`,
    },
    {
      key: 'display_order',
      header: '表示順',
      sortable: true,
      style: { width: '90px', textAlign: 'center' },
    },
    {
      key: 'valid_from',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_FROM,
      sortable: true,
      style: { width: '130px', textAlign: 'center' },
      render: (item: StaffingRatioTierItem) => item.valid_from || '-',
    },
    {
      key: 'valid_to',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_TO,
      sortable: true,
      style: { width: '130px', textAlign: 'center' },
      render: (item: StaffingRatioTierItem) => item.valid_to ? <DateDisplay value={item.valid_to} /> : '-',
    },
  ];

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <DataPage
      title={WORDS_SYSTEM.STAFFING_RATIO_TIER}
      data={items}
      columns={columns}
      initialSort={{ key: 'display_order', direction: 'asc' }}
      emptyMessage="登録されている人員配置基準区分データがありません"
      hideHeader={true}
      hideAddButton={true}
      hideDeleteColumn={true}
      canDeleteRow={() => false}
    />
  );
}
