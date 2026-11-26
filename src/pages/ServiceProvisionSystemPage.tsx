import { useState, useEffect, Fragment } from 'react';
import { NumberDisplay } from '../components/ui';
import { useServiceProvisionSystem } from '../hooks';
import { MESSAGES, TABLE_COLUMNS } from '../constants';
import { useOffice } from '../contexts';

export function ServiceProvisionSystemPage() {
  const { selectedOfficeId } = useOffice();
  const { data, loading, fetchSummary } = useServiceProvisionSystem(selectedOfficeId);
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // 最新年度を初期状態で展開
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
      [year]: !prev[year],
    }));
  };

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <div className="table-container">
      <table className="inventory-table">
        <thead>
          <tr>
            <th style={{ width: '160px', textAlign: 'left' }}>{TABLE_COLUMNS.PERIOD}</th>
            <th className="text-right">{TABLE_COLUMNS.OPERATING_DAYS}</th>
            <th className="text-right">{TABLE_COLUMNS.TOTAL_UTILIZATION}</th>
            <th className="text-right">{TABLE_COLUMNS.AVG_MEMBERS_PER_DAY}</th>
            <th className="text-right">直接処遇職員FTE</th>
            <th className="text-right">実績配置比率</th>
            <th style={{ textAlign: 'center' }}>適合人員配置基準</th>
            <th style={{ textAlign: 'center' }}>常勤配置要件</th>
            <th style={{ textAlign: 'center' }}>定員超過判定</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={9} className="empty-message">表示するデータがありません</td>
            </tr>
          ) : (
            data.map(annualRow => {
              const isExpanded = !!expandedYears[annualRow.year];

              return (
                <Fragment key={annualRow.year}>
                  {/* 年度集計行 */}
                  <tr
                    onClick={() => toggleYear(annualRow.year)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: 'var(--color-bg-subtle)',
                      fontWeight: 'var(--weight-heading)',
                      userSelect: 'none',
                    }}
                    className="hover-row"
                  >
                    <td className="text-left">
                      <span
                        style={{
                          fontSize: 'var(--text-caption)',
                          marginRight: '8px',
                          display: 'inline-block',
                          transition: 'transform 0.2s ease',
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        }}
                      >
                        ▶
                      </span>
                      {annualRow.yearLabel}
                    </td>
                    <td className="text-right">
                      <NumberDisplay value={annualRow.annualOperatingDays} />
                    </td>
                    <td className="text-right">
                      <NumberDisplay value={annualRow.annualTotalUtilization} />
                    </td>
                    <td className="text-right">
                      <NumberDisplay value={annualRow.annualAvgMembersPerDay.toFixed(1)} useGrouping={false} />
                    </td>
                    <td className="text-right">
                      <NumberDisplay value={annualRow.annualDirectCareFte.toFixed(1)} useGrouping={false} />
                    </td>
                    <td className="text-right">
                      {annualRow.annualActualRatio > 0 ? `${annualRow.annualActualRatio.toFixed(1)} : 1` : '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {annualRow.annualCompliantTierName}
                    </td>
                    <td style={{ textAlign: 'center' }}>○</td>
                    <td style={{ textAlign: 'center' }}>正常</td>
                  </tr>

                  {/* 各月明細行 */}
                  {isExpanded &&
                    annualRow.monthlyDetails.map(monthRow => (
                      <tr key={monthRow.month}>
                        <td style={{ textAlign: 'left', paddingLeft: '32px', color: 'var(--color-text-muted)' }}>
                          <span style={{ color: 'var(--color-border)', marginRight: '6px' }}>└</span>
                          {monthRow.monthLabel}
                        </td>
                        <td className="text-right">
                          <NumberDisplay value={monthRow.operatingDays} />
                        </td>
                        <td className="text-right">
                          <NumberDisplay value={monthRow.totalUtilization} />
                        </td>
                        <td className="text-right">
                          <NumberDisplay value={monthRow.avgMembersPerDay.toFixed(1)} useGrouping={false} />
                        </td>
                        <td className="text-right">
                          <NumberDisplay value={monthRow.directCareFte.toFixed(1)} useGrouping={false} />
                        </td>
                        <td className="text-right">
                          {monthRow.actualRatio > 0 ? `${monthRow.actualRatio.toFixed(1)} : 1` : '-'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {monthRow.compliantTierName}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {monthRow.hasFullTimeDirectCare ? '○' : '×'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {monthRow.capacityExcessStatus === 'normal' ? '正常' : '超過減算'}
                        </td>
                      </tr>
                    ))}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
