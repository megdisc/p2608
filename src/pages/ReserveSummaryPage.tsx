import { useEffect, useState } from 'react';
import { MultiRowHeader, type HeaderCell, YearInput, Button } from '../components/ui';
import { MESSAGES, TABLE_COLUMNS, BUTTON_LABELS } from '../constants';
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
      { label: TABLE_COLUMNS.RESERVE_WAGE, colSpan: 3 },
      { label: TABLE_COLUMNS.RESERVE_EQUIPMENT, colSpan: 3 },
      { label: TABLE_COLUMNS.RESERVE_TOTAL, colSpan: 3 },
    ],
    [
      { label: TABLE_COLUMNS.RESERVE_INFLOW },
      { label: TABLE_COLUMNS.RESERVE_WITHDRAWAL },
      { label: TABLE_COLUMNS.RESERVE_NET },
      { label: TABLE_COLUMNS.RESERVE_INFLOW },
      { label: TABLE_COLUMNS.RESERVE_WITHDRAWAL },
      { label: TABLE_COLUMNS.RESERVE_NET },
      { label: TABLE_COLUMNS.RESERVE_INFLOW_TOTAL },
      { label: TABLE_COLUMNS.RESERVE_WITHDRAWAL_TOTAL },
      { label: TABLE_COLUMNS.RESERVE_NET_TOTAL },
    ]
  ];

  return (
    <>
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
                    <td className="text-right">{row.wageInflow.toLocaleString()}</td>
                    <td className="text-right">{row.wageWithdrawal.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{row.wageNet.toLocaleString()}</td>
                    <td className="text-right">{row.equipmentInflow.toLocaleString()}</td>
                    <td className="text-right">{row.equipmentWithdrawal.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{row.equipmentNet.toLocaleString()}</td>
                    <td className="text-right">{row.totalInflow.toLocaleString()}</td>
                    <td className="text-right">{row.totalWithdrawal.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{row.totalNet.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="total-row" style={{ fontWeight: 'bold', backgroundColor: 'var(--color-bg-subtle)' }}>
                  <td>{TABLE_COLUMNS.TOTAL}</td>
                  <td className="text-right">{totals.wageInflow.toLocaleString()}</td>
                  <td className="text-right">{totals.wageWithdrawal.toLocaleString()}</td>
                  <td className="text-right">{totals.wageNet.toLocaleString()}</td>
                  <td className="text-right">{totals.equipmentInflow.toLocaleString()}</td>
                  <td className="text-right">{totals.equipmentWithdrawal.toLocaleString()}</td>
                  <td className="text-right">{totals.equipmentNet.toLocaleString()}</td>
                  <td className="text-right">{totals.totalInflow.toLocaleString()}</td>
                  <td className="text-right">{totals.totalWithdrawal.toLocaleString()}</td>
                  <td className="text-right">{totals.totalNet.toLocaleString()}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="action-bar">
        <div className="filter-controls">
          <div className="flex-row">
            <Button 
              className="btn-circle"
              onClick={() => {
                setCurrentYear(String(parseInt(currentYear) - 1));
              }}
            >
              ＜
            </Button>
            <YearInput 
              value={currentYear}
              onChange={setCurrentYear}
              className="date-filter-pill"
              style={{ width: 'auto', minWidth: '100px' }}
            />
            <Button 
              className="btn-circle"
              onClick={() => {
                setCurrentYear(String(parseInt(currentYear) + 1));
              }}
            >
              ＞
            </Button>
            <Button 
              variant="secondary"
              className="btn-compact"
              onClick={() => setCurrentYear(new Date().getFullYear().toString())}
              disabled={currentYear === new Date().getFullYear().toString()}
            >
              {BUTTON_LABELS.THIS_YEAR}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
