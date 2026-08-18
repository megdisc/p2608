import { useEffect, useState } from 'react';
import { MultiRowHeader, type HeaderCell, YearInput, Button } from '../components/ui';
import { MESSAGES, TABLE_COLUMNS } from '../constants';
import { useAlert } from '../contexts/AlertContext';
import { useFinancialSummary } from '../hooks';

export function FinancialSummaryPage() {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear().toString());
  const { data, loading, fetchSummary } = useFinancialSummary(currentYear);
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
      revSales: acc.revSales + row.revSales,
      revTotal: acc.revTotal + row.revTotal,
      expMaterial: acc.expMaterial + row.expMaterial,
      expLaborMember: acc.expLaborMember + row.expLaborMember,
      expLaborOther: acc.expLaborOther + row.expLaborOther,
      expOutsource: acc.expOutsource + row.expOutsource,
      expOther: acc.expOther + row.expOther,
      expTotal: acc.expTotal + row.expTotal,
      resWage: acc.resWage + row.resWage,
      resEquipment: acc.resEquipment + row.resEquipment,
      resTotal: acc.resTotal + row.resTotal,
    }),
    {
      revSales: 0,
      revTotal: 0,
      expMaterial: 0,
      expLaborMember: 0,
      expLaborOther: 0,
      expOutsource: 0,
      expOther: 0,
      expTotal: 0,
      resWage: 0,
      resEquipment: 0,
      resTotal: 0,
    }
  );

  const headerRows: HeaderCell[][] = [
    [
      { label: TABLE_COLUMNS.PERIOD, rowSpan: 2, width: '120px', sortKey: 'period' },
      { label: TABLE_COLUMNS.REVENUE, colSpan: 2 },
      { label: TABLE_COLUMNS.EXPENSE, colSpan: 6 },
      { label: TABLE_COLUMNS.RESERVE, colSpan: 3 },
      { label: TABLE_COLUMNS.SURPLUS, rowSpan: 2 },
    ],
    [
      { label: TABLE_COLUMNS.SUBJECT_REVENUE_SALES },
      { label: TABLE_COLUMNS.TOTAL },
      { label: TABLE_COLUMNS.SUBJECT_EXPENSE_MATERIAL },
      { label: TABLE_COLUMNS.SUBJECT_EXPENSE_LABOR_MEMBER },
      { label: TABLE_COLUMNS.SUBJECT_EXPENSE_LABOR_OTHER },
      { label: TABLE_COLUMNS.SUBJECT_EXPENSE_OUTSOURCE },
      { label: TABLE_COLUMNS.SUBJECT_EXPENSE_OTHER },
      { label: TABLE_COLUMNS.TOTAL },
      { label: TABLE_COLUMNS.SUBJECT_RESERVE_WAGE },
      { label: TABLE_COLUMNS.SUBJECT_RESERVE_EQUIPMENT },
      { label: TABLE_COLUMNS.TOTAL }
    ]
  ];

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <>

      <div className="table-container">
        <table className="inventory-table">
          <MultiRowHeader rows={headerRows} sortConfig={sortConfig} onSort={handleSort} />
          {sortedData.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={13} className="empty-message">表示するデータがありません</td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {sortedData.map((row) => {
                const surplus = row.revTotal - (row.expTotal + row.resTotal);
                return (
                  <tr key={row.id}>
                    <td>{row.period}</td>
                    <td style={{ textAlign: 'right' }}>¥{row.revSales.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                      <strong>¥{row.revTotal.toLocaleString()}</strong>
                    </td>
                    
                    <td style={{ textAlign: 'right' }}>¥{row.expMaterial.toLocaleString()}</td>
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

                    <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                      <strong>¥{surplus.toLocaleString()}</strong>
                    </td>
                  </tr>
                );
              })}
              <tr style={{ fontWeight: 'bold', backgroundColor: 'var(--color-bg-subtle, #f9fafb)' }}>
                <td style={{ fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  <strong>{currentYear}年累計</strong>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  <strong>¥{totals.revSales.toLocaleString()}</strong>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  <strong>¥{totals.revTotal.toLocaleString()}</strong>
                </td>
                
                <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  <strong>¥{totals.expMaterial.toLocaleString()}</strong>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  <strong>¥{totals.expLaborMember.toLocaleString()}</strong>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  <strong>¥{totals.expLaborOther.toLocaleString()}</strong>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  <strong>¥{totals.expOutsource.toLocaleString()}</strong>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  <strong>¥{totals.expOther.toLocaleString()}</strong>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  <strong>¥{totals.expTotal.toLocaleString()}</strong>
                </td>
                
                <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  <strong>¥{totals.resWage.toLocaleString()}</strong>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  <strong>¥{totals.resEquipment.toLocaleString()}</strong>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  <strong>¥{totals.resTotal.toLocaleString()}</strong>
                </td>

                <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor' }}>
                  <strong>¥{(totals.revTotal - (totals.expTotal + totals.resTotal)).toLocaleString()}</strong>
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      <div className="action-bar">
        <div className="filter-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button 
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                setCurrentYear(String(parseInt(currentYear) + 1));
              }}
            >
              ＞
            </Button>
            <Button 
              variant="secondary"
              style={{ padding: '0 12px', height: '28px', fontSize: 'var(--text-caption)' }}
              onClick={() => setCurrentYear(new Date().getFullYear().toString())}
              disabled={currentYear === new Date().getFullYear().toString()}
            >
              今年
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
