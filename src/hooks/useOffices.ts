import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type ActiveServiceType = {
  id: string;
  code: string;
  name: string;
};

export type OfficeItem = {
  id: string;
  code: string;
  name: string;
  yomigana: string;
  unit_price: number;
  postal_code_prefix: string;
  postal_code_suffix: string;
  prefecture: string;
  city: string;
  town_street: string;
  building: string;
  phone: string;
  fax: string;
  email: string;
  service_type_ids?: string[];
  is_deleted?: boolean;
};

export function useOffices() {
  const [items, setItems] = useState<OfficeItem[]>([]);
  const [activeServiceTypes, setActiveServiceTypes] = useState<ActiveServiceType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOffices = useCallback(async () => {
    try {
      setLoading(true);
      const [officesRes, addressRes, phoneRes, emailRes, serviceTypesRes, officeServiceTypesRes] = await Promise.all([
        supabase.from('offices').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('entity_address_settings').select('owner_id, address_id, addresses(postal_code_prefix, postal_code_suffix, prefecture, city, town_street, building)').eq('owner_type', 'office'),
        supabase.from('entity_phone_settings').select('owner_id, phone_number_id, phone_numbers(phone_type, phone_number)').eq('owner_type', 'office'),
        supabase.from('entity_email_settings').select('owner_id, email_address_id, email_addresses(email)').eq('owner_type', 'office'),
        supabase.from('service_types').select('id, code, name').is('deleted_at', null).order('code', { ascending: true }),
        supabase.from('office_service_type_settings').select('office_id, service_type_id')
      ]);

      if (officesRes.error) throw officesRes.error;

      const activeSTs: ActiveServiceType[] = (serviceTypesRes.data || []).map((st: any) => ({
        id: st.id,
        code: st.code || '',
        name: st.name || ''
      }));
      setActiveServiceTypes(activeSTs);

      const serviceTypeMap = new Map<string, string[]>();
      (officeServiceTypesRes.data || []).forEach((setting: any) => {
        const existing = serviceTypeMap.get(setting.office_id) || [];
        existing.push(setting.service_type_id);
        serviceTypeMap.set(setting.office_id, existing);
      });

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

      const formatted: OfficeItem[] = (officesRes.data || []).map((o: any) => {
        const addr = addressMap.get(o.id) || {};
        return {
          id: o.id,
          code: o.code || '',
          name: o.name,
          yomigana: o.yomigana || '',
          unit_price: o.unit_price ?? 10.68,
          postal_code_prefix: addr.postal_code_prefix || '',
          postal_code_suffix: addr.postal_code_suffix || '',
          prefecture: addr.prefecture || '',
          city: addr.city || '',
          town_street: addr.town_street || '',
          building: addr.building || '',
          phone: phoneMap.get(o.id) || '',
          fax: faxMap.get(o.id) || '',
          email: emailMap.get(o.id) || '',
          service_type_ids: serviceTypeMap.get(o.id) || [],
          is_deleted: o.is_deleted
        };
      });

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
          yomigana: item.yomigana || null,
          unit_price: item.unit_price || 10.68,
        };
        if (!item.id.startsWith('OFF-')) {
          upsertData.id = item.id;
        }

        const { data: officeData, error: officeErr } = await supabase
          .from('offices')
          .upsert(upsertData)
          .select('id')
          .single();

        if (officeErr) throw officeErr;
        const officeId = officeData.id;

        // 1. Save address
        const addrSettingRes = await supabase
          .from('entity_address_settings')
          .select('id, address_id')
          .eq('owner_type', 'office')
          .eq('owner_id', officeId)
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
              owner_type: 'office',
              owner_id: officeId,
              address_id: newAddr.id,
            });
          }
        }

        // 2. Save phone & fax numbers
        const phoneSettingRes = await supabase
          .from('entity_phone_settings')
          .select('id, phone_number_id, phone_numbers(phone_type)')
          .eq('owner_type', 'office')
          .eq('owner_id', officeId);

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
              owner_type: 'office',
              owner_id: officeId,
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
              owner_type: 'office',
              owner_id: officeId,
              phone_number_id: newFax.id,
            });
          }
        }

        // 3. Save email
        const emailSettingRes = await supabase
          .from('entity_email_settings')
          .select('id, email_address_id')
          .eq('owner_type', 'office')
          .eq('owner_id', officeId)
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
              owner_type: 'office',
              owner_id: officeId,
              email_address_id: newEmail.id,
            });
          }
        }

        // 4. Save office service type settings (事業所支援種別割当)
        if (Array.isArray(item.service_type_ids)) {
          const { data: existingSTs } = await supabase
            .from('office_service_type_settings')
            .select('id, service_type_id')
            .eq('office_id', officeId);

          const existingMap = new Map<string, string>();
          (existingSTs || []).forEach((st: any) => {
            existingMap.set(st.service_type_id, st.id);
          });

          const targetSet = new Set(item.service_type_ids);

          // Delete unselected
          const toDeleteIds: string[] = [];
          existingMap.forEach((settingId, serviceTypeId) => {
            if (!targetSet.has(serviceTypeId)) {
              toDeleteIds.push(settingId);
            }
          });

          if (toDeleteIds.length > 0) {
            await supabase.from('office_service_type_settings').delete().in('id', toDeleteIds);
          }

          // Insert newly selected
          const toInsert: any[] = [];
          targetSet.forEach((serviceTypeId) => {
            if (!existingMap.has(serviceTypeId)) {
              toInsert.push({
                office_id: officeId,
                service_type_id: serviceTypeId,
                capacity: 0
              });
            }
          });

          if (toInsert.length > 0) {
            await supabase.from('office_service_type_settings').insert(toInsert);
          }
        }
      }

      await fetchOffices();
    } catch (err) {
      console.error('Error saving offices:', err);
      throw err;
    }
  };

  return {
    items,
    activeServiceTypes,
    loading,
    fetchOffices,
    batchSaveOffices
  };
}
