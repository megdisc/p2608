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
        const { data, error } = await supabase.from('members').select('*').eq('is_deleted', false).order('yomigana', { ascending: true });
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
    { key: 'email', header: TABLE_COLUMNS.EMAIL, editable: true, inputType: 'email' },
    { key: 'password', header: TABLE_COLUMNS.PASSWORD, editable: true, inputType: 'password' },
  ];

  const handleBatchSave = async (drafts: MemberItem[], deletedIds: string[]) => {
    try {
      setLoading(true);
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('members').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      for (const item of drafts) {
        if (!deletedIds.includes(item.id)) {
          const cleanName = item.name.replace(/[\s　]+/g, '');
          if (item.id.startsWith('MBR-')) {
            const { error } = await supabase.rpc('create_member_user', {
              email: item.email || '',
              password: item.password || '',
              name: cleanName,
              yomigana: item.yomigana || '',
              role: item.role
            });
            if (error) throw error;
          } else {
            const { error: memberError } = await supabase.from('members').update({
              name: cleanName,
              yomigana: item.yomigana || '',
              email: item.email,
              role: item.role
            }).eq('id', item.id);
            if (memberError) throw memberError;

            if (item.password) {
              const { error: passError } = await supabase.rpc('update_member_password', {
                user_id: item.id,
                new_password: item.password
              });
              if (passError) throw passError;
            }
          }
        }
      }

      const { data, error: reloadError } = await supabase.from('members').select('*').eq('is_deleted', false).order('yomigana', { ascending: true });
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
      email: '',
      password: '',
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
