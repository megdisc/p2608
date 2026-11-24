import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import { WORDS_PROJECT } from '../constants';
import { getSubjectTransactionType } from '../utils';

export type ReserveSummaryRow = {
  id: string;
  period: string; // YYYY-MM
  
  // 工賃変動積立金
  wageInflow: number;
  wageWithdrawal: number;
  wageNet: number;
  wageCumulative: number;

  // 設備等修繕維持積立金
  equipmentInflow: number;
  equipmentWithdrawal: number;
  equipmentNet: number;
  equipmentCumulative: number;
};

export function useReserveSummary(year: string, officeId?: string) {
  const [data, setData] = useState<ReserveSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);

      // 0. 初期残高 (reserve_items) を取得
      let itemsQuery = supabase
        .from('reserve_items')
        .select('name, initial_balance, office_id');
      if (officeId) {
        itemsQuery = itemsQuery.eq('office_id', officeId);
      }

      // 1. 当該年の確定済み月一覧を取得
      let closingsQuery = supabase
        .from('monthly_closings')
        .select('target_period, is_financial_confirmed')
        .gte('target_period', `${year}-01`)
        .lte('target_period', `${year}-12`)
        .eq('is_financial_confirmed', true);

      // 2. 当該年スナップショットデータクエリ
      let snapQuery = supabase
        .from('financial_snapshot')
        .select('target_period, type, subject, amount, project_id, office_id, remarks')
        .gte('target_period', `${year}-01-01`)
        .lte('target_period', `${year}-12-31`)
        .or('type.eq.reserve,subject.ilike.%積立金%');

      // 3. 当該年未確定レコードデータクエリ
      let recQuery = supabase
        .from('financial_records')
        .select('target_period, type, subject, amount, project_id, office_id, remarks')
        .gte('target_period', `${year}-01-01`)
        .lte('target_period', `${year}-12-31`)
        .or('type.eq.reserve,subject.ilike.%積立金%');

      // 4. 前年以前の確定済み月一覧
      let priorClosingsQuery = supabase
        .from('monthly_closings')
        .select('target_period, is_financial_confirmed')
        .lt('target_period', `${year}-01`)
        .eq('is_financial_confirmed', true);

      // 5. 前年以前のスナップショット
      let priorSnapQuery = supabase
        .from('financial_snapshot')
        .select('target_period, type, subject, amount, project_id, office_id')
        .lt('target_period', `${year}-01-01`)
        .or('type.eq.reserve,subject.ilike.%積立金%');

      // 6. 前年以前の未確定レコード
      let priorRecQuery = supabase
        .from('financial_records')
        .select('target_period, type, subject, amount, project_id, office_id')
        .lt('target_period', `${year}-01-01`)
        .or('type.eq.reserve,subject.ilike.%積立金%');

      if (officeId) {
        closingsQuery = closingsQuery.eq('office_id', officeId);
        snapQuery = snapQuery.eq('office_id', officeId);
        recQuery = recQuery.eq('office_id', officeId);
        priorClosingsQuery = priorClosingsQuery.eq('office_id', officeId);
        priorSnapQuery = priorSnapQuery.eq('office_id', officeId);
        priorRecQuery = priorRecQuery.eq('office_id', officeId);
      }

      const [itemsRes, closingsRes, snapRes, recRes, priorClosingsRes, priorSnapRes, priorRecRes] = await Promise.all([
        itemsQuery,
        closingsQuery,
        snapQuery,
        recQuery,
        priorClosingsQuery,
        priorSnapQuery,
        priorRecQuery,
      ]);

      // --- 期首残高（初期残高 ＋ 前年以前の累積純増減）の集計 ---
      let priorWageBalance = 0;
      let priorEquipmentBalance = 0;

      (itemsRes.data || []).forEach((item: any) => {
        const initBal = Number(item.initial_balance) || 0;
        const subj = item.name || '';
        if (subj === WORDS_PROJECT.SUBJECT_RESERVE_WAGE || subj.includes('工賃変動積立金')) {
          priorWageBalance += initBal;
        } else if (subj === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT || subj.includes('設備等修繕維持積立金')) {
          priorEquipmentBalance += initBal;
        }
      });

      const priorConfirmedMonths = new Set(
        (priorClosingsRes.data || []).map((c: { target_period: string }) => c.target_period)
      );
      const priorSnapRecords = priorSnapRes.data || [];
      const priorActRecords = priorRecRes.data || [];
      const priorSnapMonthSet = new Set(priorSnapRecords.map(r => r.target_period ? r.target_period.substring(0, 7) : ''));

      const priorMonths = new Set<string>();
      priorSnapRecords.forEach(r => { if (r.target_period) priorMonths.add(r.target_period.substring(0, 7)); });
      priorActRecords.forEach(r => { if (r.target_period) priorMonths.add(r.target_period.substring(0, 7)); });

      priorMonths.forEach(mStr => {
        const isClosed = priorConfirmedMonths.has(mStr);
        const mRecords = (isClosed && priorSnapMonthSet.has(mStr))
          ? priorSnapRecords.filter(r => r.target_period && r.target_period.startsWith(mStr))
          : priorActRecords.filter(r => r.target_period && r.target_period.startsWith(mStr));

        mRecords.forEach(record => {
          const amt = Math.abs(Number(record.amount) || 0);
          const subj = record.subject || '';
          const txType = getSubjectTransactionType(subj, record.project_id, record.type || undefined);
          const isWage = subj === WORDS_PROJECT.SUBJECT_RESERVE_WAGE || subj.includes('工賃変動積立金');
          const isEquipment = subj === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT || subj.includes('設備等修繕維持積立金');

          if (txType === 'reserve_inflow') {
            if (isWage) priorWageBalance += amt;
            else if (isEquipment) priorEquipmentBalance += amt;
          } else {
            if (isWage) priorWageBalance -= amt;
            else if (isEquipment) priorEquipmentBalance -= amt;
          }
        });
      });

      // --- 当該年の月別レコード集計 ---
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
          wageCumulative: 0,
          equipmentInflow: 0,
          equipmentWithdrawal: 0,
          equipmentNet: 0,
          equipmentCumulative: 0,
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
          }
        } else {
          if (isWage) {
            row.wageWithdrawal += amt;
          } else if (isEquipment) {
            row.equipmentWithdrawal += amt;
          }
        }
      });

      // 1月〜12月を順に累計計算
      let runningWageBalance = priorWageBalance;
      let runningEquipmentBalance = priorEquipmentBalance;

      for (let i = 1; i <= 12; i++) {
        const monthStr = i.toString().padStart(2, '0');
        const periodKey = `${year}-${monthStr}`;
        const row = summaryMap.get(periodKey)!;
        row.wageNet = row.wageInflow - row.wageWithdrawal;
        row.equipmentNet = row.equipmentInflow - row.equipmentWithdrawal;

        runningWageBalance += row.wageNet;
        row.wageCumulative = runningWageBalance;

        runningEquipmentBalance += row.equipmentNet;
        row.equipmentCumulative = runningEquipmentBalance;
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
