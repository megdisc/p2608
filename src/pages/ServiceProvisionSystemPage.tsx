import { useState, useEffect, Fragment } from 'react';
import { NumberDisplay } from '../components/ui';
import { useServiceProvisionSystem } from '../hooks';
import { MESSAGES } from '../constants';
import { useOffice } from '../contexts';

export function ServiceProvisionSystemPage() {
  const { selectedOfficeId } = useOffice();
  const { data, kpi, loading, fetchSummary } = useServiceProvisionSystem(selectedOfficeId);
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

  if (loading) return <div className="loading-container">{MESSAGES.LOADING}</div>;

  return (
    <div className="report-container">
      {/* 主要KPIサマリカード */}
      <div className="report-kpi-grid">
        <div className="report-card report-card-bluegreen">
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            届出人員配置基準
          </div>
          <div style={{ fontSize: 'var(--text-h2)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-main)' }}>
            {kpi.reportedStaffingRatio}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            契約定員: {kpi.capacity}人
          </div>
        </div>

        <div className="report-card">
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            前年度1日平均利用人数
          </div>
          <div style={{ fontSize: 'var(--text-h2)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-main)' }}>
            <NumberDisplay value={kpi.previousYearAvgMembers.toFixed(1)} useGrouping={false} />
            <span style={{ fontSize: 'var(--text-body)', fontWeight: 'normal', marginLeft: '4px' }}>人/日</span>
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            報酬算定の基準母数
          </div>
        </div>

        <div className="report-card">
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            直近月 常勤換算職員数
          </div>
          <div style={{ fontSize: 'var(--text-h2)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-main)' }}>
            <NumberDisplay value={kpi.latestMonthFte.toFixed(1)} useGrouping={false} />
            <span style={{ fontSize: 'var(--text-body)', fontWeight: 'normal', marginLeft: '4px' }}>人</span>
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            生活支援員・職業指導員
          </div>
        </div>

        <div className="report-card report-card-yellow">
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            直近月 実績人員配置比率
          </div>
          <div style={{ fontSize: 'var(--text-h2)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-main)' }}>
            {kpi.latestMonthRatio.toFixed(1)} : 1
          </div>
          <div style={{ fontSize: 'var(--text-caption)', marginTop: '4px' }}>
            <span className="status-badge-confirmed" style={{ fontSize: '11px', padding: '2px 8px' }}>
              判定: {kpi.latestCompliantTier}
            </span>
          </div>
        </div>
      </div>

      {/* メイン集計テーブル */}
      <div className="table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th style={{ width: '150px', textAlign: 'left' }}>対象期間</th>
              <th className="text-right">開所日数</th>
              <th className="text-right">延べ利用人数</th>
              <th className="text-right">1日平均利用人数</th>
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
                        <span
                          className={annualRow.annualCompliantTierName === '基準未満' ? 'status-badge-warning' : 'status-badge-confirmed'}
                          style={{ fontSize: '11px', padding: '2px 8px' }}
                        >
                          {annualRow.annualCompliantTierName}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>○</td>
                      <td style={{ textAlign: 'center' }}>正常</td>
                    </tr>

                    {/* 各月明細行 */}
                    {isExpanded &&
                      annualRow.monthlyDetails.map(monthRow => (
                        <tr key={monthRow.month} style={{ backgroundColor: 'var(--color-bg-main)' }}>
                          <td className="text-left" style={{ paddingLeft: '28px', color: 'var(--color-text-muted)' }}>
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
                            <span
                              className={monthRow.compliantTierName === '基準未満' ? 'status-badge-warning' : 'status-badge-confirmed'}
                              style={{ fontSize: '11px', padding: '2px 8px' }}
                            >
                              {monthRow.compliantTierName}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {monthRow.hasFullTimeDirectCare ? '○' : <span style={{ color: 'var(--palette-red-500)' }}>×</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {monthRow.capacityExcessStatus === 'normal' ? (
                              '正常'
                            ) : (
                              <span className="status-badge-warning" style={{ fontSize: '11px', padding: '2px 8px' }}>
                                超過減算
                              </span>
                            )}
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
    </div>
  );
}
