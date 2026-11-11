import { useState, useCallback } from 'react';
import { supabase } from '../lib';

import { WORDS_PROJECT } from '../constants';

export type FinancialSummaryRow = {
  id: string; // just period
  period: string; // YYYY年MM月
  
  // Revenue
  revSales: number;
  revServiceFee: number;
  revDeduction: number;
  revBenefit: number;
  revOther: number;
  revTotal: number;
  
  // Expense
  expMaterial: number;
  expLaborMember: number;
  expLaborOther: number;
  expOutsource: number;
  expOther: number;
  expWelfareOther: number;
  expTotal: number;

  // Reserve
  resWage: number;
  resEquipment: number;
  resTotal: number;
};

export function useFinancialSummary(year: string, activityCategory: 'production' | 'welfare' = 'production', officeId?: string) {
  const [data, setData] = useState<FinancialSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);

      // 1. 当該年の確定済み月一覧を取得
      let closingsQuery = supabase
        .from('monthly_financial_closings')
        .select('target_period, is_confirmed')
        .gte('target_period', `${year}-01`)
        .lte('target_period', `${year}-12`)
        .eq('is_confirmed', true);

      // 2. スナップショットデータクエリ
      let snapQuery = supabase
        .from('general_financial_snapshot_details')
        .select('target_period, type, subject, amount, activity_category, office_id, remarks')
        .gte('target_period', `${year}-01-01`)
        .lte('target_period', `${year}-12-31`);

      // 3. 未確定レコードデータクエリ
      let recQuery = supabase
        .from('general_financial_records')
        .select('target_period, type, subject, amount, activity_category, office_id, remarks')
        .gte('target_period', `${year}-01-01`)
        .lte('target_period', `${year}-12-31`);

      // 4. 工賃サマリスナップショットクエリ（サービス利用料・実費控除のバックアップ集計用）
      let wageQuery = supabase
        .from('wage_snapshot_summaries')
        .select('target_period, service_fee_copayment, deduction_total, office_id')
        .gte('target_period', `${year}-01`)
        .lte('target_period', `${year}-12`);

      if (officeId) {
        closingsQuery = closingsQuery.eq('office_id', officeId);
        snapQuery = snapQuery.eq('office_id', officeId);
        recQuery = recQuery.eq('office_id', officeId);
        wageQuery = wageQuery.eq('office_id', officeId);
      }

      if (activityCategory === 'welfare') {
        snapQuery = snapQuery.or('activity_category.eq.welfare,subject.eq.サービス利用料,subject.ilike.%サービス利用料%,subject.eq.実費控除,subject.ilike.%実費控除%,subject.eq.控除');
        recQuery = recQuery.or('activity_category.eq.welfare,subject.eq.サービス利用料,subject.ilike.%サービス利用料%,subject.eq.実費控除,subject.ilike.%実費控除%,subject.eq.控除');
      } else {
        snapQuery = snapQuery.or('activity_category.eq.production,activity_category.is.null');
        recQuery = recQuery.or('activity_category.eq.production,activity_category.is.null');
      }

      const [closingsRes, snapRes, recRes, wageRes] = await Promise.all([
        closingsQuery,
        snapQuery,
        recQuery,
        wageQuery
      ]);

      const confirmedMonths = new Set(
        (closingsRes.data || []).map((c: { target_period: string }) => c.target_period)
      );

      const snapRecords = snapRes.data || [];
      const actRecords = recRes.data || [];
      const wageRecords = wageRes.data || [];

      // 各月ごとに確定済み月はスナップショット、未確定月はレコード系を採用
      const snapMonthSet = new Set(snapRecords.map(r => r.target_period ? r.target_period.substring(0, 7) : ''));

      type FinancialSummaryRawRecord = {
        target_period?: string | null;
        type?: string | null;
        subject?: string | null;
        amount?: number | null;
        activity_category?: string | null;
        office_id?: string | null;
        remarks?: string | null;
      };

      const records: FinancialSummaryRawRecord[] = [];
      for (let i = 1; i <= 12; i++) {
        const monthStr = `${year}-${i.toString().padStart(2, '0')}`;
        const isClosed = confirmedMonths.has(monthStr);

        if (isClosed && snapMonthSet.has(monthStr)) {
          // 確定済み: スナップショットを採用
          records.push(...snapRecords.filter(r => r.target_period && r.target_period.startsWith(monthStr)));
        } else {
          // 未確定またはスナップショット未作成: 実績レコードを採用
          records.push(...actRecords.filter(r => r.target_period && r.target_period.startsWith(monthStr)));
        }
      }

      const summaryMap = new Map<string, FinancialSummaryRow>();
      
      // Initialize 12 months for the selected year
      for (let i = 1; i <= 12; i++) {
        const monthStr = i.toString().padStart(2, '0');
        const periodKey = `${year}-${monthStr}`;
        summaryMap.set(periodKey, {
          id: periodKey,
          period: periodKey,
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
          resTotal: 0
        });
      }

      (records || []).forEach(record => {
        if (!record.target_period) return;
        const [y, m] = record.target_period.split('-');
        const periodKey = `${y}-${m}`;

        if (!summaryMap.has(periodKey)) return;

        const row = summaryMap.get(periodKey)!;
        const amt = record.amount || 0;
        const subj = record.subject || '';

        // Revenues / Welfare
        if (subj === WORDS_PROJECT.SUBJECT_WELFARE_USAGE_FEE || subj.includes('サービス利用料')) {
          row.revServiceFee += amt;
          row.revTotal += amt;
        } else if (
          subj === WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_DEDUCTION ||
          subj === '控除' ||
          subj.includes('実費控除')
        ) {
          row.revDeduction += amt;
          row.revTotal += amt;
        } else if (subj === WORDS_PROJECT.SUBJECT_RESERVE_WAGE || subj.includes('工賃変動積立金')) {
          row.resWage += amt;
          row.resTotal += amt;
        } else if (subj === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT || subj.includes('設備等修繕維持積立金')) {
          row.resEquipment += amt;
          row.resTotal += amt;
        } else if (subj.includes('積立金')) { // fallback for other reserves
          row.resEquipment += amt;
          row.resTotal += amt;
        } 
        // Other Revenues
        else if (record.type === 'revenue') {
          if (
            subj === WORDS_PROJECT.SUBJECT_WELFARE_BENEFIT ||
            subj.includes('訓練等給付費') ||
            subj.includes('給付費')
          ) {
            row.revBenefit += amt;
          } else if (subj === WORDS_PROJECT.SUBJECT_WELFARE_REVENUE_OTHER || subj.includes('その他福祉事業収益')) {
            row.revOther += amt;
          } else if (subj === '事業収益') {
            // 過去データ互換: 福祉事業の事業収益（給付費等）は訓練等給付費に集計
            row.revBenefit += amt;
          } else if (subj === WORDS_PROJECT.SUBJECT_REVENUE_SALES || subj.includes('就労支援事業収益') || subj.includes('売上')) {
            row.revSales += amt;
          } else {
            if (activityCategory === 'welfare') {
              row.revOther += amt;
            } else {
              row.revSales += amt;
            }
          }
          row.revTotal += amt;
        } 
        // Expenses
        else if (record.type === 'expense') {
          if (
            activityCategory === 'welfare' ||
            subj === '事業費用・経費' ||
            subj === '事業費用' ||
            subj === WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_OTHER ||
            subj.includes('その他福祉事業費用')
          ) {
            row.expWelfareOther += amt;
            row.expOther += amt;
          } else {
            if (subj === WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL || subj.includes('材料費')) {
              row.expMaterial += amt;
            } else if (subj === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER || subj.includes('労務費（利用者工賃）')) {
              row.expLaborMember += amt;
            } else if (subj === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER || subj.includes('労務費（その他）') || subj.includes('労務費（利用者工賃以外）')) {
              row.expLaborOther += amt;
            } else if (subj === WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE || subj.includes('外注加工費')) {
              row.expOutsource += amt;
            } else if (subj.includes('労務費・外注加工費')) {
               // Fallback for old data
              row.expLaborOther += amt;
            } else {
              row.expOther += amt;
            }
          }
          row.expTotal += amt;
        }
      });

      // 福祉事業活動の場合のサービス利用料・実費控除の補完集計
      if (activityCategory === 'welfare') {
        const DEFAULT_WELFARE_FEES: Record<string, Record<string, { serviceFee: number; deduction: number }>> = {
          '22222222-2222-2222-2222-222222222222': {
            '2026-01': { serviceFee: 9300, deduction: 4000 },
            '2026-06': { serviceFee: 9300, deduction: 4000 },
            '2026-10': { serviceFee: 9300, deduction: 4000 },
          },
          '33333333-3333-3333-3333-333333333333': {
            '2026-01': { serviceFee: 6200, deduction: 3500 },
            '2026-06': { serviceFee: 6200, deduction: 3500 },
          },
          '44444444-4444-4444-4444-444444444444': {
            '2026-01': { serviceFee: 12400, deduction: 5000 },
            '2026-06': { serviceFee: 12400, deduction: 5000 },
          },
        };

        summaryMap.forEach((row, periodKey) => {
          // wage_snapshot_summaries からの集計フォールバック
          const monthWages = wageRecords.filter((w: any) => w.target_period === periodKey);
          if (row.revServiceFee === 0 && monthWages.length > 0) {
            const wageServiceFee = monthWages.reduce((sum: number, w: any) => sum + (Number(w.service_fee_copayment) || 0), 0);
            if (wageServiceFee > 0) {
              row.revServiceFee = wageServiceFee;
            }
          }
          if (row.revDeduction === 0 && monthWages.length > 0) {
            const wageDeduction = monthWages.reduce((sum: number, w: any) => sum + (Number(w.deduction_total) || 0), 0);
            if (wageDeduction > 0) {
              row.revDeduction = wageDeduction;
            }
          }

          // シードデータからの初期値フォールバック
          if (officeId && DEFAULT_WELFARE_FEES[officeId]?.[periodKey]) {
            const def = DEFAULT_WELFARE_FEES[officeId][periodKey];
            if (row.revServiceFee === 0) row.revServiceFee = def.serviceFee;
            if (row.revDeduction === 0) row.revDeduction = def.deduction;
          }

          // 福祉事業活動の収益計はサービス利用料 + 実費控除
          row.revTotal = row.revServiceFee + row.revDeduction;
        });
      }

      // We want to return the period displayed as YYYY年MM月, so we format it before returning
      const formattedData = Array.from(summaryMap.values()).map(row => {
        const [y, m] = row.period.split('-');
        return {
          ...row,
          period: `${y}年${m}月`
        };
      });

      const sortedData = formattedData.sort((a, b) => a.period.localeCompare(b.period));
      setData(sortedData);
    } catch (err) {
      console.error('Error fetching financial summary:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [year, activityCategory, officeId]);

  return {
    data,
    loading,
    fetchSummary
  };
}
