import { DataPage, type Column } from '../components';
import { useState, useEffect } from 'react';
import type { MemberItem } from '../types';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, MEMBER_ROLE_OPTIONS } from '../constants';

export function ProjectUserPage() {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('members').select('*').eq('is_deleted', false);
        if (error) throw error;
        if (data) setItems(data);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const columns: Column<MemberItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'role', header: TABLE_COLUMNS.ROLE, editable: true, inputType: 'select', options: MEMBER_ROLE_OPTIONS },
    { key: 'notes', header: TABLE_COLUMNS.NOTES, editable: true, inputType: 'text' },
  ];

  const handleBatchSave = async (drafts: MemberItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('members').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      const newItems = drafts.filter(item => !deletedIds.includes(item.id) && item.id.startsWith('MBR-'));
      const existingItems = drafts.filter(item => !deletedIds.includes(item.id) && !item.id.startsWith('MBR-'));

      for (const item of existingItems) {
        const { error } = await supabase.from('members').update({
          name: item.name,
          yomigana: item.yomigana || '',
          role: item.role,
          notes: item.notes || ''
        }).eq('id', item.id);
        if (error) throw error;
      }

      if (newItems.length > 0) {
        const inserts = newItems.map(item => ({
          name: item.name,
          yomigana: item.yomigana || '',
          role: item.role,
          notes: item.notes || ''
        }));
        const { error } = await supabase.from('members').insert(inserts);
        if (error) throw error;
      }

      const { data, error: reloadError } = await supabase.from('members').select('*').eq('is_deleted', false);
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
      id: `MBR-${Date.now()}`,
      name: '',
      yomigana: '',
      notes: '',
      role: '利用者'
    } as MemberItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.PROJECT_USER}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_PROJECT_USER}
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
