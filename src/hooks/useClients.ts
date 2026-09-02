import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { ClientItem } from '../types';

export function useClients() {
  const [items, setItems] = useState<ClientItem[]>([]);
  const [lastDbCode, setLastDbCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const [partnersRes, allCodesRes] = await Promise.all([
        supabase.from('partners').select('*').eq('is_deleted', false).order('code', { ascending: true }),
        supabase.from('partners').select('code, created_at').order('created_at', { ascending: false })
      ]);

      if (partnersRes.error) throw partnersRes.error;

      const formatted = (partnersRes.data || []).map(d => ({
        id: d.id,
        code: d.code || '',
        name: d.name,
        yomigana: d.yomigana || '',
        isCustomer: d.is_customer ?? true,
        isSubcontractor: d.is_subcontractor ?? true,
        contactPerson: d.contact_person || '',
        phone: d.phone || ''
      }));
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
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('partners').update({ deleted_at: new Date().toISOString() }).in('id', deletedIds);
        if (error) throw error;
      }

      const activeItems = drafts.filter(item => !deletedIds.includes(item.id));
      for (const item of activeItems) {
        const upsertData: any = {
          code: item.code?.trim() || null,
          name: item.name,
          yomigana: item.yomigana,
          is_customer: item.isCustomer ?? true,
          is_subcontractor: item.isSubcontractor ?? true,
          contact_person: item.contactPerson,
          phone: item.phone
        };
        if (!item.id.startsWith('CLI-')) {
          upsertData.id = item.id;
        }
        const { error } = await supabase.from('partners').upsert(upsertData);
        if (error) {
          if (error.code === '23505' || error.message?.includes('duplicate key') || error.details?.includes('code')) {
            throw new Error(`取引先ID「${item.code}」は既に使用されています（削除済み含む）。別のIDを指定してください。`);
          }
          throw error;
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
