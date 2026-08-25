import { useState, useEffect } from 'react';
import { useAverageWageSummary } from '../hooks/useAverageWageSummary';
import { MESSAGES } from '../constants';

export function AverageWagePage() {
  const { data, loading, fetchSummary } = useAverageWageSummary();
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Default expand latest year once data is loaded
  useEffect(() => {
    if (data.length > 0) {
      setExpandedYears(prev => {
        if (Object.keys(prev).length === 0) {
          return { [data[0].year]: true };
        }
        return prev;
      });
    }
  }, [data]);

  const toggleYear = (year: string) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <div className="table-container">
      <table className="inventory-table">
        <thead>
          <tr>
            <th style={{ width: '160px', textAlign: 'left' }}>時期</th>
            <th style={{ textAlign: 'right' }}>平均工賃</th>
            <th style={{ textAlign: 'right' }}>工賃支払総額</th>
            <th style={{ textAlign: 'right' }}>開所日数</th>
            <th style={{ textAlign: 'right' }}>延べ利用人数</th>
            <th style={{ textAlign: 'right' }}>1日平均利用人数</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-message">表示するデータがありません</td>
            </tr>
          ) : (
            data.map(annualRow => {
              const isExpanded = !!expandedYears[annualRow.year];

              return (
                <tbody key={annualRow.year} style={{ display: 'contents' }}>
                  {/* Annual Summary Row */}
                  <tr 
                    onClick={() => toggleYear(annualRow.year)}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: 'var(--color-bg-subtle, #f9fafb)',
                      fontWeight: 'bold',
                      userSelect: 'none'
                    }}
                    className="hover-row"
                  >
                    <td style={{ textAlign: 'left' }}>
                      <span style={{ 
                        fontSize: '12px', 
                        marginRight: '8px',
                        display: 'inline-block',
                        transition: 'transform 0.2s ease',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                      }}>
                        ▶
                      </span>
                      {annualRow.yearLabel}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', WebkitTextStroke: '0.5px currentColor', fontVariantNumeric: 'tabular-nums' }}>
                      ¥{Math.round(annualRow.avgMonthlyWage).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      ¥{annualRow.totalWage.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {annualRow.operatingDays}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {annualRow.totalUtilization.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {annualRow.avgMembersPerDay.toFixed(1)}
                    </td>
                  </tr>

                  {/* Monthly Detail Rows (Accordion Expansion) */}
                  {isExpanded && annualRow.monthlyDetails.map(monthDetail => (
                    <tr key={monthDetail.month}>
                      <td style={{ textAlign: 'left', paddingLeft: '32px', color: 'var(--color-text-muted, #666)' }}>
                        <span style={{ color: 'var(--color-border, #ccc)', marginRight: '6px' }}>└</span>
                        {monthDetail.monthLabel}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        ¥{Math.round(monthDetail.avgMonthlyWage).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        ¥{monthDetail.totalWage.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {monthDetail.operatingDays}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {monthDetail.totalUtilization.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {monthDetail.avgMembersPerDay.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
