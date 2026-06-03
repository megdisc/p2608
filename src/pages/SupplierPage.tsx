import { useState, useEffect } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { SupplierItem } from '../types';
import { supabase } from '../lib/supabase';

export function SupplierPage() {
  const [items, setItems] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('suppliers').select('*').eq('is_deleted', false);
        if (error) throw error;
        if (data) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            name: d.name,
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
    { key: 'name', header: '仕入先名', editable: true, inputType: 'text' },
    { key: 'contactPerson', header: '担当者', editable: true, inputType: 'text' },
    { key: 'phone', header: '電話番号', editable: true, inputType: 'number' },
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
          contact_person: item.contactPerson.replace(/[\s　]+/g, ''),
          phone: String(item.phone).replace(/-/g, '')
        }).eq('id', item.id);
        if (error) throw error;
      }

      if (newItems.length > 0) {
        const inserts = newItems.map(item => ({
          code: `SUP-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
          name: item.name,
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
          contactPerson: d.contact_person,
          phone: d.phone
        }));
        setItems(mapped);
      }
      alert('保存が完了しました。');
    } catch (error) {
      console.error('Error saving suppliers:', error);
      alert('保存中にエラーが発生しました。コンソールをご確認ください。');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    return {
      id: `SUP-${Date.now()}`,
      name: '',
      contactPerson: '',
      phone: ''
    } as SupplierItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title="仕入先設定"
      data={items} 
      columns={columns} 
      emptyMessage="仕入先データがありません" 
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
