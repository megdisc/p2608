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

  const handleBatchSave = (drafts: SupplierItem[], deletedIds: string[]) => {
    const afterDelete = drafts.filter(item => !deletedIds.includes(item.id)).map(item => ({
      ...item,
      contactPerson: item.contactPerson.replace(/[\s　]+/g, ''),
      phone: String(item.phone).replace(/-/g, '')
    }));
    setItems(afterDelete);
    alert('UI上での保存を反映しました。（※DB更新処理は未実装）');
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
