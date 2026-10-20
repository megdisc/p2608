import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
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

  const columns: Column<ServiceTypeItem>[] = [
    {
      key: 'code',
      header: TABLE_COLUMNS.SERVICE_TYPE_CODE,
      sortable: true,
      style: { width: '140px' },
    },
    {
      key: 'name',
      header: TABLE_COLUMNS.SERVICE_TYPE_NAME,
      sortable: true,
      style: { minWidth: '180px' },
    },
    {
      key: 'personnel_cost_ratio',
      header: TABLE_COLUMNS.PERSONNEL_COST_RATIO,
      sortable: true,
      className: 'quantity',
      style: { width: '160px', textAlign: 'right' },
      render: (item: ServiceTypeItem) => {
        if (item.personnel_cost_ratio === null || item.personnel_cost_ratio === undefined) {
          return '-';
        }
        const ratio = Number(item.personnel_cost_ratio) || 0;
        return (ratio * 100).toFixed(1);
      },
    },
    {
      key: 'description',
      header: TABLE_COLUMNS.DESCRIPTION,
      sortable: true,
      style: { minWidth: '240px' },
    },
  ];

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage 
      title="支援種別"
      data={items} 
      columns={columns} 
      initialSort={{ key: 'code', direction: 'asc' }}
      emptyMessage="登録されている支援種別がありません" 
      hideHeader={true}
      hideAddButton={true}
      hideDeleteColumn={true}
      canDeleteRow={() => false}
    />
  );
}
