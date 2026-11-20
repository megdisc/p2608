import { useEffect, useState } from 'react';
import { MultiRowHeader, type HeaderCell, YearInput, Button, CurrencyDisplay, MonthDisplay } from '../components/ui';
import { MESSAGES, TABLE_COLUMNS } from '../constants';
import { useAlert, useOffice } from '../contexts';
import { useFinancialSummary } from '../hooks';

export function FinancialSummaryPage({ activityCategory = 'production' }: { activityCategory?: 'production' | 'welfare' }) {
  const { selectedOfficeId } = useOffice();
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear().toString());
  const { data, loading, fetchSummary } = useFinancialSummary(currentYear, activityCategory, selectedOfficeId);
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
      revServiceFee: acc.revServiceFee + row.revServiceFee,
      revDeduction: acc.revDeduction + row.revDeduction,
      revBenefit: acc.revBenefit + row.revBenefit,
      revOther: acc.revOther + row.revOther,
      revTotal: acc.revTotal + row.revTotal,
      expMaterial: acc.expMaterial + row.expMaterial,
      expLaborMember: acc.expLaborMember + row.expLaborMember,
      expLaborOther: acc.expLaborOther + row.expLaborOther,
      expOutsource: acc.expOutsource + row.expOutsource,
      expOther: acc.expOther + row.expOther,
      expWelfareOther: acc.expWelfareOther + row.expWelfareOther,
      expTotal: acc.expTotal + row.expTotal,
      resWage: acc.resWage + row.resWage,
      resEquipment: acc.resEquipment + row.resEquipment,
      resTotal: acc.resTotal + row.resTotal,
    }),
    {
      revSales: 0,
      revServiceFee: 0,
      revDeduction: 0,
      revBenefit: 0,
      revOther: 0,
      revTotal: 0,
      expMaterial: 0,
      expLaborMember: 0,
      expLaborOther: 0,
      expOutsource: 0,
      expOther: 0,
      expWelfareOther: 0,
      expTotal: 0,
      resWage: 0,
      resEquipment: 0,
      resTotal: 0,
    }
  );

  const isWelfare = activityCategory === 'welfare';

  const headerRows: HeaderCell[][] = isWelfare ? [
    [
      { label: TABLE_COLUMNS.PERIOD, rowSpan: 2, width: '120px', sortKey: 'period' },
      { label: TABLE_COLUMNS.REVENUE, colSpan: 4 },
      { label: TABLE_COLUMNS.EXPENSE, colSpan: 2 },
      { label: TABLE_COLUMNS.CATEGORY_DIFFERENCE_AB, rowSpan: 2 },
    ],
    [
      { label: TABLE_COLUMNS.SUBJECT_WELFARE_BENEFIT },
      { label: TABLE_COLUMNS.SUBJECT_WELFARE_USAGE_FEE },
      { label: TABLE_COLUMNS.SUBJECT_WELFARE_EXPENSE_DEDUCTION },
      { label: TABLE_COLUMNS.TOTAL },
      { label: TABLE_COLUMNS.SUBJECT_WELFARE_EXPENSE_OTHER },
      { label: TABLE_COLUMNS.TOTAL },
    ]
  ] : [
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
                <td colSpan={isWelfare ? 8 : 13} className="empty-message">表示するデータがありません</td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {sortedData.map((row) => {
                if (isWelfare) {
                  const surplus = row.revTotal - row.expTotal;
                  return (
                    <tr key={row.id}>
                      <td><MonthDisplay value={row.period} /></td>
                      <td className="text-right"><CurrencyDisplay value={row.revBenefit} /></td>
                      <td className="text-right"><CurrencyDisplay value={row.revServiceFee} /></td>
                      <td className="text-right"><CurrencyDisplay value={row.revDeduction} /></td>
                      <td className="text-right font-heading">
                        <CurrencyDisplay value={row.revTotal} />
                      </td>
                      <td className="text-right"><CurrencyDisplay value={row.expWelfareOther} /></td>
                      <td className="text-right font-heading">
                        <CurrencyDisplay value={row.expTotal} />
                      </td>
                      <td className="text-right font-heading">
                        <CurrencyDisplay value={surplus} />
                      </td>
                    </tr>
                  );
                }

                const surplus = row.revTotal - (row.expTotal + row.resTotal);
                return (
                  <tr key={row.id}>
                    <td><MonthDisplay value={row.period} /></td>
                    <td className="text-right"><CurrencyDisplay value={row.revSales} /></td>
                    <td className="text-right font-heading">
                      <CurrencyDisplay value={row.revTotal} />
                    </td>
                    
                    <td className="text-right"><CurrencyDisplay value={row.expMaterial} /></td>
                    <td className="text-right"><CurrencyDisplay value={row.expLaborMember} /></td>
                    <td className="text-right"><CurrencyDisplay value={row.expLaborOther} /></td>
                    <td className="text-right"><CurrencyDisplay value={row.expOutsource} /></td>
                    <td className="text-right"><CurrencyDisplay value={row.expOther} /></td>
                    <td className="text-right font-heading">
                      <CurrencyDisplay value={row.expTotal} />
                    </td>
                    
                    <td className="text-right"><CurrencyDisplay value={row.resWage} /></td>
                    <td className="text-right"><CurrencyDisplay value={row.resEquipment} /></td>
                    <td className="text-right font-heading">
                      <CurrencyDisplay value={row.resTotal} />
                    </td>

                    <td className="text-right font-heading">
                      <CurrencyDisplay value={surplus} />
                    </td>
                  </tr>
                );
              })}

              {isWelfare ? (
                <tr className="font-heading row-bg-subtle">
                  <td style={{ fontWeight: 'var(--weight-heading)' }}>
                    {currentYear}年累計
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.revBenefit} />
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.revServiceFee} />
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.revDeduction} />
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.revTotal} />
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.expWelfareOther} />
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.expTotal} />
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.revTotal - totals.expTotal} />
                  </td>
                </tr>
              ) : (
                <tr className="font-heading row-bg-subtle">
                  <td style={{ fontWeight: 'var(--weight-heading)' }}>
                    {currentYear}年累計
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.revSales} />
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.revTotal} />
                  </td>
                  
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.expMaterial} />
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.expLaborMember} />
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.expLaborOther} />
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.expOutsource} />
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.expOther} />
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.expTotal} />
                  </td>
                  
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.resWage} />
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.resEquipment} />
                  </td>
                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.resTotal} />
                  </td>

                  <td className="text-right font-heading">
                    <CurrencyDisplay value={totals.revTotal - (totals.expTotal + totals.resTotal)} />
                  </td>
                </tr>
              )}
            </tbody>
          )}
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
              今年
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
