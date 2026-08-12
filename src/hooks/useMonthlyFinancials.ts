import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type MonthlyFinancialRecord = {
  id: string;
  project_id: string;
  type: 'revenue' | 'expense' | 'reserve';
  subject: string;
  amount: number;
  period: string; // e.g. '2026-08'
  recorded_date?: string;
};

export function useMonthlyFinancials() {
  const [financials, setFinancials] = useState<MonthlyFinancialRecord[]>([]);
  const [allExpenseRecords, setAllExpenseRecords] = useState<MonthlyFinancialRecord[]>([]);
  const [loadingFinancials, setLoadingFinancials] = useState(false);

  const fetchFinancials = useCallback(async (monthStr: string) => {
    try {
      setLoadingFinancials(true);
      const [recRes, allExpRes] = await Promise.all([
        supabase
          .from('financial_records')
          .select('*')
          .gte('period', `${monthStr}-01`)
          .lte('period', `${monthStr}-31`),
        supabase
          .from('financial_records')
          .select('*')
          .eq('type', 'expense')
          .in('subject', ['材料費', '経費'])
      ]);
      
      if (recRes.error) throw recRes.error;
      if (allExpRes.error) throw allExpRes.error;

      setFinancials(recRes.data || []);
      setAllExpenseRecords(allExpRes.data || []);
    } catch (err) {
      console.error('Error fetching monthly financials:', err);
      throw err;
    } finally {
      setLoadingFinancials(false);
    }
  }, []);

  const saveFinancials = async (drafts: MonthlyFinancialRecord[], deletedIds: string[]) => {
    try {
      setLoadingFinancials(true);
      if (deletedIds.length > 0) {
        await supabase.from('financial_records').delete().in('id', deletedIds);
      }
      
      const upserts = drafts.map(d => ({
        ...(d.id.startsWith('TEMP') ? {} : { id: d.id }),
        project_id: d.project_id,
        type: d.type,
        subject: d.subject,
        amount: d.amount,
        period: d.period,
        recorded_date: d.recorded_date || new Date().toISOString().split('T')[0]
      }));
      
      if (upserts.length > 0) {
        await supabase.from('financial_records').upsert(upserts);
      }
    } catch (err) {
      console.error('Error saving financials:', err);
      throw err;
    } finally {
      setLoadingFinancials(false);
    }
  };

  return {
    financials,
    allExpenseRecords,
    loadingFinancials,
    fetchFinancials,
    saveFinancials
  };
}
