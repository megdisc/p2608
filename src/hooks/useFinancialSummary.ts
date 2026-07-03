import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type FinancialSummaryRow = {
  id: string; // just period
  period: string; // YYYY年MM月
  revenue: number;
  expense: number;
  reserve: number;
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
        // period is YYYY-MM-DD
        const [year, month] = record.period.split('-');
        const periodKey = `${year}年${month}月`;

        if (!summaryMap.has(periodKey)) {
          summaryMap.set(periodKey, {
            id: periodKey,
            period: periodKey,
            revenue: 0,
            expense: 0,
            reserve: 0
          });
        }

        const row = summaryMap.get(periodKey)!;

        // If subject includes '積立金', treat it as reserve.
        // Assuming reserves might be recorded as expense.
        if (record.subject && record.subject.includes('積立金')) {
          row.reserve += (record.amount || 0);
        } else if (record.type === 'revenue') {
          row.revenue += (record.amount || 0);
        } else if (record.type === 'expense') {
          row.expense += (record.amount || 0);
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
