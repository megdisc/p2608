import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { ClientItem } from '../types';

export function useClients() {
  const [items, setItems] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_deleted', false)
        .order('yomigana', { ascending: true });
      
      if (error) throw error;
      
      const formatted = (data || []).map(d => ({
        id: d.id,
        name: d.name,
        yomigana: d.yomigana || '',
        contactPerson: d.contact_person || '',
        phone: d.phone || ''
      }));
      setItems(formatted);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveClients = async (drafts: ClientItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('clients').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      const activeItems = drafts.filter(item => !deletedIds.includes(item.id));
      const upserts = activeItems.map(item => ({
        id: item.id.startsWith('CLI-') ? undefined : item.id,
        name: item.name,
        yomigana: item.yomigana,
        contact_person: item.contactPerson,
        phone: item.phone
      }));

      if (upserts.length > 0) {
        const { error } = await supabase.from('clients').upsert(upserts);
        if (error) throw error;
      }

      await fetchClients();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    loading,
    fetchClients,
    batchSaveClients
  };
}
