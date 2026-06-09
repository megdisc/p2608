import { useState, useEffect } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { SupplierItem } from '../types';
import { supabase } from '../lib/supabase';
import { useAlert } from '../contexts/AlertContext';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';

export function SupplierPage() {
  const [items, setItems] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('suppliers').select('*').eq('is_deleted', false);
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
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const columns: Column<SupplierItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.SUPPLIER_NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'contactPerson', header: TABLE_COLUMNS.CONTACT_PERSON, editable: true, inputType: 'text' },
    { key: 'phone', header: TABLE_COLUMNS.PHONE, editable: true, inputType: 'number' },
  ];

  const handleBatchSave = async (drafts: SupplierItem[], deletedIds: string[]) => {
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

      const { data, error: reloadError } = await supabase.from('suppliers').select('*').eq('is_deleted', false);
      if (reloadError) throw reloadError;
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
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error(err);
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    return {
      id: `SUP-${Date.now()}`,
      name: '',
      yomigana: '',
      contactPerson: '',
      phone: ''
    } as SupplierItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.SUPPLIER}
      data={items} 
      columns={columns} 
      emptyMessage={MESSAGES.EMPTY_SUPPLIER} 
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
