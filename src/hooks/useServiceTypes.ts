import { useState, useCallback } from 'react';
import { supabase } from '../lib';

export type ServiceTypeItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
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

      const formatted: ServiceTypeItem[] = (data || []).map((st: any) => ({
        id: st.id,
        code: st.code || '',
        name: st.name || '',
        description: st.description || '',
        is_active: st.is_active ?? true
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
      for (const item of drafts) {
        const isDeleted = deletedIds.includes(item.id);
        const upsertData: any = {
          code: item.code.trim(),
          name: item.name,
          description: item.description || null,
          is_active: isDeleted ? false : (item.is_active ?? true),
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
