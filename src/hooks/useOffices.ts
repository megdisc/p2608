import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type OfficeItem = {
  id: string;
  code: string;
  name: string;
  is_type_b: boolean;
  is_type_a: boolean;
  is_transition: boolean;
  unit_price: number;
  address: string;
  phone: string;
  email: string;
  is_deleted?: boolean;
};

export function useOffices() {
  const [items, setItems] = useState<OfficeItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOffices = useCallback(async () => {
    try {
      setLoading(true);
      const [officesRes, addressRes, phoneRes, emailRes] = await Promise.all([
        supabase.from('offices').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('entity_address_settings').select('owner_id, addresses(prefecture, city, town_street, building)').eq('owner_type', 'office'),
        supabase.from('entity_phone_settings').select('owner_id, phone_numbers(phone_number)').eq('owner_type', 'office'),
        supabase.from('entity_email_settings').select('owner_id, email_addresses(email)').eq('owner_type', 'office')
      ]);

      if (officesRes.error) throw officesRes.error;

      const addressMap = new Map<string, string>();
      (addressRes.data || []).forEach((item: any) => {
        if (item.addresses) {
          const addrStr = `${item.addresses.prefecture || ''}${item.addresses.city || ''}${item.addresses.town_street || ''}${item.addresses.building || ''}`;
          addressMap.set(item.owner_id, addrStr);
        }
      });

      const phoneMap = new Map<string, string>();
      (phoneRes.data || []).forEach((item: any) => {
        if (item.phone_numbers?.phone_number) {
          phoneMap.set(item.owner_id, item.phone_numbers.phone_number);
        }
      });

      const emailMap = new Map<string, string>();
      (emailRes.data || []).forEach((item: any) => {
        if (item.email_addresses?.email) {
          emailMap.set(item.owner_id, item.email_addresses.email);
        }
      });

      const formatted: OfficeItem[] = (officesRes.data || []).map((o: any) => ({
        id: o.id,
        code: o.code || '',
        name: o.name,
        is_type_b: o.is_type_b ?? true,
        is_type_a: o.is_type_a ?? false,
        is_transition: o.is_transition ?? false,
        unit_price: o.unit_price ?? 10.68,
        address: addressMap.get(o.id) || '',
        phone: phoneMap.get(o.id) || '',
        email: emailMap.get(o.id) || '',
        is_deleted: o.is_deleted
      }));

      setItems(formatted);
    } catch (err) {
      console.error('Error fetching offices:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveOffices = async (drafts: OfficeItem[], deletedIds: string[]) => {
    try {
      if (deletedIds.length > 0) {
        const { error } = await supabase
          .from('offices')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', deletedIds);
        if (error) throw error;
      }

      const activeItems = drafts.filter(i => !deletedIds.includes(i.id));
      for (const item of activeItems) {
        const upsertData: any = {
          code: item.code?.trim() || null,
          name: item.name,
          is_type_b: item.is_type_b ?? true,
          is_type_a: item.is_type_a ?? false,
          is_transition: item.is_transition ?? false,
          unit_price: item.unit_price || 10.68,
        };
        if (!item.id.startsWith('OFF-')) {
          upsertData.id = item.id;
        }

        const { error } = await supabase.from('offices').upsert(upsertData);
        if (error) throw error;
      }

      await fetchOffices();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    items,
    loading,
    fetchOffices,
    batchSaveOffices
  };
}
