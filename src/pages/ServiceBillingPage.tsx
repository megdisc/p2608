import { useState, Fragment } from 'react';
import { MonthInput, Button } from '../components/ui';
import { MESSAGES } from '../constants';
import { useOffice } from '../contexts';
import { useServiceBilling } from '../hooks/useServiceBilling';
import { getCurrentJSTMonth } from '../utils';

export function ServiceBillingPage() {
  const { selectedOfficeId } = useOffice();
  const {
    currentMonth,
    setCurrentMonth,
    loading,
    data,
    isConfirmed,
  } = useServiceBilling(selectedOfficeId);

  const [expandedMemberIds, setExpandedMemberIds] = useState<Record<string, boolean>>({});

  const toggleMemberExpand = (id: string) => {
    setExpandedMemberIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    date.setMonth(date.getMonth() - 1);
    const newY = date.getFullYear();
    const newM = (date.getMonth() + 1).toString().padStart(2, '0');
    setCurrentMonth(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    date.setMonth(date.getMonth() + 1);
    const newY = date.getFullYear();
    const newM = (date.getMonth() + 1).toString().padStart(2, '0');
    setCurrentMonth(`${newY}-${newM}`);
  };

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <>
      <div className="table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}></th>
              <th style={{ width: '100px', textAlign: 'left' }}>利用者番号</th>
              <th style={{ width: '150px', textAlign: 'left' }}>氏名</th>
              <th style={{ width: '80px', textAlign: 'right' }}>利用日数</th>
              <th style={{ width: '100px', textAlign: 'right' }}>基本報酬</th>
              <th style={{ width: '90px', textAlign: 'right' }}>加算合計</th>
              <th style={{ width: '100px', textAlign: 'right' }}>総単位数</th>
              <th style={{ width: '120px', textAlign: 'right' }}>費用総額(10割)</th>
              <th style={{ width: '110px', textAlign: 'right' }}>負担上限月額</th>
              <th style={{ width: '110px', textAlign: 'right' }}>サービス利用料</th>
              <th style={{ width: '120px', textAlign: 'right' }}>訓練等給付費</th>
              <th style={{ textAlign: 'left' }}>備考</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={12} className="empty-message">表示するデータがありません</td>
              </tr>
            ) : (
              data.map(row => {
                const isExpanded = !!expandedMemberIds[row.memberId];

                return (
                  <Fragment key={row.memberId}>
                    <tr 
                      onClick={() => toggleMemberExpand(row.memberId)}
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? 'var(--color-bg-subtle)' : undefined,
                      }}
                      className="hover-row"
                    >
                      <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          transition: 'transform 0.2s', 
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          fontSize: '10px'
                        }}>
                          ▶
                        </span>
                      </td>
                      <td style={{ textAlign: 'left' }}>{row.memberCode}</td>
                      <td style={{ textAlign: 'left', fontWeight: 'var(--weight-heading)' }}>
                        {row.memberName}
                        {row.recipientNumber && (
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>
                            受給者証: {row.recipientNumber}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {row.attendanceDays} 日
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {row.baseRewardUnits.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {row.additionUnits.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'var(--weight-heading)', fontVariantNumeric: 'tabular-nums' }}>
                        {row.totalUnits.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'var(--weight-heading)', fontVariantNumeric: 'tabular-nums' }}>
                        ¥{row.totalCostAmount.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        ¥{row.copaymentLimitAmount.toLocaleString()}
                      </td>
                      <td style={{ 
                        textAlign: 'right', 
                        fontWeight: 'var(--weight-heading)', 
                        color: row.finalCopaymentAmount > 0 ? 'var(--palette-yellow-900)' : 'inherit',
                        fontVariantNumeric: 'tabular-nums' 
                      }}>
                        ¥{row.finalCopaymentAmount.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'var(--weight-heading)', color: 'var(--palette-bluegreen-900)', fontVariantNumeric: 'tabular-nums' }}>
                        ¥{row.benefitBillingAmount.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'left', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
                        {row.remarks}
                      </td>
                    </tr>

                    {/* 行展開：加算・減算の内訳明細 */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: 'var(--color-bg-subtle)' }}>
                        <td></td>
                        <td colSpan={11} style={{ padding: '12px 16px' }}>
                          <div style={{ background: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-heading)', marginBottom: '8px', color: 'var(--color-text-main)' }}>
                              【{row.memberName} 様の算定内訳明細】 (地域単価: ¥{row.unitPrice.toFixed(2)})
                            </div>
                            {row.details.length === 0 ? (
                              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
                                算定された明細項目はありません
                              </div>
                            ) : (
                              <table style={{ width: '100%', fontSize: 'var(--text-caption)', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                                    <th style={{ textAlign: 'left', padding: '4px' }}>項目区分</th>
                                    <th style={{ textAlign: 'left', padding: '4px' }}>サービスコード / 項目名</th>
                                    <th style={{ textAlign: 'right', padding: '4px' }}>単価単位数</th>
                                    <th style={{ textAlign: 'right', padding: '4px' }}>算定回数・日数</th>
                                    <th style={{ textAlign: 'right', padding: '4px' }}>合計単位数</th>
                                    <th style={{ textAlign: 'right', padding: '4px' }}>金額換算(10割)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.details.map((d, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px dashed var(--color-border)' }}>
                                      <td style={{ padding: '6px 4px' }}>
                                        <span style={{ 
                                          padding: '1px 6px', 
                                          borderRadius: '3px', 
                                          fontSize: '10px',
                                          background: d.itemCategory === 'base_reward' ? 'var(--palette-bluegreen-100)' : 'var(--palette-yellow-100)',
                                          color: d.itemCategory === 'base_reward' ? 'var(--palette-bluegreen-800)' : 'var(--palette-yellow-800)'
                                        }}>
                                          {d.itemCategory === 'base_reward' ? '基本報酬' : '加算'}
                                        </span>
                                      </td>
                                      <td style={{ padding: '6px 4px' }}>
                                        {d.serviceCode && <span style={{ color: 'var(--color-text-muted)', marginRight: '6px' }}>[{d.serviceCode}]</span>}
                                        {d.itemName}
                                      </td>
                                      <td style={{ textAlign: 'right', padding: '6px 4px', fontVariantNumeric: 'tabular-nums' }}>
                                        {d.unitValue.toLocaleString()}
                                      </td>
                                      <td style={{ textAlign: 'right', padding: '6px 4px', fontVariantNumeric: 'tabular-nums' }}>
                                        {d.count}
                                      </td>
                                      <td style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
                                        {d.totalItemUnits.toLocaleString()}
                                      </td>
                                      <td style={{ textAlign: 'right', padding: '6px 4px', fontVariantNumeric: 'tabular-nums' }}>
                                        ¥{Math.floor(d.totalItemUnits * row.unitPrice).toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
          {/* 合計フッター */}
          {data.length > 0 && (
            <tfoot>
              <tr style={{ background: 'var(--color-bg-subtle)', fontWeight: 'var(--weight-heading)' }}>
                <td colSpan={3} style={{ textAlign: 'center' }}>
                  合計 ({data.length}名)
                </td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {data.reduce((acc, r) => acc + r.attendanceDays, 0)} 日
                </td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {data.reduce((acc, r) => acc + r.baseRewardUnits, 0).toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {data.reduce((acc, r) => acc + r.additionUnits, 0).toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {data.reduce((acc, r) => acc + r.totalUnits, 0).toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  ¥{data.reduce((acc, r) => acc + r.totalCostAmount, 0).toLocaleString()}
                </td>
                <td style={{ textAlign: 'right' }}>-</td>
                <td style={{ textAlign: 'right', color: 'var(--palette-yellow-900)', fontVariantNumeric: 'tabular-nums' }}>
                  ¥{data.reduce((acc, r) => acc + r.finalCopaymentAmount, 0).toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', color: 'var(--palette-bluegreen-900)', fontVariantNumeric: 'tabular-nums' }}>
                  ¥{data.reduce((acc, r) => acc + r.benefitBillingAmount, 0).toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="action-bar">
        <div className="filter-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button 
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={handlePrevMonth}
            >
              ＜
            </Button>
            <MonthInput 
              value={currentMonth}
              onChange={setCurrentMonth}
              className="date-filter-pill"
              style={{ width: 'auto', minWidth: '140px' }}
            />
            <Button 
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={handleNextMonth}
            >
              ＞
            </Button>
            <Button 
              variant="secondary"
              style={{ padding: '0 12px', height: '28px', fontSize: 'var(--text-caption)' }}
              onClick={() => setCurrentMonth(getCurrentJSTMonth())}
              disabled={currentMonth === getCurrentJSTMonth()}
            >
              今月
            </Button>
            {isConfirmed ? (
              <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-heading)', backgroundColor: 'var(--palette-bluegreen-100)', color: 'var(--palette-bluegreen-800)' }}>
                確定済
              </span>
            ) : (
              <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-heading)', backgroundColor: 'var(--palette-yellow-100)', color: 'var(--palette-yellow-800)' }}>
                暫定
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
