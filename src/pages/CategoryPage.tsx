import { DataPage, type Column } from '../components';
import { useState, useEffect } from 'react';
import type { CategoryItem } from '../types';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';

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
    { key: 'name', header: TABLE_COLUMNS.CATEGORY_NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, editable: true, inputType: 'text' },
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
      id: `CAT-${Date.now()}`,
      name: '',
      yomigana: '',
      description: ''
    } as CategoryItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.CATEGORY}
      data={items} 
      columns={columns} 
      emptyMessage={MESSAGES.EMPTY_CATEGORY} 
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
