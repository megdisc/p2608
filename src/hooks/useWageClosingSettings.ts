import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export interface WageClosingSettingItem {
  id: string;
  office_id: string;
  office_name: string;
  closing_day: number;
  payment_month_type: 'current' | 'next' | 'next_next';
  payment_day: number;
  average_wage_calc_basis: 'closing_date' | 'payment_date';
  valid_from: string;
  valid_to: string | null;
}

export function useWageClosingSettings() {
  const [items, setItems] = useState<WageClosingSettingItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWageClosingSettings = useCallback(async (officeId?: string) => {
    try {
      setLoading(true);

      // 1. 全事業所または指定事業所を取得
      let officeQuery = supabase
        .from('offices')
        .select('id, name, short_name')
        .order('code', { ascending: true });

      if (officeId && officeId !== 'all') {
        officeQuery = officeQuery.eq('id', officeId);
      }

      const { data: officesData, error: officeError } = await officeQuery;
      if (officeError) throw officeError;

      // 2. 工賃基準日設定を取得
      let settingsQuery = supabase
        .from('wage_closing_settings')
        .select('*');

      if (officeId && officeId !== 'all') {
        settingsQuery = settingsQuery.eq('office_id', officeId);
      }

      const { data: settingsData, error: settingsError } = await settingsQuery;
      if (settingsError) throw settingsError;

      interface OfficeRow {
        id: string;
        name: string;
        short_name: string | null;
      }
      interface SettingRow {
        id: string;
        office_id: string;
        closing_day: number;
        payment_month_type: 'current' | 'next' | 'next_next';
        payment_day: number;
        average_wage_calc_basis: 'closing_date' | 'payment_date';
        valid_from: string;
        valid_to: string | null;
      }

      const formatted: WageClosingSettingItem[] = ((officesData || []) as OfficeRow[]).map(office => {
        const existing = ((settingsData || []) as SettingRow[]).find(s => s.office_id === office.id);
        if (existing) {
          return {
            id: existing.id,
            office_id: office.id,
            office_name: office.short_name || office.name,
            closing_day: Number(existing.closing_day) || 25,
            payment_month_type: existing.payment_month_type || 'next',
            payment_day: Number(existing.payment_day) || 10,
            average_wage_calc_basis: existing.average_wage_calc_basis || 'payment_date',
            valid_from: existing.valid_from || '2024-04-01',
            valid_to: existing.valid_to || null,
          };
        }

        return {
          id: `TEMP-${office.id}`,
          office_id: office.id,
          office_name: office.short_name || office.name,
          closing_day: 25,
          payment_month_type: 'next',
          payment_day: 10,
          average_wage_calc_basis: 'payment_date',
          valid_from: '2024-04-01',
          valid_to: null,
        };
      });

      setItems(formatted);
    } catch (err) {
      console.error('Error fetching wage closing settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveWageClosingSettings = async (drafts: WageClosingSettingItem[]) => {
    try {
      setLoading(true);

      const upserts = drafts.map(item => ({
        ...(item.id.startsWith('TEMP-') ? {} : { id: item.id }),
        office_id: item.office_id,
        closing_day: Number(item.closing_day) || 25,
        payment_month_type: item.payment_month_type || 'next',
        payment_day: Number(item.payment_day) || 10,
        average_wage_calc_basis: item.average_wage_calc_basis || 'payment_date',
        valid_from: item.valid_from || '2024-04-01',
        valid_to: item.valid_to || null,
      }));

      if (upserts.length > 0) {
        const { error } = await supabase
          .from('wage_closing_settings')
          .upsert(upserts, { onConflict: 'office_id,valid_from' });
        if (error) throw error;
      }
    } catch (err) {
      console.error('Error saving wage closing settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    loading,
    fetchWageClosingSettings,
    batchSaveWageClosingSettings,
  };
}
