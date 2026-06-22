import { DataPage, type Column } from '../components';
import { useState, useEffect } from 'react';
import type { LocationItem } from '../types';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';

export function LocationPage() {
  const [items, setItems] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('locations').select('*').eq('is_deleted', false).order('yomigana', { ascending: true });
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
    { key: 'name', header: TABLE_COLUMNS.LOCATION_NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, editable: true, inputType: 'text' },
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

      const { data, error: reloadError } = await supabase.from('locations').select('*').eq('is_deleted', false).order('yomigana', { ascending: true });
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
      id: `LOC-${Date.now()}`,
      name: '',
      yomigana: '',
      description: ''
    } as LocationItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title={PAGE_NAMES.LOCATION}
      data={items} 
      columns={columns} 
      emptyMessage={MESSAGES.EMPTY_LOCATION} 
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
