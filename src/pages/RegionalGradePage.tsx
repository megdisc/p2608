import { useEffect } from 'react';
import { DataPage, type Column } from '../components';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS } from '../constants';
import type { RegionalGradeTableItem } from '../types/db';
import { useRegionalGrades } from '../hooks';

export function RegionalGradePage() {
  const { items, loading, fetchRegionalGrades } = useRegionalGrades();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchRegionalGrades().catch((err) => {
      showAlert(err instanceof Error ? err.message : '所在地級数データの取得に失敗しました', 'error');
    });
  }, [fetchRegionalGrades, showAlert]);

  const columns: Column<RegionalGradeTableItem>[] = [
    {
      key: 'prefecture',
      header: TABLE_COLUMNS.PREFECTURE,
      sortable: true,
      style: { width: '120px' },
    },
    {
      key: 'city',
      header: TABLE_COLUMNS.CITY,
      sortable: true,
      style: { minWidth: '160px' },
    },
    {
      key: 'grade',
      header: TABLE_COLUMNS.REGIONAL_GRADE,
      sortable: true,
      style: { width: '120px', textAlign: 'center' },
    },
    {
      key: 'premium_rate',
      header: TABLE_COLUMNS.PREMIUM_RATE,
      sortable: true,
      className: 'quantity',
      style: { width: '160px', textAlign: 'right' },
      render: (item: RegionalGradeTableItem) => {
        const rate = Number(item.premium_rate) || 0;
        return `${(rate * 100).toFixed(1)}% (${rate.toFixed(4)})`;
      },
    },
  ];

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage
      title="所在地級数"
      data={items}
      columns={columns}
      initialSort={{ key: 'city', direction: 'asc' }}
      emptyMessage="登録されている所在地級数データがありません"
      hideHeader={true}
      hideAddButton={true}
      hideDeleteColumn={true}
      canDeleteRow={() => false}
    />
  );
}
