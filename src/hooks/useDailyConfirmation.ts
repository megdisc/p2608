import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib';

export function useDailyConfirmation(currentDate?: string) {
  const [confirmedDates, setConfirmedDates] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('daily_work_confirmations');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      '2026-06-15', '2026-06-16', '2026-06-17', '2026-06-29', '2026-06-30',
      '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05',
      '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10',
      '2026-07-11', '2026-07-12', '2026-07-13', '2026-07-14', '2026-07-15',
      '2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19', '2026-07-20',
      '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25',
      '2026-07-26', '2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30',
      '2026-07-31',
      '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05',
      '2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10',
      '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15',
      '2026-08-16',
      '2027-07-01', '2027-07-02', '2027-07-03', '2027-07-04', '2027-07-05',
      '2027-07-06', '2027-07-07', '2027-07-08', '2027-07-09', '2027-07-10',
      '2027-07-11', '2027-07-12', '2027-07-13', '2027-07-14', '2027-07-15',
      '2027-07-16', '2027-07-17', '2027-07-18', '2027-07-19', '2027-07-20',
      '2027-07-21', '2027-07-22', '2027-07-23', '2027-07-24', '2027-07-25',
      '2027-07-26', '2027-07-27', '2027-07-28', '2027-07-29', '2027-07-30',
      '2027-07-31'
    ];
  });

  const fetchConfirmations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('daily_work_confirmations')
        .select('target_period')
        .eq('is_confirmed', true);
      if (!error && data && data.length > 0) {
        const dbDates = data.map((d: any) => d.target_period);
        setConfirmedDates(prev => {
          const merged = Array.from(new Set([...prev, ...dbDates]));
          localStorage.setItem('daily_work_confirmations', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      console.error('Error fetching daily confirmations:', err);
    }
  }, []);

  useEffect(() => {
    fetchConfirmations();
  }, [fetchConfirmations]);

  const isConfirmed = currentDate ? confirmedDates.includes(currentDate) : false;

  const confirmDate = useCallback(async (date: string) => {
    try {
      setConfirmedDates(prev => {
        if (prev.includes(date)) return prev;
        const next = [...prev, date];
        localStorage.setItem('daily_work_confirmations', JSON.stringify(next));
        return next;
      });
      await supabase.from('daily_work_confirmations').upsert(
        { target_period: date, is_confirmed: true, confirmed_at: new Date().toISOString() },
        { onConflict: 'target_period' }
      );
    } catch (err) {
      console.error('Error confirming date:', err);
      throw err;
    }
  }, []);

  const unconfirmDate = useCallback(async (date: string) => {
    try {
      setConfirmedDates(prev => {
        const next = prev.filter(d => d !== date);
        localStorage.setItem('daily_work_confirmations', JSON.stringify(next));
        return next;
      });
      await supabase.from('daily_work_confirmations').delete().eq('target_period', date);
    } catch (err) {
      console.error('Error unconfirming date:', err);
      throw err;
    }
  }, []);

  return {
    confirmedDates,
    isConfirmed,
    confirmDate,
    unconfirmDate,
    fetchConfirmations,
  };
}
