import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { ClientItem, PartnerContactItem } from '../types';

export function useClients() {
  const [items, setItems] = useState<ClientItem[]>([]);
  const [lastDbCode, setLastDbCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const [partnersRes, allCodesRes, phoneSettingsRes, emailSettingsRes] = await Promise.all([
        supabase.from('partners').select(`
          *,
          partner_contacts (*)
        `).eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('partners').select('code, created_at').order('created_at', { ascending: false }),
        supabase.from('entity_phone_settings').select('owner_id, phone_number_id, phone_numbers(phone_type, phone_number)').eq('owner_type', 'partner_contact'),
        supabase.from('entity_email_settings').select('owner_id, email_address_id, email_addresses(email)').eq('owner_type', 'partner_contact')
      ]);

      if (partnersRes.error) throw partnersRes.error;

      const phoneMap = new Map<string, string>();
      const faxMap = new Map<string, string>();
      (phoneSettingsRes.data || []).forEach((item: any) => {
        if (item.phone_numbers) {
          if (item.phone_numbers.phone_type === 'fax') {
            faxMap.set(item.owner_id, item.phone_numbers.phone_number || '');
          } else {
            phoneMap.get(item.owner_id) 
              ? phoneMap.set(item.owner_id, phoneMap.get(item.owner_id)!) 
              : phoneMap.set(item.owner_id, item.phone_numbers.phone_number || '');
          }
        }
      });

      const emailMap = new Map<string, string>();
      (emailSettingsRes.data || []).forEach((item: any) => {
        if (item.email_addresses?.email) {
          emailMap.set(item.owner_id, item.email_addresses.email || '');
        }
      });

      const formatted: ClientItem[] = (partnersRes.data || []).map((d: any) => {
        const contacts: PartnerContactItem[] = (d.partner_contacts || [])
          .filter((c: any) => !c.is_deleted)
          .map((c: any) => ({
            id: c.id,
            partnerId: c.partner_id,
            contactName: c.name || '',
            yomigana: c.yomigana || '',
            department: c.department || '',
            position: c.position || '',
            contactPhone: phoneMap.get(c.id) || '',
            contactFax: faxMap.get(c.id) || '',
            email: emailMap.get(c.id) || '',
          }));

        return {
          id: d.id,
          code: d.code || '',
          name: d.name,
          yomigana: d.yomigana || '',
          isCustomer: d.is_customer ?? false,
          isSubcontractor: d.is_subcontractor ?? false,
          isOther: d.is_other ?? false,
          contacts
        };
      });

      setItems(formatted);

      const rawCodes = allCodesRes.data || [];
      const latestCode = rawCodes.find((p: any) => p.code && p.code.trim() !== '')?.code || null;
      setLastDbCode(latestCode);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveClients = async (drafts: ClientItem[], deletedIds: string[]) => {
    try {
      const nowIso = new Date().toISOString();

      if (deletedIds.length > 0) {
        const partnerIdsToDelete = deletedIds.filter(id => !id.startsWith('CLI-') && !id.startsWith('CNT-'));
        const contactIdsToDelete = deletedIds.filter(id => id.startsWith('CNT-') || (!partnerIdsToDelete.includes(id) && id.includes('-')));

        if (partnerIdsToDelete.length > 0) {
          await supabase.from('partners').update({ deleted_at: nowIso }).in('id', partnerIdsToDelete);
          await supabase.from('partner_contacts').update({ deleted_at: nowIso }).in('partner_id', partnerIdsToDelete);
        }
        if (contactIdsToDelete.length > 0) {
          const validContactUUIDs = contactIdsToDelete.filter(id => !id.startsWith('CNT-'));
          if (validContactUUIDs.length > 0) {
            await supabase.from('partner_contacts').update({ deleted_at: nowIso }).in('id', validContactUUIDs);
          }
        }
      }

      const activeItems = drafts.filter(item => !deletedIds.includes(item.id));
      for (const item of activeItems) {
        const upsertPartnerData: any = {
          code: item.code?.trim() || null,
          name: item.name,
          yomigana: item.yomigana,
          is_customer: item.isCustomer ?? false,
          is_subcontractor: item.isSubcontractor ?? false,
          is_other: item.isOther ?? false
        };
        if (!item.id.startsWith('CLI-')) {
          upsertPartnerData.id = item.id;
        }

        const { data: savedPartner, error: pErr } = await supabase
          .from('partners')
          .upsert(upsertPartnerData)
          .select('id')
          .single();

        if (pErr) {
          if (pErr.code === '23505' || pErr.message?.includes('duplicate key') || pErr.details?.includes('code')) {
            throw new Error(`取引先ID「${item.code}」は既に使用されています（削除済み含む）。別のIDを指定してください。`);
          }
          throw pErr;
        }

        const partnerId = savedPartner ? savedPartner.id : item.id;

        if (item.contacts && item.contacts.length > 0) {
          for (const c of item.contacts) {
            if (deletedIds.includes(c.id)) continue;

            const upsertContactData: any = {
              partner_id: partnerId,
              name: c.contactName || '',
              yomigana: c.yomigana || '',
              department: c.department || '',
              position: c.position || ''
            };
            if (!c.id.startsWith('CNT-')) {
              upsertContactData.id = c.id;
            }

            const { data: savedContact, error: cErr } = await supabase
              .from('partner_contacts')
              .upsert(upsertContactData)
              .select('id')
              .single();
            if (cErr) throw cErr;

            const contactId = savedContact ? savedContact.id : (c.id.startsWith('CNT-') ? null : c.id);
            if (!contactId) continue;

            // Manage Phone & Fax
            const phoneSettingRes = await supabase
              .from('entity_phone_settings')
              .select('id, phone_number_id, phone_numbers(phone_type)')
              .eq('owner_type', 'partner_contact')
              .eq('owner_id', contactId);

            const phoneSettings = phoneSettingRes.data || [];
            const existingPhone = phoneSettings.find((p: any) => p.phone_numbers?.phone_type !== 'fax');
            const existingFax = phoneSettings.find((p: any) => p.phone_numbers?.phone_type === 'fax');

            // Phone
            if (existingPhone?.phone_number_id) {
              await supabase.from('phone_numbers').update({
                phone_number: c.contactPhone || '',
              }).eq('id', existingPhone.phone_number_id);
            } else if (c.contactPhone) {
              const { data: newPhone } = await supabase.from('phone_numbers').insert({
                phone_type: 'phone',
                phone_number: c.contactPhone,
              }).select('id').single();
              if (newPhone) {
                await supabase.from('entity_phone_settings').insert({
                  owner_type: 'partner_contact',
                  owner_id: contactId,
                  phone_number_id: newPhone.id,
                });
              }
            }

            // Fax
            if (existingFax?.phone_number_id) {
              await supabase.from('phone_numbers').update({
                phone_number: c.contactFax || '',
              }).eq('id', existingFax.phone_number_id);
            } else if (c.contactFax) {
              const { data: newFax } = await supabase.from('phone_numbers').insert({
                phone_type: 'fax',
                phone_number: c.contactFax,
              }).select('id').single();
              if (newFax) {
                await supabase.from('entity_phone_settings').insert({
                  owner_type: 'partner_contact',
                  owner_id: contactId,
                  phone_number_id: newFax.id,
                });
              }
            }

            // Email
            const emailSettingRes = await supabase
              .from('entity_email_settings')
              .select('id, email_address_id')
              .eq('owner_type', 'partner_contact')
              .eq('owner_id', contactId);

            const existingEmail = (emailSettingRes.data || [])[0];
            if (existingEmail?.email_address_id) {
              await supabase.from('email_addresses').update({
                email: c.email || '',
              }).eq('id', existingEmail.email_address_id);
            } else if (c.email) {
              const { data: newEmail } = await supabase.from('email_addresses').insert({
                email: c.email,
              }).select('id').single();
              if (newEmail) {
                await supabase.from('entity_email_settings').insert({
                  owner_type: 'partner_contact',
                  owner_id: contactId,
                  email_address_id: newEmail.id,
                });
              }
            }
          }
        }
      }

      await fetchClients();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    items,
    lastDbCode,
    loading,
    fetchClients,
    batchSaveClients
  };
}
