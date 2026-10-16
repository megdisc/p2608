import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { ServiceTypeTableItem } from '../types/db';

export type ServiceTypeItem = {
  id: string;
  code: string;
  name: string;
  description: string;
};

export function useServiceTypes() {
  const [items, setItems] = useState<ServiceTypeItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchServiceTypes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;

      const formatted: ServiceTypeItem[] = ((data as ServiceTypeTableItem[]) || []).map((st) => ({
        id: st.id,
        code: st.code || '',
        name: st.name || '',
        description: st.description || ''
      }));

      setItems(formatted);
    } catch (err) {
      console.error('Error fetching service types:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveServiceTypes = async (drafts: ServiceTypeItem[], deletedIds: string[]) => {
    try {
      if (deletedIds.length > 0) {
        const realDeletedIds = deletedIds.filter(id => !id.startsWith('ST-'));
        if (realDeletedIds.length > 0) {
          const { error } = await supabase
            .from('service_types')
            .delete()
            .in('id', realDeletedIds);
          if (error) throw error;
        }
      }

      const activeItems = drafts.filter(i => !deletedIds.includes(i.id));
      for (const item of activeItems) {
        const upsertData: Partial<ServiceTypeTableItem> = {
          code: item.code.trim(),
          name: item.name,
          description: item.description || '',
        };
        if (!item.id.startsWith('ST-')) {
          upsertData.id = item.id;
        }

        const { error } = await supabase.from('service_types').upsert(upsertData);
        if (error) throw error;
      }

      await fetchServiceTypes();
    } catch (err) {
      console.error('Error saving service types:', err);
      throw err;
    }
  };

  return {
    items,
    loading,
    fetchServiceTypes,
    batchSaveServiceTypes
  };
}
