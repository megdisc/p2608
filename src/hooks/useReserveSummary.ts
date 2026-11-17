import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import { WORDS_PROJECT } from '../constants';
import { getSubjectTransactionType } from '../utils/financial';

export type ReserveSummaryRow = {
  id: string;
  period: string; // YYYY-MM
  
  // 工賃変動積立金
  wageInflow: number;
  wageWithdrawal: number;
  wageNet: number;

  // 設備等修繕維持積立金
  equipmentInflow: number;
  equipmentWithdrawal: number;
  equipmentNet: number;

  // 合計
  totalInflow: number;
  totalWithdrawal: number;
  totalNet: number;
};

export function useReserveSummary(year: string, officeId?: string) {
  const [data, setData] = useState<ReserveSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);

      // 1. 当該年の確定済み月一覧を取得
      let closingsQuery = supabase
        .from('monthly_closings')
        .select('target_period, is_financial_confirmed')
        .gte('target_period', `${year}-01`)
        .lte('target_period', `${year}-12`)
        .eq('is_financial_confirmed', true);

      // 2. スナップショットデータクエリ
      let snapQuery = supabase
        .from('financial_snapshot')
        .select('target_period, type, subject, amount, project_id, office_id, remarks')
        .gte('target_period', `${year}-01-01`)
        .lte('target_period', `${year}-12-31`)
        .or('type.eq.reserve,subject.ilike.%積立金%');

      // 3. 未確定レコードデータクエリ
      let recQuery = supabase
        .from('financial_records')
        .select('target_period, type, subject, amount, project_id, office_id, remarks')
        .gte('target_period', `${year}-01-01`)
        .lte('target_period', `${year}-12-31`)
        .or('type.eq.reserve,subject.ilike.%積立金%');

      if (officeId) {
        closingsQuery = closingsQuery.eq('office_id', officeId);
        snapQuery = snapQuery.eq('office_id', officeId);
        recQuery = recQuery.eq('office_id', officeId);
      }

      const [closingsRes, snapRes, recRes] = await Promise.all([
        closingsQuery,
        snapQuery,
        recQuery,
      ]);

      const confirmedMonths = new Set(
        (closingsRes.data || []).map((c: { target_period: string }) => c.target_period)
      );

      const snapRecords = snapRes.data || [];
      const actRecords = recRes.data || [];
      const snapMonthSet = new Set(snapRecords.map(r => r.target_period ? r.target_period.substring(0, 7) : ''));

      type RecordItem = {
        target_period?: string | null;
        type?: string | null;
        subject?: string | null;
        amount?: number | null;
        project_id?: string | null;
        office_id?: string | null;
        remarks?: string | null;
      };

      const records: RecordItem[] = [];
      for (let i = 1; i <= 12; i++) {
        const monthStr = `${year}-${i.toString().padStart(2, '0')}`;
        const isClosed = confirmedMonths.has(monthStr);

        if (isClosed && snapMonthSet.has(monthStr)) {
          records.push(...snapRecords.filter(r => r.target_period && r.target_period.startsWith(monthStr)));
        } else {
          records.push(...actRecords.filter(r => r.target_period && r.target_period.startsWith(monthStr)));
        }
      }

      const summaryMap = new Map<string, ReserveSummaryRow>();
      for (let i = 1; i <= 12; i++) {
        const monthStr = i.toString().padStart(2, '0');
        const periodKey = `${year}-${monthStr}`;
        summaryMap.set(periodKey, {
          id: periodKey,
          period: periodKey,
          wageInflow: 0,
          wageWithdrawal: 0,
          wageNet: 0,
          equipmentInflow: 0,
          equipmentWithdrawal: 0,
          equipmentNet: 0,
          totalInflow: 0,
          totalWithdrawal: 0,
          totalNet: 0,
        });
      }

      records.forEach(record => {
        if (!record.target_period) return;
        const [y, m] = record.target_period.split('-');
        const periodKey = `${y}-${m}`;
        if (!summaryMap.has(periodKey)) return;

        const row = summaryMap.get(periodKey)!;
        const amt = Math.abs(Number(record.amount) || 0);
        const subj = record.subject || '';
        const txType = getSubjectTransactionType(subj, record.project_id, record.type || undefined);

        const isWage = subj === WORDS_PROJECT.SUBJECT_RESERVE_WAGE || subj.includes('工賃変動積立金');
        const isEquipment = subj === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT || subj.includes('設備等修繕維持積立金');

        if (txType === 'reserve_inflow') {
          if (isWage) {
            row.wageInflow += amt;
          } else if (isEquipment) {
            row.equipmentInflow += amt;
          } else {
            row.equipmentInflow += amt;
          }
          row.totalInflow += amt;
        } else {
          if (isWage) {
            row.wageWithdrawal += amt;
          } else if (isEquipment) {
            row.equipmentWithdrawal += amt;
          } else {
            row.equipmentWithdrawal += amt;
          }
          row.totalWithdrawal += amt;
        }
      });

      for (const row of summaryMap.values()) {
        row.wageNet = row.wageInflow - row.wageWithdrawal;
        row.equipmentNet = row.equipmentInflow - row.equipmentWithdrawal;
        row.totalNet = row.totalInflow - row.totalWithdrawal;
      }

      setData(Array.from(summaryMap.values()));
    } catch (err) {
      console.error('Error fetching reserve summary:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [year, officeId]);

  return { data, loading, fetchSummary };
}
