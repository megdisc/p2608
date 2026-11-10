import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import { useOffice } from '../contexts';

export type MonthlyFinancialRecord = {
  id: string;
  project_id: string;
  type: 'revenue' | 'expense' | 'reserve';
  subject: string;
  amount: number;
  target_period: string; // e.g. '2026-08'
  office_id?: string | null;
};

export function useMonthlyFinancials() {
  const [financials, setFinancials] = useState<MonthlyFinancialRecord[]>([]);
  const [allExpenseRecords, setAllExpenseRecords] = useState<MonthlyFinancialRecord[]>([]);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const { selectedOfficeId } = useOffice();

  const fetchFinancials = useCallback(async (monthStr: string, officeId?: string) => {
    try {
      setLoadingFinancials(true);
      const effOfficeId = officeId !== undefined ? officeId : selectedOfficeId;

      if (!effOfficeId) {
        setFinancials([]);
        setAllExpenseRecords([]);
        return;
      }

      const [y, m] = monthStr.split('-').map(Number);
      const startOfMonth = `${monthStr}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const endOfMonth = `${monthStr}-${lastDay.toString().padStart(2, '0')}`;

      // 1. 月次確定状態の確認
      const { data: closingData } = await supabase
        .from('monthly_financial_closings')
        .select('target_period, is_confirmed')
        .eq('target_period', monthStr)
        .eq('office_id', effOfficeId)
        .eq('is_confirmed', true);

      const isClosed = Boolean(closingData && closingData.length > 0);

      let records: MonthlyFinancialRecord[] = [];
      let allExpense: MonthlyFinancialRecord[] = [];

      if (isClosed) {
        // 確定済み: スナップショットテーブルから取得
        const [snapRes, snapExpRes] = await Promise.all([
          supabase
            .from('general_financial_snapshot_details')
            .select('*')
            .eq('office_id', effOfficeId)
            .gte('target_period', startOfMonth)
            .lte('target_period', endOfMonth),
          supabase
            .from('general_financial_snapshot_details')
            .select('*')
            .eq('office_id', effOfficeId)
            .eq('type', 'expense')
            .in('subject', ['材料費', '経費'])
        ]);

        if (!snapRes.error && snapRes.data && snapRes.data.length > 0) {
          records = snapRes.data;
          allExpense = snapExpRes.data || [];
        } else {
          // スナップショットにまだ未作成の場合はレコード層からフォールバック
          const [recRes, recExpRes] = await Promise.all([
            supabase
              .from('general_financial_records')
              .select('*')
              .eq('office_id', effOfficeId)
              .gte('target_period', startOfMonth)
              .lte('target_period', endOfMonth),
            supabase
              .from('general_financial_records')
              .select('*')
              .eq('office_id', effOfficeId)
              .eq('type', 'expense')
              .in('subject', ['材料費', '経費'])
          ]);
          records = recRes.data || [];
          allExpense = recExpRes.data || [];
        }
      } else {
        // 未確定: レコードテーブル（月次実績層）から取得
        const [recRes, recExpRes] = await Promise.all([
          supabase
            .from('general_financial_records')
            .select('*')
            .eq('office_id', effOfficeId)
            .gte('target_period', startOfMonth)
            .lte('target_period', endOfMonth),
          supabase
            .from('general_financial_records')
            .select('*')
            .eq('office_id', effOfficeId)
            .eq('type', 'expense')
            .in('subject', ['材料費', '経費'])
        ]);

        if (recRes.error) throw recRes.error;
        if (recExpRes.error) throw recExpRes.error;

        records = recRes.data || [];
        allExpense = recExpRes.data || [];
      }

      setFinancials(records);
      setAllExpenseRecords(allExpense);
    } catch (err) {
      console.error('Error fetching monthly financials:', err);
      throw err;
    } finally {
      setLoadingFinancials(false);
    }
  }, [selectedOfficeId]);

const isValidUuid = (str: unknown): boolean => {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

  const saveFinancials = async (drafts: MonthlyFinancialRecord[], deletedIds: string[]) => {
    try {
      if (deletedIds.length > 0) {
        const validDeletes = deletedIds.filter(isValidUuid);
        if (validDeletes.length > 0) {
          const { error: delErr } = await supabase.from('general_financial_records').delete().in('id', validDeletes);
          if (delErr) throw delErr;
        }
      }
      
      const upserts = drafts.map(d => {
        const isRealUuid = isValidUuid(d.id);
        const periodStr = d.target_period ? (d.target_period.length === 7 ? `${d.target_period}-01` : d.target_period) : d.target_period;
        return {
          ...(isRealUuid ? { id: d.id } : {}),
          office_id: selectedOfficeId || null,
          project_id: d.project_id,
          type: d.type,
          subject: d.subject,
          amount: Number(d.amount) || 0,
          target_period: periodStr,
          activity_category: 'production'
        };
      });
      
      if (upserts.length > 0) {
        const { error: upErr } = await supabase.from('general_financial_records').upsert(upserts);
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
