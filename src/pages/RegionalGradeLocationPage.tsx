import { useEffect } from 'react';
import { DataPage, type Column, DateDisplay } from '../components';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, WORDS_SYSTEM } from '../constants';
import { useRegionalGradeLocations, type RegionalGradeLocationItem } from '../hooks';

export function RegionalGradeLocationPage() {
  const { items, loading, fetchLocations } = useRegionalGradeLocations();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchLocations().catch(() => {
      showAlert('所在地データの取得に失敗しました', 'error');
    });
  }, [fetchLocations, showAlert]);

  const columns: Column<RegionalGradeLocationItem>[] = [
    {
      key: 'prefecture',
      header: TABLE_COLUMNS.PREFECTURE,
      sortable: true,
      className: 'bg-base-data',
      style: { width: '160px', backgroundColor: 'var(--palette-yellow-300)' },
    },
    {
      key: 'city',
      header: TABLE_COLUMNS.CITY,
      sortable: true,
      className: 'bg-base-data',
      style: { backgroundColor: 'var(--palette-yellow-300)' },
    },
    {
      key: 'grade',
      header: TABLE_COLUMNS.REGIONAL_GRADE,
      sortable: true,
      style: { width: '140px', textAlign: 'center' },
    },
    {
      key: 'valid_from',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_FROM,
      sortable: true,
      style: { width: '130px', textAlign: 'center' },
      render: (item: RegionalGradeLocationItem) => item.valid_from || '-',
    },
    {
      key: 'valid_to',
      header: TABLE_COLUMNS.SERVICE_TYPE_VALID_TO,
      sortable: true,
      style: { width: '130px', textAlign: 'center' },
      render: (item: RegionalGradeLocationItem) => item.valid_to ? <DateDisplay value={item.valid_to} /> : '-',
    },
  ];

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <DataPage
      title={WORDS_SYSTEM.REGIONAL_GRADE_LOCATION}
      data={items}
      columns={columns}
      initialSort={{ key: 'city', direction: 'asc' }}
      emptyMessage="登録されている所在地データがありません"
      hideHeader={true}
      hideAddButton={true}
      hideDeleteColumn={true}
      canDeleteRow={() => false}
    />
  );
}
