import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type ServiceSchemeItem = {
  id: string;
  name: string;
  service_type: string;
  service_type_label?: string;
  description: string;
  basic_reward_unit: number;
  is_deleted?: boolean;
};

export type ServiceDetailItem = {
  id: string;
  service_scheme_id?: string;
  scheme_name?: string;
  name: string;
  item_category: string;
  item_category_label?: string;
  occurrence_type: string;
  occurrence_type_label?: string;
  unit_value: number;
  calc_rate: number;
  value_type: string;
  value_type_label?: string;
  monthly_limit_count: number | null;
  affects_reward_units: boolean;
  is_auto_calculated: boolean;
  is_deleted?: boolean;
};

export function useServiceSchemes() {
  const [schemes, setSchemes] = useState<ServiceSchemeItem[]>([]);
  const [items, setItems] = useState<ServiceDetailItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchServiceData = useCallback(async () => {
    try {
      setLoading(true);
      const [schemesRes, allowDeductRes, rewardRes] = await Promise.all([
        supabase.from('service_schemes').select('*').eq('is_deleted', false).order('created_at', { ascending: true }),
        supabase.from('allowance_deduction_items').select('*, offices(name)').eq('is_deleted', false).order('created_at', { ascending: true }),
        supabase.from('reward_items').select('*').eq('is_deleted', false).order('created_at', { ascending: true })
      ]);

      if (schemesRes.error) throw schemesRes.error;

      const formattedSchemes: ServiceSchemeItem[] = (schemesRes.data || []).map((s: any) => {
        let typeLabel = '就労継続支援B型';
        if (s.service_type === 'type_a') typeLabel = '就労継続支援A型';
        if (s.service_type === 'transition') typeLabel = '就労移行支援';
        return {
          id: s.id,
          name: s.name,
          service_type: s.service_type || 'type_b',
          service_type_label: typeLabel,
          description: s.description || '',
          basic_reward_unit: s.basic_reward_unit ?? 0,
          is_deleted: s.is_deleted
        };
      });

      const rewardItems: ServiceDetailItem[] = (rewardRes.data || []).map((i: any) => {
        const isSub = i.item_category === 'subtraction';
        const isRate = (i.calc_rate || 0) > 0;
        return {
          id: i.id,
          service_scheme_id: '33333333-3333-3333-3333-333333333333',
          scheme_name: '就労継続支援B型標準サービス体系',
          name: i.name,
          item_category: isSub ? 'reward_subtraction' : 'reward_addition',
          item_category_label: isSub ? '給付費体制減算' : '給付費体制加算',
          occurrence_type: i.occurrence_type || 'daily',
          occurrence_type_label: i.occurrence_type === 'monthly' ? '月次' : '日次',
          unit_value: i.unit_value ?? 0,
          calc_rate: i.calc_rate ?? 0,
          value_type: isRate ? 'rate' : 'unit',
          value_type_label: isRate ? '給付費算定率[%]' : '給付費単位数[単位]',
          monthly_limit_count: i.monthly_limit_count ?? null,
          affects_reward_units: true,
          is_auto_calculated: true,
          is_deleted: i.is_deleted
        };
      });

      const allowDeductItems: ServiceDetailItem[] = (allowDeductRes.data || []).map((i: any) => {
        const isDed = i.item_category === 'deduction';
        return {
          id: i.id,
          service_scheme_id: i.office_id,
          scheme_name: i.offices?.name || '多機能型事業所 ワークステーション未来',
          name: i.name,
          item_category: i.item_category || 'allowance',
          item_category_label: isDed ? '控除' : '加算手当',
          occurrence_type: i.occurrence_type || 'daily',
          occurrence_type_label: i.occurrence_type === 'monthly' ? '月次' : '日次',
          unit_value: i.unit_price ?? 0,
          calc_rate: 0,
          value_type: 'yen',
          value_type_label: '金額[円]',
          monthly_limit_count: null,
          affects_reward_units: false,
          is_auto_calculated: false,
          is_deleted: i.is_deleted
        };
      });

      setSchemes(formattedSchemes);
      setItems([...rewardItems, ...allowDeductItems]);
    } catch (err) {
      console.error('Error fetching service schemes:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveSchemes = async (drafts: ServiceSchemeItem[], deletedIds: string[]) => {
    try {
      if (deletedIds.length > 0) {
        const { error } = await supabase
          .from('service_schemes')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', deletedIds);
        if (error) throw error;
      }

      const activeItems = drafts.filter(i => !deletedIds.includes(i.id));
      for (const item of activeItems) {
        const upsertData: any = {
          name: item.name,
          service_type: item.service_type || 'type_b',
          description: item.description || null,
          basic_reward_unit: item.basic_reward_unit || 0
        };
        if (!item.id.startsWith('SCH-')) {
          upsertData.id = item.id;
        }

        const { error } = await supabase.from('service_schemes').upsert(upsertData);
        if (error) throw error;
      }

      await fetchServiceData();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const batchSaveItems = async (drafts: ServiceDetailItem[], deletedIds: string[]) => {
    try {
      if (deletedIds.length > 0) {
        await Promise.all([
          supabase.from('allowance_deduction_items').update({ deleted_at: new Date().toISOString() }).in('id', deletedIds),
          supabase.from('reward_items').update({ deleted_at: new Date().toISOString() }).in('id', deletedIds)
        ]);
      }

      const activeItems = drafts.filter(i => !deletedIds.includes(i.id));
      for (const item of activeItems) {
        const isRewardItem = item.item_category === 'reward_addition' || item.item_category === 'reward_subtraction' || item.item_category === 'addition' || item.item_category === 'subtraction';

        if (isRewardItem) {
          const upsertData: any = {
            service_type_id: '11111111-0000-0000-0000-000000000001',
            name: item.name,
            item_category: (item.item_category === 'reward_subtraction' || item.item_category === 'subtraction') ? 'subtraction' : 'addition',
            occurrence_type: item.occurrence_type || 'daily',
            unit_value: item.unit_value || 0,
            calc_rate: item.calc_rate || 0,
            monthly_limit_count: item.monthly_limit_count || null
          };
          if (!item.id.startsWith('ITM-')) {
            upsertData.id = item.id;
          }
          const { error } = await supabase.from('reward_items').upsert(upsertData);
          if (error) throw error;
        } else {
          const upsertData: any = {
            office_id: item.service_scheme_id && item.service_scheme_id !== '33333333-3333-3333-3333-333333333333' ? item.service_scheme_id : '22222222-2222-2222-2222-222222222222',
            name: item.name,
            item_category: item.item_category || 'allowance',
            occurrence_type: item.occurrence_type || 'daily',
            unit_price: item.unit_value || 0
          };
          if (!item.id.startsWith('ITM-')) {
            upsertData.id = item.id;
          }
          const { error } = await supabase.from('allowance_deduction_items').upsert(upsertData);
          if (error) throw error;
        }
      }

      await fetchServiceData();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    schemes,
    items,
    loading,
    fetchServiceData,
    batchSaveSchemes,
    batchSaveItems
  };
}
