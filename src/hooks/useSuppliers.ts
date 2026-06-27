import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { SupplierItem } from '../types';

export function useSuppliers() {
  const [items, setItems] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('suppliers').select('*').eq('is_deleted', false).order('yomigana', { ascending: true });
      if (error) throw error;
      if (data) {
        const mapped = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          yomigana: d.yomigana,
          contactPerson: d.contact_person,
          phone: d.phone
        }));
        setItems(mapped);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveSuppliers = async (drafts: SupplierItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('suppliers').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      const newItems = drafts.filter(item => !deletedIds.includes(item.id) && item.id.startsWith('SUP-'));
      const existingItems = drafts.filter(item => !deletedIds.includes(item.id) && !item.id.startsWith('SUP-'));

      for (const item of existingItems) {
        const { error } = await supabase.from('suppliers').update({
          name: item.name,
          yomigana: item.yomigana || '',
          contact_person: item.contactPerson.replace(/[\s　]+/g, ''),
          phone: String(item.phone).replace(/-/g, '')
        }).eq('id', item.id);
        if (error) throw error;
      }

      if (newItems.length > 0) {
        const inserts = newItems.map(item => ({
          code: `SUP-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
          name: item.name,
          yomigana: item.yomigana || '',
          contact_person: item.contactPerson.replace(/[\s　]+/g, ''),
          phone: String(item.phone).replace(/-/g, '')
        }));
        const { error } = await supabase.from('suppliers').insert(inserts);
        if (error) throw error;
      }

      await fetchSuppliers();
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
    fetchSuppliers,
    batchSaveSuppliers
  };
}
