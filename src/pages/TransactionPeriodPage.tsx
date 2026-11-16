import { useState, useEffect, useMemo } from 'react';
import { Button, Tooltip, MonthInput } from '../components/ui';
import { MESSAGES, BUTTON_LABELS, WORDS_PROJECT } from '../constants';
import { getCurrentJSTMonth, calcWagePaymentDate } from '../utils';
import { useAlert, useOffice } from '../contexts';
import { useProgressRecords } from '../hooks/useProgressRecords';
import { useMonthlyFinancials } from '../hooks/useMonthlyFinancials';
import { useWageClosingSettings } from '../hooks';
import { supabase } from '../lib';

interface TransactionRowItem {
  id: string; // financial record id or unique row key
  projectId: string;
  projectCode: string;
  projectName: string;
  isOngoing: boolean;
  categoryType: 'revenue' | 'expense' | 'reserve';
  categoryLabel: string;
  subject: string;
  summary: string;
  amount: number;
  transactionDate: string; // YYYY-MM-DD
  isLaborMember: boolean; // 労務費（利用者工賃）かどうか
  isAutoCalculated: boolean;
}

export function TransactionPeriodPage() {
  const {
    displayData: progressRecords,
    loading: loadingProgress,
    currentMonth,
    setCurrentMonth,
    fetchRecords: fetchProgress,
    fetchMasters: fetchProgressMasters,
  } = useProgressRecords();

  const {
    financials,
    loadingFinancials,
    fetchFinancials,
  } = useMonthlyFinancials();

  const { showAlert } = useAlert();
  const { selectedOfficeId } = useOffice();

  // 工賃基準日設定
  const { items: closingSettings, fetchWageClosingSettings } = useWageClosingSettings();

  // 取引時期の日付ドラフト (月ごとのキー: month -> rowId -> YYYY-MM-DD)
  const [monthlyDateDrafts, setMonthlyDateDrafts] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  const dateDrafts = useMemo(() => monthlyDateDrafts[currentMonth] || {}, [monthlyDateDrafts, currentMonth]);

  useEffect(() => {
    fetchProgressMasters(selectedOfficeId).catch(console.error);
    fetchWageClosingSettings(selectedOfficeId).catch(console.error);
    fetchProgress(currentMonth).catch(console.error);
    fetchFinancials(currentMonth, selectedOfficeId).catch(console.error);
  }, [currentMonth, selectedOfficeId, fetchProgress, fetchProgressMasters, fetchFinancials, fetchWageClosingSettings]);

  // 工賃支給日の自動算出（労務費用）
  const autoWagePaymentDate = useMemo(() => {
    const currentSetting = (selectedOfficeId && selectedOfficeId !== 'all')
      ? closingSettings.find(s => s.office_id === selectedOfficeId) || closingSettings[0]
      : closingSettings[0];
    return calcWagePaymentDate(currentMonth, currentSetting);
  }, [currentMonth, closingSettings, selectedOfficeId]);

  // 当月の案件および勘定科目行を構築
  const displayRows = useMemo(() => {
    // 案件ごとにグループ化
    interface ProjectGroup {
      id: string;
      code: string;
      name: string;
      isOngoing: boolean;
    }
    const projectMap = new Map<string, ProjectGroup>();
    progressRecords.forEach(r => {
      if (!projectMap.has(r.projectId)) {
        projectMap.set(r.projectId, {
          id: r.projectId,
          code: r.projectCode,
          name: r.projectName,
          isOngoing: r.projectType === 'ongoing',
        });
      }
    });

    const rows: TransactionRowItem[] = [];

    projectMap.forEach((proj, pid) => {
      const projFins = financials.filter(f => f.project_id === pid);

      // 1. 就労支援事業収益（売上）
      const revFins = projFins.filter(f => f.type === 'revenue');
      if (revFins.length > 0) {
        revFins.forEach(f => {
          rows.push({
            id: f.id,
            projectId: pid,
            projectCode: proj.code,
            projectName: proj.name,
            isOngoing: proj.isOngoing,
            categoryType: 'revenue',
            categoryLabel: '就労支援事業収益',
            subject: f.subject || '就労支援事業収益',
            summary: f.remarks || '売上請求',
            amount: Number(f.amount) || 0,
            transactionDate: f.target_period || `${currentMonth}-01`,
            isLaborMember: false,
            isAutoCalculated: false,
          });
        });
      } else {
        rows.push({
          id: `TEMP-REV-${pid}`,
          projectId: pid,
          projectCode: proj.code,
          projectName: proj.name,
          isOngoing: proj.isOngoing,
          categoryType: 'revenue',
          categoryLabel: '就労支援事業収益',
          subject: '就労支援事業収益',
          summary: '売上請求',
          amount: 0,
          transactionDate: `${currentMonth}-01`,
          isLaborMember: false,
          isAutoCalculated: false,
        });
      }

      // 2. 製造原価・費用（材料費、経費、外注加工費、労務費）
      // 材料費
      const matFin = projFins.find(f => f.type === 'expense' && f.subject === WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL);
      rows.push({
        id: matFin?.id || `TEMP-MAT-${pid}`,
        projectId: pid,
        projectCode: proj.code,
        projectName: proj.name,
        isOngoing: proj.isOngoing,
        categoryType: 'expense',
        categoryLabel: '就労支援事業費用',
        subject: WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL,
        summary: matFin?.remarks || '材料費購入・払出',
        amount: Number(matFin?.amount) || 0,
        transactionDate: matFin?.target_period || `${currentMonth}-01`,
        isLaborMember: false,
        isAutoCalculated: false,
      });

      // 経費
      const othFin = projFins.find(f => f.type === 'expense' && f.subject === WORDS_PROJECT.SUBJECT_EXPENSE_OTHER);
      rows.push({
        id: othFin?.id || `TEMP-OTH-${pid}`,
        projectId: pid,
        projectCode: proj.code,
        projectName: proj.name,
        isOngoing: proj.isOngoing,
        categoryType: 'expense',
        categoryLabel: '就労支援事業費用',
        subject: WORDS_PROJECT.SUBJECT_EXPENSE_OTHER,
        summary: othFin?.remarks || '諸経費発生',
        amount: Number(othFin?.amount) || 0,
        transactionDate: othFin?.target_period || `${currentMonth}-01`,
        isLaborMember: false,
        isAutoCalculated: false,
      });

      // 外注加工費
      const outFins = projFins.filter(f => f.type === 'expense' && (f.subject === WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE || f.subject.startsWith('外注')));
      if (outFins.length > 0) {
        outFins.forEach(f => {
          rows.push({
            id: f.id,
            projectId: pid,
            projectCode: proj.code,
            projectName: proj.name,
            isOngoing: proj.isOngoing,
            categoryType: 'expense',
            categoryLabel: '就労支援事業費用',
            subject: WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE,
            summary: f.remarks || '外注費支払',
            amount: Number(f.amount) || 0,
            transactionDate: f.target_period || `${currentMonth}-01`,
            isLaborMember: false,
            isAutoCalculated: false,
          });
        });
      } else {
        rows.push({
          id: `TEMP-OUT-${pid}`,
          projectId: pid,
          projectCode: proj.code,
          projectName: proj.name,
          isOngoing: proj.isOngoing,
          categoryType: 'expense',
          categoryLabel: '就労支援事業費用',
          subject: WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE,
          summary: '外注費支払',
          amount: 0,
          transactionDate: `${currentMonth}-01`,
          isLaborMember: false,
          isAutoCalculated: false,
        });
      }

      // 労務費（利用者工賃以外）
      const staffFin = projFins.find(f => f.type === 'expense' && (f.subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER || f.subject.includes('利用者工賃以外')));
      rows.push({
        id: staffFin?.id || `TEMP-STAFF-${pid}`,
        projectId: pid,
        projectCode: proj.code,
        projectName: proj.name,
        isOngoing: proj.isOngoing,
        categoryType: 'expense',
        categoryLabel: '就労支援事業費用',
        subject: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER,
        summary: staffFin?.remarks || '職員等労務費',
        amount: Number(staffFin?.amount) || 0,
        transactionDate: staffFin?.target_period || `${currentMonth}-01`,
        isLaborMember: false,
        isAutoCalculated: false,
      });

      // 労務費（利用者工賃） ★工賃支給日を自動算出してデフォルト表示、変更不可（disabled）★
      const memberFin = projFins.find(f => f.type === 'expense' && (f.subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER || f.subject.includes('利用者工賃')));
      rows.push({
        id: memberFin?.id || `TEMP-MEMBER-${pid}`,
        projectId: pid,
        projectCode: proj.code,
        projectName: proj.name,
        isOngoing: proj.isOngoing,
        categoryType: 'expense',
        categoryLabel: '就労支援事業費用',
        subject: WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER,
        summary: '工賃支給日（基準日設定より自動算出・変更不可）',
        amount: Number(memberFin?.amount) || 0,
        transactionDate: autoWagePaymentDate, // 自動算出された工賃支給日
        isLaborMember: true, // 変更不可フラグ
        isAutoCalculated: true,
      });

      // 3. 積立金
      const resFins = projFins.filter(f => f.type === 'reserve');
      if (resFins.length > 0) {
        resFins.forEach(f => {
          rows.push({
            id: f.id,
            projectId: pid,
            projectCode: proj.code,
            projectName: proj.name,
            isOngoing: proj.isOngoing,
            categoryType: 'reserve',
            categoryLabel: '積立金',
            subject: f.subject || '積立金',
            summary: f.remarks || '案件積立金',
            amount: Number(f.amount) || 0,
            transactionDate: f.target_period || `${currentMonth}-01`,
            isLaborMember: false,
            isAutoCalculated: false,
          });
        });
      } else {
        rows.push({
          id: `TEMP-RES-${pid}`,
          projectId: pid,
          projectCode: proj.code,
          projectName: proj.name,
          isOngoing: proj.isOngoing,
          categoryType: 'reserve',
          categoryLabel: '積立金',
          subject: '工賃変動積立金',
          summary: '案件積立金',
          amount: 0,
          transactionDate: `${currentMonth}-01`,
          isLaborMember: false,
          isAutoCalculated: false,
        });
      }
    });

    return rows;
  }, [progressRecords, financials, currentMonth, autoWagePaymentDate]);

  const handleDateChange = (id: string, newDate: string) => {
    setMonthlyDateDrafts(prev => ({
      ...prev,
      [currentMonth]: {
        ...(prev[currentMonth] || {}),
        [id]: newDate,
      },
    }));
  };

  const isModified = useMemo(() => {
    return Object.entries(dateDrafts).some(([id, date]) => {
      const row = displayRows.find(r => r.id === id);
      return row && row.transactionDate !== date;
    });
  }, [dateDrafts, displayRows]);

  const handleCancel = () => {
    setMonthlyDateDrafts(prev => {
      const next = { ...prev };
      delete next[currentMonth];
      return next;
    });
  };

  const handleBatchSave = async () => {
    try {
      setSaving(true);

      // 1. financial_records の target_period 更新
      const updatePromises = Object.entries(dateDrafts).map(async ([rowId, date]) => {
        const row = displayRows.find(r => r.id === rowId);
        if (!row || row.isLaborMember) return; // 利用者工賃は固定

        if (!rowId.startsWith('TEMP-')) {
          return supabase
            .from('financial_records')
            .update({ target_period: date })
            .eq('id', rowId);
        } else if (row.amount > 0) {
          return supabase
            .from('financial_records')
            .insert({
              office_id: selectedOfficeId || '22222222-2222-2222-2222-222222222222',
              target_period: date,
              project_id: row.projectId,
              type: row.categoryType,
              activity_category: 'production',
              cost_category: 'manufacturing',
              subject: row.subject,
              amount: row.amount,
              remarks: row.summary,
            });
        }
      });

      await Promise.all(updatePromises);

      // 2. 利用者インセンティブ配分レコード (incentive_records) の target_period も工賃支給日に更新
      try {
        const { data: memberIncentives } = await supabase
          .from('incentive_records')
          .select('id, target_period');

        if (memberIncentives && memberIncentives.length > 0) {
          const matched = memberIncentives.filter(i => String(i.target_period).startsWith(currentMonth));
          for (const item of matched) {
            await supabase
              .from('incentive_records')
              .update({ target_period: autoWagePaymentDate })
              .eq('id', item.id);
          }
        }
      } catch (err) {
        console.warn('incentive_records update warning:', err);
      }

      await fetchFinancials(currentMonth, selectedOfficeId);
      setMonthlyDateDrafts(prev => {
        const next = { ...prev };
        delete next[currentMonth];
        return next;
      });
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error('Error saving transaction dates:', err);
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProgress || loadingFinancials) {
    return <div style={{ padding: '24px' }}>Loading...</div>;
  }

  return (
    <>
      <div className="table-responsive data-table-wrapper" style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>案件コード</th>
              <th style={{ width: '220px' }}>案件名</th>
              <th style={{ width: '90px' }}>精算種別</th>
              <th style={{ width: '140px' }}>収支区分</th>
              <th style={{ width: '180px' }}>勘定科目</th>
              <th style={{ width: '200px' }}>摘要・内容</th>
              <th style={{ width: '120px', textAlign: 'right' }}>金額</th>
              <th style={{ width: '200px' }}>取引時期（取引日）</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>
                  当月の案件・科目データがありません
                </td>
              </tr>
            ) : (
              displayRows.map(row => {
                const currentDate = dateDrafts[row.id] || row.transactionDate;
                return (
                  <tr key={row.id}>
                    <td>{row.projectCode}</td>
                    <td>{row.projectName}</td>
                    <td>{row.isOngoing ? '毎月' : '案件終了時'}</td>
                    <td>{row.categoryLabel}</td>
                    <td>
                      <strong>{row.subject}</strong>
                    </td>
                    <td>{row.summary}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      ¥{row.amount.toLocaleString()}
                    </td>
                    <td>
                      {row.isLaborMember ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="date"
                            value={autoWagePaymentDate}
                            disabled
                            style={{
                              backgroundColor: 'var(--color-bg-subtle, #f3f4f6)',
                              cursor: 'not-allowed',
                              color: 'var(--color-text-muted, #6b7280)',
                              border: '1px solid var(--color-border, #d1d5db)',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: 'var(--text-body, 14px)'
                            }}
                          />
                          <Tooltip text="労務費（利用者工賃）の取引日は、工賃基準日設定の支給日より自動算出され固定されます">
                            <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 'bold' }}>
                              支給日連動（固定）
                            </span>
                          </Tooltip>
                        </div>
                      ) : (
                        <input
                          type="date"
                          value={currentDate}
                          onChange={(e) => handleDateChange(row.id, e.target.value)}
                          style={{
                            border: '1px solid var(--color-border, #d1d5db)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: 'var(--text-body, 14px)'
                          }}
                        />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* アクションバー */}
      <div className="action-bar">
        <div className="filter-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                if (currentMonth) {
                  const [y, m] = currentMonth.split('-');
                  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                  date.setMonth(date.getMonth() - 1);
                  const newY = date.getFullYear();
                  const newM = (date.getMonth() + 1).toString().padStart(2, '0');
                  setCurrentMonth(`${newY}-${newM}`);
                }
              }}
            >
              ＜
            </Button>
            <MonthInput
              value={currentMonth || ''}
              onChange={(val) => {
                if (val) setCurrentMonth(val);
              }}
              className="date-filter-pill"
              style={{ width: 'auto', minWidth: '140px' }}
            />
            <Button
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                if (currentMonth) {
                  const [y, m] = currentMonth.split('-');
                  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                  date.setMonth(date.getMonth() + 1);
                  const newY = date.getFullYear();
                  const newM = (date.getMonth() + 1).toString().padStart(2, '0');
                  setCurrentMonth(`${newY}-${newM}`);
                }
              }}
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
          </div>
        </div>
        <div className="action-buttons">
          <Button variant="secondary" onClick={handleCancel} disabled={!isModified || saving}>
            {BUTTON_LABELS.CANCEL || '取消'}
          </Button>
          <Button variant="primary" onClick={handleBatchSave} disabled={!isModified || saving}>
            {saving ? '保存中...' : (BUTTON_LABELS.SAVE || '保存')}
          </Button>
        </div>
        <div style={{ flex: 1 }}></div>
      </div>
    </>
  );
}
