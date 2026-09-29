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
      const [partnersRes, allCodesRes] = await Promise.all([
        supabase.from('partners').select(`
          *,
          partner_contacts (*)
        `).eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('partners').select('code, created_at').order('created_at', { ascending: false })
      ]);

      if (partnersRes.error) throw partnersRes.error;

      const formatted: ClientItem[] = (partnersRes.data || []).map((d: any) => {
        const contacts: PartnerContactItem[] = (d.partner_contacts || [])
          .filter((c: any) => !c.is_deleted)
          .map((c: any) => ({
            id: c.id,
            partnerId: c.partner_id,
            contactName: c.name || '',
            department: c.department || '',
            position: c.position || '',
            contactPhone: c.phone || '',
            email: c.email || '',
            isPrimary: c.is_primary || false,
          }));

        const primaryContact = contacts.find(c => c.isPrimary) || contacts[0];
        const contactPersonFallback = primaryContact ? primaryContact.contactName : (d.contact_person || '');

        return {
          id: d.id,
          code: d.code || '',
          name: d.name,
          yomigana: d.yomigana || '',
          isCustomer: d.is_customer ?? true,
          isSubcontractor: d.is_subcontractor ?? true,
          contactPerson: contactPersonFallback,
          phone: d.phone || '',
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
        // Handle deleted partner contacts
        const partnerIdsToDelete = deletedIds.filter(id => !id.startsWith('CNT-'));
        const contactIdsToDelete = deletedIds.filter(id => id.startsWith('CNT-') || !partnerIdsToDelete.includes(id));

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
        const primaryContact = (item.contacts || []).find(c => c.isPrimary) || (item.contacts || [])[0];

        const upsertPartnerData: any = {
          code: item.code?.trim() || null,
          name: item.name,
          yomigana: item.yomigana,
          is_customer: item.isCustomer ?? true,
          is_subcontractor: item.isSubcontractor ?? true,
          contact_person: primaryContact?.contactName || item.contactPerson || '',
          phone: item.phone
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
              department: c.department || '',
              position: c.position || '',
              phone: c.contactPhone || '',
              email: c.email || '',
              is_primary: c.isPrimary ?? false
            };
            if (!c.id.startsWith('CNT-')) {
              upsertContactData.id = c.id;
            }

            const { error: cErr } = await supabase.from('partner_contacts').upsert(upsertContactData);
            if (cErr) throw cErr;
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

