import { useState, Fragment } from 'react';
import { MonthInput, Button } from '../components/ui';
import { MESSAGES } from '../constants';
import { useOffice, useAlert } from '../contexts';
import { useServiceBilling } from '../hooks/useServiceBilling';
import type { Tab } from '../types';

interface ServiceBillingPageProps {
  activeTab?: Tab;
  onTabChange?: (tabId: Tab) => void;
}

export function ServiceBillingPage({ activeTab = 'serviceBillingSummary', onTabChange }: ServiceBillingPageProps) {
  const { selectedOfficeId } = useOffice();
  const { showAlert } = useAlert();
  const {
    currentMonth,
    setCurrentMonth,
    loading,
    data,
    summary,
    rewardBreakdown,
    isConfirmed,
    confirmedAt,
    confirmBilling,
    cancelBilling,
  } = useServiceBilling(selectedOfficeId);

  // 内部状態
  const [internalTab, setInternalTab] = useState<Tab>(activeTab);
  const currentSubTab = onTabChange ? activeTab : internalTab;
  const handleTabClick = (t: Tab) => {
    if (onTabChange) {
      onTabChange(t);
    } else {
      setInternalTab(t);
    }
  };

  const [expandedMemberIds, setExpandedMemberIds] = useState<Record<string, boolean>>({});
  const [expandedRewardKeys, setExpandedRewardKeys] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);

  const toggleMemberExpand = (id: string) => {
    setExpandedMemberIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRewardExpand = (key: string) => {
    setExpandedRewardKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirm = async () => {
    if (!window.confirm(`${currentMonth} のサービス費用および請求実績を確定しますか？\n確定すると月次収支および工賃控除にも実績として反映されます。`)) {
      return;
    }
    try {
      setProcessing(true);
      await confirmBilling(selectedOfficeId);
      showAlert('サービス費用を確定しました。', 'success');
    } catch {
      showAlert('確定処理中にエラーが発生しました。', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!window.confirm(`${currentMonth} の確定状態を解除し、未確定（試算）状態に戻しますか？`)) {
      return;
    }
    try {
      setProcessing(true);
      await cancelBilling(selectedOfficeId);
      showAlert('確定を解除しました。', 'success');
    } catch {
      showAlert('確定解除中にエラーが発生しました。', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      row.memberCode.toLowerCase().includes(term) ||
      row.memberName.toLowerCase().includes(term) ||
      row.memberYomigana.toLowerCase().includes(term) ||
      (row.recipientNumber && row.recipientNumber.includes(term))
    );
  });

  if (loading) return <div>{MESSAGES.LOADING}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 画面共通上部：対象年月・確定ステータス・操作ボタン */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 20px', 
          background: 'var(--color-bg-subtle)', 
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 'var(--weight-heading)', fontSize: 'var(--text-body)' }}>対象月:</span>
            <MonthInput value={currentMonth} onChange={setCurrentMonth} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>確定状態:</span>
            <span 
              style={{ 
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: 'var(--text-caption)', 
                fontWeight: 'var(--weight-heading)',
                backgroundColor: isConfirmed ? 'var(--palette-bluegreen-100)' : 'var(--palette-gray-200)',
                color: isConfirmed ? 'var(--palette-bluegreen-800)' : 'var(--color-text-muted)'
              }}
            >
              {isConfirmed ? '● 月次確定済' : '○ 未確定 (試算中)'}
            </span>
            {isConfirmed && confirmedAt && (
              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
                ({new Date(confirmedAt).toLocaleDateString('ja-JP')} 確定)
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isConfirmed ? (
            <Button 
              variant="secondary" 
              onClick={handleCancelConfirm} 
              disabled={processing}
            >
              {processing ? '解除中...' : '確定を解除'}
            </Button>
          ) : (
            <Button 
              variant="primary" 
              onClick={handleConfirm} 
              disabled={processing}
            >
              {processing ? '確定中...' : '月次サービス費用を確定'}
            </Button>
          )}
        </div>
      </div>

      {/* サブタブUI (渡されていない場合用フォールバック切り替え) */}
      {!onTabChange && (
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          <button 
            className={`nav-button ${currentSubTab === 'serviceBillingSummary' ? 'active' : ''}`}
            onClick={() => handleTabClick('serviceBillingSummary')}
          >
            請求総括
          </button>
          <button 
            className={`nav-button ${currentSubTab === 'serviceBillingMember' ? 'active' : ''}`}
            onClick={() => handleTabClick('serviceBillingMember')}
          >
            利用者別サービス費
          </button>
          <button 
            className={`nav-button ${currentSubTab === 'serviceBillingReward' ? 'active' : ''}`}
            onClick={() => handleTabClick('serviceBillingReward')}
          >
            加算・減算集計
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* タブ1: 請求総括 (事業所サマリ) */}
      {/* ========================================================================= */}
      {currentSubTab === 'serviceBillingSummary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* KPI カードグリッド */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: '16px' 
            }}
          >
            <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)' }}>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>サービス費用総額 (10割)</div>
              <div style={{ fontSize: '24px', fontWeight: 'var(--weight-heading)', color: 'var(--color-text-primary)', marginTop: '6px' }}>
                ¥{summary.totalCostAmount.toLocaleString()}
              </div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                総算定単位: {summary.totalUnits.toLocaleString()} 単位
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--palette-bluegreen-200)', background: 'var(--palette-bluegreen-50)' }}>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--palette-bluegreen-800)' }}>訓練等給付費 (国保連請求 9割)</div>
              <div style={{ fontSize: '24px', fontWeight: 'var(--weight-heading)', color: 'var(--palette-bluegreen-900)', marginTop: '6px' }}>
                ¥{summary.totalBenefitAmount.toLocaleString()}
              </div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--palette-bluegreen-700)', marginTop: '4px' }}>
                事業所入金予定額
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--palette-yellow-200)', background: 'var(--palette-yellow-50)' }}>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--palette-yellow-800)' }}>サービス利用料 (利用者自己負担)</div>
              <div style={{ fontSize: '24px', fontWeight: 'var(--weight-heading)', color: 'var(--palette-yellow-900)', marginTop: '6px' }}>
                ¥{summary.totalCopaymentAmount.toLocaleString()}
              </div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--palette-yellow-700)', marginTop: '4px' }}>
                工賃控除または窓口徴収
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)' }}>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>利用実績指標</div>
              <div style={{ fontSize: '20px', fontWeight: 'var(--weight-heading)', color: 'var(--color-text-primary)', marginTop: '8px' }}>
                {summary.activeMembersCount} 名 / 延べ {summary.totalAttendanceDays} 日
              </div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                1人平均: {summary.averageAttendanceDays} 日
              </div>
            </div>
          </div>

          {/* 単位数の構成内訳バー */}
          <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)' }}>
            <h4 style={{ margin: '0 0 16px 0' }}>単位数構成内訳</h4>
            <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', background: 'var(--color-bg-subtle)' }}>
              <div 
                style={{ 
                  width: summary.totalUnits > 0 ? `${(summary.totalBaseRewardUnits / summary.totalUnits) * 100}%` : '0%', 
                  background: 'var(--palette-bluegreen-400)',
                  transition: 'width 0.3s ease'
                }} 
                title={`基本報酬: ${summary.totalBaseRewardUnits.toLocaleString()} 単位`}
              />
              <div 
                style={{ 
                  width: summary.totalUnits > 0 ? `${(summary.totalAdditionUnits / summary.totalUnits) * 100}%` : '0%', 
                  background: 'var(--palette-yellow-400)',
                  transition: 'width 0.3s ease'
                }} 
                title={`加算合計: ${summary.totalAdditionUnits.toLocaleString()} 単位`}
              />
            </div>
            <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: 'var(--text-caption)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--palette-bluegreen-400)' }} />
                <span>基本報酬単位: <strong>{summary.totalBaseRewardUnits.toLocaleString()}</strong> 単位 ({summary.totalUnits > 0 ? ((summary.totalBaseRewardUnits / summary.totalUnits) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--palette-yellow-400)' }} />
                <span>加算算定単位: <strong>{summary.totalAdditionUnits.toLocaleString()}</strong> 単位 ({summary.totalUnits > 0 ? ((summary.totalAdditionUnits / summary.totalUnits) * 100).toFixed(1) : 0}%)</span>
              </div>
              {summary.totalSubtractionUnits > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--palette-red-400)' }} />
                  <span>減算単位: <strong>-{summary.totalSubtractionUnits.toLocaleString()}</strong> 単位</span>
                </div>
              )}
            </div>
          </div>

          {/* 当月算定加算サマリ */}
          <div style={{ borderRadius: '8px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: 'var(--color-bg-subtle)', fontWeight: 'var(--weight-heading)' }}>
              当月算定された加算・減算一覧
            </div>
            <table className="inventory-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>加算・減算項目名</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>区分</th>
                  <th style={{ textAlign: 'right', width: '100px' }}>単位数/回</th>
                  <th style={{ textAlign: 'right', width: '110px' }}>算定人数</th>
                  <th style={{ textAlign: 'right', width: '110px' }}>算定回数・日数</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>合計単位数</th>
                  <th style={{ textAlign: 'right', width: '140px' }}>概算請求換算額</th>
                </tr>
              </thead>
              <tbody>
                {rewardBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-message">当月算定された加算・減算データはありません</td>
                  </tr>
                ) : (
                  rewardBreakdown.map(item => (
                    <tr key={`${item.serviceCode}_${item.itemName}`}>
                      <td style={{ textAlign: 'left', fontWeight: 'var(--weight-heading)' }}>
                        {item.itemName}
                        {item.serviceCode && (
                          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                            ({item.serviceCode})
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span 
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            background: item.itemCategory === 'base_reward' ? 'var(--palette-bluegreen-100)' : item.itemCategory === 'addition' ? 'var(--palette-yellow-100)' : 'var(--palette-red-100)',
                            color: item.itemCategory === 'base_reward' ? 'var(--palette-bluegreen-800)' : item.itemCategory === 'addition' ? 'var(--palette-yellow-800)' : 'var(--palette-red-800)',
                          }}
                        >
                          {item.itemCategory === 'base_reward' ? '基本報酬' : item.itemCategory === 'addition' ? '加算' : '減算'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.unitValue.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.targetMembersCount} 名</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.totalCount.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'var(--weight-heading)', fontVariantNumeric: 'tabular-nums' }}>
                        {item.totalUnits.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        ¥{item.estimatedAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* タブ2: 利用者別サービス費 (明細一覧) */}
      {/* ========================================================================= */}
      {currentSubTab === 'serviceBillingMember' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 検索・絞り込み */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="利用者名・受給者証番号で検索..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                width: '300px',
                fontSize: 'var(--text-body)'
              }}
            />
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
              ※ 行をクリックすると算定加算の内訳明細が展開されます
            </div>
          </div>

          {/* 利用者別テーブル */}
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
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="empty-message">表示するデータがありません</td>
                  </tr>
                ) : (
                  filteredData.map(row => {
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
                              <div style={{ background: 'var(--color-bg-surface)', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-heading)', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
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
              {filteredData.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'var(--color-bg-subtle)', fontWeight: 'var(--weight-heading)' }}>
                    <td colSpan={3} style={{ textAlign: 'center' }}>
                      合計 ({filteredData.length}名)
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {filteredData.reduce((acc, r) => acc + r.attendanceDays, 0)} 日
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {filteredData.reduce((acc, r) => acc + r.baseRewardUnits, 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {filteredData.reduce((acc, r) => acc + r.additionUnits, 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {filteredData.reduce((acc, r) => acc + r.totalUnits, 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      ¥{filteredData.reduce((acc, r) => acc + r.totalCostAmount, 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>-</td>
                    <td style={{ textAlign: 'right', color: 'var(--palette-yellow-900)', fontVariantNumeric: 'tabular-nums' }}>
                      ¥{filteredData.reduce((acc, r) => acc + r.finalCopaymentAmount, 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--palette-bluegreen-900)', fontVariantNumeric: 'tabular-nums' }}>
                      ¥{filteredData.reduce((acc, r) => acc + r.benefitBillingAmount, 0).toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* タブ3: 加算・減算集計 (項目別実績) */}
      {/* ========================================================================= */}
      {currentSubTab === 'serviceBillingReward' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
            ※ 項目をクリックすると、算定対象となった利用者一覧が展開されます
          </div>

          <div className="table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}></th>
                  <th style={{ width: '120px', textAlign: 'center' }}>区分</th>
                  <th style={{ width: '120px', textAlign: 'left' }}>サービスコード</th>
                  <th style={{ textAlign: 'left' }}>加算・減算項目名</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>単位数/回</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>対象利用者数</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>算定回数・日数</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>合計単位数</th>
                  <th style={{ width: '150px', textAlign: 'right' }}>概算請求換算額</th>
                </tr>
              </thead>
              <tbody>
                {rewardBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty-message">加算・減算の算定データがありません</td>
                  </tr>
                ) : (
                  rewardBreakdown.map(item => {
                    const key = `${item.serviceCode}_${item.itemName}`;
                    const isExpanded = !!expandedRewardKeys[key];

                    return (
                      <Fragment key={key}>
                        <tr 
                          onClick={() => toggleRewardExpand(key)}
                          style={{ cursor: 'pointer', backgroundColor: isExpanded ? 'var(--color-bg-subtle)' : undefined }}
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
                          <td style={{ textAlign: 'center' }}>
                            <span 
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                background: item.itemCategory === 'base_reward' ? 'var(--palette-bluegreen-100)' : item.itemCategory === 'addition' ? 'var(--palette-yellow-100)' : 'var(--palette-red-100)',
                                color: item.itemCategory === 'base_reward' ? 'var(--palette-bluegreen-800)' : item.itemCategory === 'addition' ? 'var(--palette-yellow-800)' : 'var(--palette-red-800)',
                              }}
                            >
                              {item.itemCategory === 'base_reward' ? '基本報酬' : item.itemCategory === 'addition' ? '加算' : '減算'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'left', color: 'var(--color-text-muted)' }}>{item.serviceCode || '-'}</td>
                          <td style={{ textAlign: 'left', fontWeight: 'var(--weight-heading)' }}>{item.itemName}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.unitValue.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.targetMembersCount} 名</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.totalCount.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'var(--weight-heading)', fontVariantNumeric: 'tabular-nums' }}>
                            {item.totalUnits.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            ¥{item.estimatedAmount.toLocaleString()}
                          </td>
                        </tr>

                        {/* 行展開：対象利用者バッジ一覧 */}
                        {isExpanded && (
                          <tr style={{ backgroundColor: 'var(--color-bg-subtle)' }}>
                            <td></td>
                            <td colSpan={8} style={{ padding: '12px 16px' }}>
                              <div style={{ background: 'var(--color-bg-surface)', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-heading)', marginBottom: '8px' }}>
                                  【算定対象の利用者一覧 ({item.memberNames.length}名)】
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {item.memberNames.map(name => (
                                    <span 
                                      key={name} 
                                      style={{ 
                                        padding: '4px 10px', 
                                        borderRadius: '12px', 
                                        background: 'var(--color-bg-subtle)', 
                                        border: '1px solid var(--color-border)',
                                        fontSize: 'var(--text-caption)'
                                      }}
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
