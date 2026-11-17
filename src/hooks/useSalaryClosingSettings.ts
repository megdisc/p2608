import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export interface SalaryClosingSettingItem {
  id: string;
  office_id: string;
  office_name: string;
  closing_day: number;
  payment_month_type: 'current' | 'next' | 'next_next';
  payment_day: number;
  valid_from: string;
  valid_to: string | null;
}

export function useSalaryClosingSettings() {
  const [items, setItems] = useState<SalaryClosingSettingItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSalaryClosingSettings = useCallback(async (officeId?: string) => {
    try {
      setLoading(true);

      let settingsQuery = supabase
        .from('salary_closing_settings')
        .select('*, offices(id, name, short_name)')
        .order('valid_from', { ascending: false });

      if (officeId && officeId !== 'all') {
        settingsQuery = settingsQuery.eq('office_id', officeId);
      }

      const { data: settingsData, error: settingsError } = await settingsQuery;
      if (settingsError) throw settingsError;

      interface SettingRow {
        id: string;
        office_id: string;
        closing_day: number;
        payment_month_type: 'current' | 'next' | 'next_next';
        payment_day: number;
        valid_from: string;
        valid_to: string | null;
        offices?: { id: string; name: string; short_name: string | null } | null;
      }

      const formatted: SalaryClosingSettingItem[] = ((settingsData || []) as SettingRow[]).map(s => ({
        id: s.id,
        office_id: s.office_id,
        office_name: s.offices?.short_name || s.offices?.name || '',
        closing_day: Number(s.closing_day) || 20,
        payment_month_type: s.payment_month_type || 'next',
        payment_day: Number(s.payment_day) || 10,
        valid_from: s.valid_from || '2024-04-01',
        valid_to: s.valid_to || null,
      }));

      if (formatted.length === 0 && officeId && officeId !== 'all') {
        formatted.push({
          id: `TEMP-${officeId}`,
          office_id: officeId,
          office_name: '',
          closing_day: 20,
          payment_month_type: 'next',
          payment_day: 10,
          valid_from: '2024-04-01',
          valid_to: null,
        });
      }

      setItems(formatted);
    } catch (err) {
      console.error('Error fetching salary closing settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveSalaryClosingSettings = async (drafts: SalaryClosingSettingItem[], deletedIds: string[] = []) => {
    try {
      setLoading(true);

      if (deletedIds && deletedIds.length > 0) {
        const validDeleteIds = deletedIds.filter(id => !id.startsWith('new_') && !id.startsWith('TEMP-'));
        if (validDeleteIds.length > 0) {
          const { error: delError } = await supabase
            .from('salary_closing_settings')
            .delete()
            .in('id', validDeleteIds);
          if (delError) throw delError;
        }
      }

      for (const item of drafts) {
        const payload = {
          office_id: item.office_id,
          closing_day: Number(item.closing_day) || 20,
          payment_month_type: item.payment_month_type || 'next',
          payment_day: Number(item.payment_day) || 10,
          valid_from: item.valid_from || '2024-04-01',
          valid_to: item.valid_to || null,
        };

        if (item.id.startsWith('new_') || item.id.startsWith('TEMP-')) {
          const { error } = await supabase
            .from('salary_closing_settings')
            .insert(payload);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('salary_closing_settings')
            .update(payload)
            .eq('id', item.id);
          if (error) throw error;
        }
      }
    } catch (err) {
      console.error('Error saving salary closing settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    loading,
    fetchSalaryClosingSettings,
    batchSaveSalaryClosingSettings,
  };
}
