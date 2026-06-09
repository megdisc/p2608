import { useState, useEffect } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { StaffItem } from '../types';
import { supabase } from '../lib/supabase';
import { useAlert } from '../contexts/AlertContext';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';

export function StaffPage() {
  const [items, setItems] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('staffs').select('*').eq('is_deleted', false);
        if (error) throw error;
        if (data) setItems(data);
      } catch (error) {
        console.error('Error fetching staffs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const roleOptions = [
    { label: '', value: '' },
    { label: 'システム管理者', value: 'システム管理者' },
    { label: 'スタッフ', value: 'スタッフ' }
  ];



  const columns: Column<StaffItem>[] = [
    { key: 'name', header: TABLE_COLUMNS.NAME, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'role', header: TABLE_COLUMNS.ROLE, editable: true, inputType: 'select', options: roleOptions },
    { key: 'email', header: TABLE_COLUMNS.EMAIL, editable: true, inputType: 'email' },
    { key: 'password', header: TABLE_COLUMNS.PASSWORD, editable: true, inputType: 'password' },
  ];

  const handleBatchSave = async (drafts: StaffItem[], deletedIds: string[]) => {
    try {
      setLoading(true);

      // Handle deletes
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('staffs').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      // Handle upserts
      for (const item of drafts) {
        if (!deletedIds.includes(item.id)) {
          const cleanName = item.name.replace(/[\s　]+/g, '');
          if (item.id.startsWith('STF-')) {
            // New user: call RPC
            const { error } = await supabase.rpc('create_staff_user', {
              email: item.email || '',
              password: item.password || '',
              name: cleanName,
              yomigana: item.yomigana || '',
              role: item.role
            });
            if (error) throw error;
          } else {
            // Existing user: update staffs table
            const { error: staffError } = await supabase.from('staffs').update({
              name: cleanName,
              yomigana: item.yomigana || '',
              email: item.email,
              role: item.role
            }).eq('id', item.id);
            if (staffError) throw staffError;

            // If password is provided, update password via RPC
            if (item.password) {
              const { error: passError } = await supabase.rpc('update_staff_password', {
                user_id: item.id,
                new_password: item.password
              });
              if (passError) throw passError;
            }
          }
        }
      }

      // Reload
      const { data, error: reloadError } = await supabase.from('staffs').select('*').eq('is_deleted', false);
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
      id: `STF-${Date.now()}`,
      name: '',
      yomigana: '',
      email: '',
      password: '',
      role: ''
    } as unknown as StaffItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.STAFF}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_STAFF}
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
