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
          .or(`period.eq.${monthStr},period.eq.${monthStr}-01,and(period.gte.${monthStr}-01,period.lte.${monthStr}-31)`),
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

const isValidUuid = (str: any): boolean => {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

  const saveFinancials = async (drafts: MonthlyFinancialRecord[], deletedIds: string[]) => {
    try {
      if (deletedIds.length > 0) {
        const validDeletes = deletedIds.filter(isValidUuid);
        if (validDeletes.length > 0) {
          const { error: delErr } = await supabase.from('financial_records').delete().in('id', validDeletes);
          if (delErr) throw delErr;
        }
      }
      
      const upserts = drafts.map(d => {
        const isRealUuid = isValidUuid(d.id);
        const periodStr = d.period ? (d.period.length === 7 ? `${d.period}-01` : d.period) : d.period;
        return {
          ...(isRealUuid ? { id: d.id } : {}),
          project_id: d.project_id,
          type: d.type,
          subject: d.subject,
          amount: Number(d.amount) || 0,
          period: periodStr,
          activity_category: 'production',
          recorded_date: d.recorded_date || new Date().toISOString().split('T')[0]
        };
      });
      
      if (upserts.length > 0) {
        const { error: upErr } = await supabase.from('financial_records').upsert(upserts);
        if (upErr) throw upErr;
      }
    } catch (err) {
      console.error('Error saving financials:', err);
      throw err;
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
