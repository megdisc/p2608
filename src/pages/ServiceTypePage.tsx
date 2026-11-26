import { useEffect } from 'react';
import { DataPage, type Column, DateDisplay } from '../components';
import type { ServiceTypeItem } from '../hooks';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS } from '../constants';
import { useServiceTypes } from '../hooks';

export function ServiceTypePage() {
  const { items, loading, fetchServiceTypes } = useServiceTypes();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchServiceTypes().catch(() => {
      showAlert('支援種別データの取得に失敗しました', 'error');
    });
  }, [fetchServiceTypes, showAlert]);

  const isBType = (item: ServiceTypeItem) => item.name === '就労継続支援B型' || item.code === '21';

  const columns: Column<ServiceTypeItem>[] = [
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
      style: (item: ServiceTypeItem) => ({
        backgroundColor: isBType(item) ? 'var(--palette-yellow-300)' : 'transparent',
      }),
    },
    {
      key: 'personnel_cost_ratio',
      header: TABLE_COLUMNS.PERSONNEL_COST_RATIO,
      sortable: true,
      className: 'quantity bg-base-data',
      style: (item: ServiceTypeItem) => ({
        textAlign: 'right',
        backgroundColor: isBType(item) ? 'var(--palette-yellow-300)' : 'transparent',
      }),
      render: (item: ServiceTypeItem) => {
        if (item.personnel_cost_ratio === null || item.personnel_cost_ratio === undefined) {
          return '-';
        }
        const ratio = Number(item.personnel_cost_ratio) || 0;
        return (ratio * 100).toFixed(1);
      },
    },
    {
      key: 'valid_from',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_FROM,
      sortable: true,
      style: { textAlign: 'center' },
      render: (item: ServiceTypeItem) => <DateDisplay value={item.valid_from} fallback="-" />,
    },
    {
      key: 'valid_to',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_TO,
      sortable: true,
      style: { textAlign: 'center' },
      render: (item: ServiceTypeItem) => <DateDisplay value={item.valid_to} fallback="-" />,
    },
  ];

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <DataPage 
      title="支援種別"
      data={items} 
      columns={columns} 
      rowClassName={(item: ServiceTypeItem) => !isBType(item) ? 'row-muted' : undefined}
      initialSort={{ key: 'code', direction: 'asc' }}
      emptyMessage="登録されている支援種別がありません" 
      hideHeader={true}
      hideAddButton={true}
      hideDeleteColumn={true}
      canDeleteRow={() => false}
    />
  );
}
