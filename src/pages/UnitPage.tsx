import { useState, useEffect } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { UnitItem } from '../types';
import { supabase } from '../lib/supabase';

export function UnitPage() {
  const [items, setItems] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('units').select('*').eq('is_deleted', false);
        if (error) throw error;
        if (data) setItems(data);
      } catch (error) {
        console.error('Error fetching units:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const columns: Column<UnitItem>[] = [
    { key: 'name', header: '単位名', editable: true, inputType: 'text' },
    { key: 'description', header: '説明', editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: UnitItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('units').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      const newItems = drafts.filter(item => !deletedIds.includes(item.id) && item.id.startsWith('UNIT-'));
      const existingItems = drafts.filter(item => !deletedIds.includes(item.id) && !item.id.startsWith('UNIT-'));

      for (const item of existingItems) {
        const { error } = await supabase.from('units').update({
          name: item.name,
          description: item.description
        }).eq('id', item.id);
        if (error) throw error;
      }

      if (newItems.length > 0) {
        const inserts = newItems.map(item => ({
          code: `UNIT-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
          name: item.name,
          description: item.description
        }));
        const { error } = await supabase.from('units').insert(inserts);
        if (error) throw error;
      }

      const { data, error: reloadError } = await supabase.from('units').select('*').eq('is_deleted', false);
      if (reloadError) throw reloadError;
      if (data) setItems(data);
      alert('保存が完了しました。');
    } catch (error) {
      console.error('Error saving units:', error);
      alert('保存中にエラーが発生しました。コンソールをご確認ください。');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    return {
      id: `UNIT-${Date.now()}`,
      name: '',
      description: ''
    } as UnitItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title="単位設定"
      data={items} 
      columns={columns} 
      emptyMessage="単位データがありません" 
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
