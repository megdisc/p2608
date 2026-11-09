import { useState, useCallback } from 'react';
import { supabase } from '../lib';

import { WORDS_PROJECT } from '../constants';

export type FinancialSummaryRow = {
  id: string; // just period
  period: string; // YYYY年MM月
  
  // Revenue
  revSales: number;
  revTotal: number;
  
  // Expense
  expMaterial: number;
  expLaborMember: number;
  expLaborOther: number;
  expOutsource: number;
  expOther: number;
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
        .select('target_period, type, subject, amount, activity_category, office_id')
        .gte('target_period', `${year}-01-01`)
        .lte('target_period', `${year}-12-31`);

      // 3. 未確定レコードデータクエリ
      let recQuery = supabase
        .from('general_financial_records')
        .select('target_period, type, subject, amount, activity_category, office_id')
        .gte('target_period', `${year}-01-01`)
        .lte('target_period', `${year}-12-31`);

      if (officeId) {
        closingsQuery = closingsQuery.eq('office_id', officeId);
        snapQuery = snapQuery.eq('office_id', officeId);
        recQuery = recQuery.eq('office_id', officeId);
      }

      if (activityCategory === 'welfare') {
        snapQuery = snapQuery.eq('activity_category', 'welfare');
        recQuery = recQuery.eq('activity_category', 'welfare');
      } else {
        snapQuery = snapQuery.or('activity_category.eq.production,activity_category.is.null');
        recQuery = recQuery.or('activity_category.eq.production,activity_category.is.null');
      }

      const [closingsRes, snapRes, recRes] = await Promise.all([
        closingsQuery,
        snapQuery,
        recQuery
      ]);

      const confirmedMonths = new Set(
        (closingsRes.data || []).map((c: { target_period: string }) => c.target_period)
      );

      const snapRecords = snapRes.data || [];
      const actRecords = recRes.data || [];

      // 各月ごとに確定済み月はスナップショット、未確定月はレコード系を採用
      const snapMonthSet = new Set(snapRecords.map(r => r.target_period ? r.target_period.substring(0, 7) : ''));

      type FinancialSummaryRawRecord = {
        target_period?: string | null;
        type?: string | null;
        subject?: string | null;
        amount?: number | null;
        activity_category?: string | null;
        office_id?: string | null;
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
          revTotal: 0,
          expMaterial: 0,
          expLaborMember: 0,
          expLaborOther: 0,
          expOutsource: 0,
          expOther: 0,
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

        // Reserves
        if (subj === WORDS_PROJECT.SUBJECT_RESERVE_WAGE || subj.includes('工賃変動積立金')) {
          row.resWage += amt;
          row.resTotal += amt;
        } else if (subj === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT || subj.includes('設備等修繕維持積立金')) {
          row.resEquipment += amt;
          row.resTotal += amt;
        } else if (subj.includes('積立金')) { // fallback for other reserves
          row.resEquipment += amt;
          row.resTotal += amt;
        } 
        // Revenues
        else if (record.type === 'revenue') {
          row.revSales += amt;
          row.revTotal += amt;
        } 
        // Expenses
        else if (record.type === 'expense') {
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
          row.expTotal += amt;
        }
      });

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
