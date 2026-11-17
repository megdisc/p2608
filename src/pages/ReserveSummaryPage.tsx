import { useEffect, useState } from 'react';
import { MultiRowHeader, type HeaderCell, YearInput } from '../components/ui';
import { MESSAGES, TABLE_COLUMNS } from '../constants';
import { useAlert, useOffice } from '../contexts';
import { useReserveSummary } from '../hooks';

export function ReserveSummaryPage() {
  const { selectedOfficeId } = useOffice();
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear().toString());
  const { data, loading, fetchSummary } = useReserveSummary(currentYear, selectedOfficeId);
  const { showAlert } = useAlert();
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'period', direction: 'asc' });

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

  const totals = data.reduce(
    (acc, row) => ({
      wageInflow: acc.wageInflow + row.wageInflow,
      wageWithdrawal: acc.wageWithdrawal + row.wageWithdrawal,
      wageNet: acc.wageNet + row.wageNet,
      equipmentInflow: acc.equipmentInflow + row.equipmentInflow,
      equipmentWithdrawal: acc.equipmentWithdrawal + row.equipmentWithdrawal,
      equipmentNet: acc.equipmentNet + row.equipmentNet,
      totalInflow: acc.totalInflow + row.totalInflow,
      totalWithdrawal: acc.totalWithdrawal + row.totalWithdrawal,
      totalNet: acc.totalNet + row.totalNet,
    }),
    {
      wageInflow: 0,
      wageWithdrawal: 0,
      wageNet: 0,
      equipmentInflow: 0,
      equipmentWithdrawal: 0,
      equipmentNet: 0,
      totalInflow: 0,
      totalWithdrawal: 0,
      totalNet: 0,
    }
  );

  const headerRows: HeaderCell[][] = [
    [
      { label: TABLE_COLUMNS.PERIOD, rowSpan: 2, width: '120px', sortKey: 'period' },
      { label: '工賃変動積立金', colSpan: 3 },
      { label: '設備等修繕維持積立金', colSpan: 3 },
      { label: '積立金合計', colSpan: 3 },
    ],
    [
      { label: '繰入' },
      { label: '取崩' },
      { label: '差引増減' },
      { label: '繰入' },
      { label: '取崩' },
      { label: '差引増減' },
      { label: '繰入計' },
      { label: '取崩計' },
      { label: '差引増減計' },
    ]
  ];

  return (
    <div className="summary-page">
      <div className="filter-bar" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
        <YearInput
          value={currentYear}
          onChange={setCurrentYear}
        />
      </div>

      <div className="table-container">
        <table className="inventory-table">
          <MultiRowHeader
            rows={headerRows}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '24px' }}>
                  {MESSAGES.LOADING}
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty-message">表示するデータがありません</td>
              </tr>
            ) : (
              <>
                {sortedData.map(row => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 'bold' }}>{row.period}</td>
                    <td style={{ textAlign: 'right' }}>{row.wageInflow.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{row.wageWithdrawal.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{row.wageNet.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{row.equipmentInflow.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{row.equipmentWithdrawal.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{row.equipmentNet.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{row.totalInflow.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{row.totalWithdrawal.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{row.totalNet.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="total-row" style={{ fontWeight: 'bold', backgroundColor: 'var(--color-bg-subtle)' }}>
                  <td>{TABLE_COLUMNS.TOTAL}</td>
                  <td style={{ textAlign: 'right' }}>{totals.wageInflow.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{totals.wageWithdrawal.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{totals.wageNet.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{totals.equipmentInflow.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{totals.equipmentWithdrawal.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{totals.equipmentNet.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{totals.totalInflow.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{totals.totalWithdrawal.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{totals.totalNet.toLocaleString()}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
