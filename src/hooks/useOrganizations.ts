import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type OrganizationItem = {
  id: string;
  name: string;
  representative_name: string;
  corporate_number: string;
  postal_code_prefix: string;
  postal_code_suffix: string;
  prefecture: string;
  city: string;
  town_street: string;
  building: string;
  phone: string;
  fax: string;
  email: string;
};

export function useOrganizations() {
  const [items, setItems] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('*');

      if (error) throw error;

      // Fetch related address, phone/fax, email for each organization
      const addressRes = await supabase
        .from('entity_address_settings')
        .select('owner_id, address_id, addresses(postal_code_prefix, postal_code_suffix, prefecture, city, town_street, building)')
        .eq('owner_type', 'organization');

      const phoneRes = await supabase
        .from('entity_phone_settings')
        .select('owner_id, phone_number_id, phone_numbers(phone_type, phone_number)')
        .eq('owner_type', 'organization');

      const emailRes = await supabase
        .from('entity_email_settings')
        .select('owner_id, email_address_id, email_addresses(email)')
        .eq('owner_type', 'organization');

      const addressMap = new Map<string, any>();
      (addressRes.data || []).forEach((item: any) => {
        if (item.addresses) {
          addressMap.set(item.owner_id, item.addresses);
        }
      });

      const phoneMap = new Map<string, string>();
      const faxMap = new Map<string, string>();
      (phoneRes.data || []).forEach((item: any) => {
        if (item.phone_numbers) {
          if (item.phone_numbers.phone_type === 'fax') {
            faxMap.set(item.owner_id, item.phone_numbers.phone_number);
          } else {
            phoneMap.set(item.owner_id, item.phone_numbers.phone_number);
          }
        }
      });

      const emailMap = new Map<string, string>();
      (emailRes.data || []).forEach((item: any) => {
        if (item.email_addresses?.email) {
          emailMap.set(item.owner_id, item.email_addresses.email);
        }
      });

      const formatted: OrganizationItem[] = (data || []).map((o: any) => {
        const addr = addressMap.get(o.id) || {};
        return {
          id: o.id,
          name: o.name,
          representative_name: o.representative_name || '',
          corporate_number: o.corporate_number || '',
          postal_code_prefix: addr.postal_code_prefix || '',
          postal_code_suffix: addr.postal_code_suffix || '',
          prefecture: addr.prefecture || '',
          city: addr.city || '',
          town_street: addr.town_street || '',
          building: addr.building || '',
          phone: phoneMap.get(o.id) || '',
          fax: faxMap.get(o.id) || '',
          email: emailMap.get(o.id) || ''
        };
      });

      setItems(formatted);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveOrganizations = async (drafts: OrganizationItem[], deletedIds: string[] = []) => {
    try {
      const activeItems = drafts.filter(i => !deletedIds.includes(i.id));
      for (const item of activeItems) {
        const upsertData: any = {
          name: item.name,
          representative_name: item.representative_name || null,
          corporate_number: item.corporate_number || null,
        };
        if (!item.id.startsWith('ORG-')) {
          upsertData.id = item.id;
        }

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .upsert(upsertData)
          .select('id')
          .single();

        if (orgError) throw orgError;
        const orgId = orgData.id;

        // 1. Save address
        const addrSettingRes = await supabase
          .from('entity_address_settings')
          .select('id, address_id')
          .eq('owner_type', 'organization')
          .eq('owner_id', orgId)
          .maybeSingle();

        if (addrSettingRes.data?.address_id) {
          await supabase.from('addresses').update({
            postal_code_prefix: item.postal_code_prefix || null,
            postal_code_suffix: item.postal_code_suffix || null,
            prefecture: item.prefecture || null,
            city: item.city || null,
            town_street: item.town_street || null,
            building: item.building || null,
          }).eq('id', addrSettingRes.data.address_id);
        } else if (item.postal_code_prefix || item.postal_code_suffix || item.prefecture || item.city || item.town_street || item.building) {
          const { data: newAddr, error: addrErr } = await supabase.from('addresses').insert({
            postal_code_prefix: item.postal_code_prefix || null,
            postal_code_suffix: item.postal_code_suffix || null,
            prefecture: item.prefecture || null,
            city: item.city || null,
            town_street: item.town_street || null,
            building: item.building || null,
          }).select('id').single();

          if (!addrErr && newAddr) {
            await supabase.from('entity_address_settings').insert({
              owner_type: 'organization',
              owner_id: orgId,
              address_id: newAddr.id,
            });
          }
        }

        // 2. Save phone & fax numbers
        const phoneSettingRes = await supabase
          .from('entity_phone_settings')
          .select('id, phone_number_id, phone_numbers(phone_type)')
          .eq('owner_type', 'organization')
          .eq('owner_id', orgId);

        const phoneSettings = phoneSettingRes.data || [];
        const existingPhone = phoneSettings.find((p: any) => p.phone_numbers?.phone_type !== 'fax');
        const existingFax = phoneSettings.find((p: any) => p.phone_numbers?.phone_type === 'fax');

        // Phone
        if (existingPhone?.phone_number_id) {
          await supabase.from('phone_numbers').update({
            phone_number: item.phone,
          }).eq('id', existingPhone.phone_number_id);
        } else if (item.phone) {
          const { data: newPhone } = await supabase.from('phone_numbers').insert({
            phone_type: 'phone',
            phone_number: item.phone,
          }).select('id').single();
          if (newPhone) {
            await supabase.from('entity_phone_settings').insert({
              owner_type: 'organization',
              owner_id: orgId,
              phone_number_id: newPhone.id,
            });
          }
        }

        // Fax
        if (existingFax?.phone_number_id) {
          await supabase.from('phone_numbers').update({
            phone_number: item.fax,
          }).eq('id', existingFax.phone_number_id);
        } else if (item.fax) {
          const { data: newFax } = await supabase.from('phone_numbers').insert({
            phone_type: 'fax',
            phone_number: item.fax,
          }).select('id').single();
          if (newFax) {
            await supabase.from('entity_phone_settings').insert({
              owner_type: 'organization',
              owner_id: orgId,
              phone_number_id: newFax.id,
            });
          }
        }

        // 3. Save email
        const emailSettingRes = await supabase
          .from('entity_email_settings')
          .select('id, email_address_id')
          .eq('owner_type', 'organization')
          .eq('owner_id', orgId)
          .maybeSingle();

        if (emailSettingRes.data?.email_address_id) {
          await supabase.from('email_addresses').update({
            email: item.email,
          }).eq('id', emailSettingRes.data.email_address_id);
        } else if (item.email) {
          const { data: newEmail } = await supabase.from('email_addresses').insert({
            email: item.email,
          }).select('id').single();
          if (newEmail) {
            await supabase.from('entity_email_settings').insert({
              owner_type: 'organization',
              owner_id: orgId,
              email_address_id: newEmail.id,
            });
          }
        }
      }

      await fetchOrganizations();
    } catch (err) {
      console.error('Error saving organizations:', err);
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
