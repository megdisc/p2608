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

export function useFinancialSummary(year: string) {
  const [data, setData] = useState<FinancialSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);

    const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const { data: records, error } = await supabase
        .from('financial_records')
        .select('period, type, subject, amount')
        .gte('period', `${year}-01-01`)
        .lte('period', `${year}-12-31`);
        
      if (error) throw error;

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
        const [y, m] = record.period.split('-');
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
  }, [year]);

  return {
    data,
    loading,
    fetchSummary
  };
}
