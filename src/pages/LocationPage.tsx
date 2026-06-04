import { useState, useEffect } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { LocationItem } from '../types';
import { supabase } from '../lib/supabase';

export function LocationPage() {
  const [items, setItems] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('locations').select('*').eq('is_deleted', false);
        if (error) throw error;
        if (data) setItems(data);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const columns: Column<LocationItem>[] = [
    { key: 'name', header: '保管場所名', sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: 'よみがな', editable: true, inputType: 'text' },
    { key: 'description', header: '説明', editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: LocationItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('locations').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      const newItems = drafts.filter(item => !deletedIds.includes(item.id) && item.id.startsWith('LOC-'));
      const existingItems = drafts.filter(item => !deletedIds.includes(item.id) && !item.id.startsWith('LOC-'));

      for (const item of existingItems) {
        const { error } = await supabase.from('locations').update({
          name: item.name,
          yomigana: item.yomigana || '',
          description: item.description
        }).eq('id', item.id);
        if (error) throw error;
      }

      if (newItems.length > 0) {
        const inserts = newItems.map(item => ({
          code: `LOC-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
          name: item.name,
          yomigana: item.yomigana || '',
          description: item.description
        }));
        const { error } = await supabase.from('locations').insert(inserts);
        if (error) throw error;
      }

      const { data, error: reloadError } = await supabase.from('locations').select('*').eq('is_deleted', false);
      if (reloadError) throw reloadError;
      if (data) setItems(data);
      alert('保存が完了しました。');
    } catch (error) {
      console.error('Error saving locations:', error);
      alert('保存中にエラーが発生しました。コンソールをご確認ください。');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    return {
      id: `LOC-${Date.now()}`,
      name: '',
      yomigana: '',
      description: ''
    } as LocationItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title="保管場所設定"
      data={items} 
      columns={columns} 
      emptyMessage="保管場所データがありません" 
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
