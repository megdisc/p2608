import { useEffect, useState } from 'react';
import { MultiRowHeader, type HeaderCell } from '../components/ui';
import { PAGE_NAMES, MESSAGES } from '../constants';
import { useAlert } from '../contexts/AlertContext';
import { useFinancialSummary } from '../hooks';

export function FinancialSummaryPage() {
  const { data, loading, fetchSummary } = useFinancialSummary();
  const { showAlert } = useAlert();
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'period', direction: 'desc' });

  useEffect(() => {
    fetchSummary().catch(() => {
      showAlert(MESSAGES.FETCH_ERROR, 'error');
    });
  }, [fetchSummary, showAlert]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current && current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;
    if (a.period < b.period) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a.period > b.period) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const headerRows: HeaderCell[][] = [
    [
      { label: '時期', rowSpan: 2, width: '120px', sortKey: 'period' },
      { label: '収益', colSpan: 3 },
      { label: '費用', colSpan: 5 },
      { label: '積立金', colSpan: 3 },
    ],
    [
      { label: '売上' },
      { label: 'その他収益' },
      { label: '合計' },
      { label: '労務費（利用者工賃）' },
      { label: '労務費（その他）' },
      { label: '外注加工費' },
      { label: 'その他費用' },
      { label: '合計' },
      { label: '工賃変動積立金' },
      { label: '設備等修繕維持積立金' },
      { label: '合計' }
    ]
  ];

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{PAGE_NAMES.FINANCIAL_SUMMARY}</h2>
      </div>

      <div className="table-container">
        <table className="inventory-table">
          <MultiRowHeader rows={headerRows} sortConfig={sortConfig} onSort={handleSort} />
          {sortedData.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={12} className="empty-message">表示するデータがありません</td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {sortedData.map((row) => (
                <tr key={row.id}>
                  <td>{row.period}</td>
                  <td style={{ textAlign: 'right' }}>¥{row.revSales.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>¥{row.revOther.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                    <strong>¥{row.revTotal.toLocaleString()}</strong>
                  </td>
                  
                  <td style={{ textAlign: 'right' }}>¥{row.expLaborMember.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>¥{row.expLaborOther.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>¥{row.expOutsource.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>¥{row.expOther.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                    <strong>¥{row.expTotal.toLocaleString()}</strong>
                  </td>
                  
                  <td style={{ textAlign: 'right' }}>¥{row.resWage.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>¥{row.resEquipment.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                    <strong>¥{row.resTotal.toLocaleString()}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </>
  );
}
