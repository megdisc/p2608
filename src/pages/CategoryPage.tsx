import { useState, useEffect } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { CategoryItem } from '../types';
import { supabase } from '../lib/supabase';
import { useAlert } from '../contexts/AlertContext';

export function CategoryPage() {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('categories').select('*').eq('is_deleted', false);
        if (error) throw error;
        if (data) setItems(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const columns: Column<CategoryItem>[] = [
    { key: 'name', header: 'カテゴリ名', sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: 'よみがな', editable: true, inputType: 'text' },
    { key: 'description', header: '説明', editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: CategoryItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('categories').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      const newItems = drafts.filter(item => !deletedIds.includes(item.id) && item.id.startsWith('CAT-'));
      const existingItems = drafts.filter(item => !deletedIds.includes(item.id) && !item.id.startsWith('CAT-'));

      for (const item of existingItems) {
        const { error } = await supabase.from('categories').update({
          name: item.name,
          yomigana: item.yomigana || '',
          description: item.description
        }).eq('id', item.id);
        if (error) throw error;
      }

      if (newItems.length > 0) {
        const inserts = newItems.map(item => ({
          code: `CAT-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
          name: item.name,
          yomigana: item.yomigana || '',
          description: item.description
        }));
        const { error } = await supabase.from('categories').insert(inserts);
        if (error) throw error;
      }

      const { data, error: reloadError } = await supabase.from('categories').select('*').eq('is_deleted', false);
      if (reloadError) throw reloadError;
      if (data) setItems(data);
      showAlert('保存が完了しました。', 'success');
    } catch (error) {
      console.error('Error saving categories:', error);
      showAlert('保存中にエラーが発生しました。コンソールをご確認ください。', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    return {
      id: `CAT-${Date.now()}`,
      name: '',
      yomigana: '',
      description: ''
    } as CategoryItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title="カテゴリ設定"
      data={items} 
      columns={columns} 
      emptyMessage="カテゴリデータがありません" 
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
