import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type OrganizationItem = {
  id: string;
  code: string;
  name: string;
  yomigana: string;
  representative_name: string;
  corporate_number: string;
  address: string;
  phone: string;
  email: string;
  is_deleted?: boolean;
};

export function useOrganizations() {
  const [items, setItems] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_deleted', false)
        .order('code', { ascending: true });

      if (error) throw error;

      // Fetch related address, phone, email for each organization
      const addressRes = await supabase.from('entity_address_settings').select('owner_id, addresses(prefecture, city, town_street, building)').eq('owner_type', 'organization');
      const phoneRes = await supabase.from('entity_phone_settings').select('owner_id, phone_numbers(phone_number)').eq('owner_type', 'organization');
      const emailRes = await supabase.from('entity_email_settings').select('owner_id, email_addresses(email)').eq('owner_type', 'organization');

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

      const formatted: OrganizationItem[] = (data || []).map((o: any) => ({
        id: o.id,
        code: o.code || '',
        name: o.name,
        yomigana: o.yomigana || '',
        representative_name: o.representative_name || '',
        corporate_number: o.corporate_number || '',
        address: addressMap.get(o.id) || '',
        phone: phoneMap.get(o.id) || '',
        email: emailMap.get(o.id) || '',
        is_deleted: o.is_deleted
      }));

      setItems(formatted);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveOrganizations = async (drafts: OrganizationItem[], deletedIds: string[]) => {
    try {
      if (deletedIds.length > 0) {
        const { error } = await supabase
          .from('organizations')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', deletedIds);
        if (error) throw error;
      }

      const activeItems = drafts.filter(i => !deletedIds.includes(i.id));
      for (const item of activeItems) {
        const upsertData: any = {
          code: item.code?.trim() || null,
          name: item.name,
          yomigana: item.yomigana || null,
          representative_name: item.representative_name || null,
          corporate_number: item.corporate_number || null,
        };
        if (!item.id.startsWith('ORG-')) {
          upsertData.id = item.id;
        }

        const { error } = await supabase.from('organizations').upsert(upsertData);
        if (error) throw error;
      }

      await fetchOrganizations();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    items,
    loading,
    fetchOrganizations,
    batchSaveOrganizations
  };
}
