import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type FinancialSummaryRow = {
  id: string; // just period
  period: string; // YYYY年MM月
  
  // Revenue
  revSales: number;
  revOther: number;
  revTotal: number;
  
  // Expense
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

export function useFinancialSummary() {
  const [data, setData] = useState<FinancialSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const { data: records, error } = await supabase
        .from('financial_records')
        .select('period, type, subject, amount');
        
      if (error) throw error;

      const summaryMap = new Map<string, FinancialSummaryRow>();

      (records || []).forEach(record => {
        const [year, month] = record.period.split('-');
        const periodKey = `${year}年${month}月`;

        if (!summaryMap.has(periodKey)) {
          summaryMap.set(periodKey, {
            id: periodKey,
            period: periodKey,
            revSales: 0,
            revOther: 0,
            revTotal: 0,
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

        const row = summaryMap.get(periodKey)!;
        const amt = record.amount || 0;
        const subj = record.subject || '';

        // Reserves
        if (subj.includes('工賃変動積立金')) {
          row.resWage += amt;
          row.resTotal += amt;
        } else if (subj.includes('設備等修繕維持積立金')) {
          row.resEquipment += amt;
          row.resTotal += amt;
        } else if (subj.includes('積立金')) { // fallback for other reserves
          row.resEquipment += amt;
          row.resTotal += amt;
        } 
        // Revenues
        else if (record.type === 'revenue') {
          if (subj.includes('売上')) {
            row.revSales += amt;
          } else {
            row.revOther += amt;
          }
          row.revTotal += amt;
        } 
        // Expenses
        else if (record.type === 'expense') {
          if (subj.includes('労務費（利用者工賃）')) {
            row.expLaborMember += amt;
          } else if (subj.includes('労務費（その他）')) {
            row.expLaborOther += amt;
          } else if (subj.includes('外注加工費')) {
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

      const sortedData = Array.from(summaryMap.values()).sort((a, b) => b.period.localeCompare(a.period));
      setData(sortedData);
    } catch (err) {
      console.error('Error fetching financial summary:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    fetchSummary
  };
}
