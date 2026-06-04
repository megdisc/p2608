import { useState, useEffect } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { StaffItem } from '../types';
import { supabase } from '../lib/supabase';
import { useAlert } from '../contexts/AlertContext';

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

  const statusOptions = [
    { label: '', value: '' },
    { label: '有効', value: 'active' },
    { label: '無効', value: 'inactive' }
  ];

  const columns: Column<StaffItem>[] = [
    { key: 'name', header: '氏名', sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: 'ふりがな', editable: true, inputType: 'text' },
    { key: 'role', header: '権限ロール', editable: true, inputType: 'select', options: roleOptions },
    { key: 'email', header: 'メールアドレス', editable: true, inputType: 'email' },
    { key: 'password', header: 'パスワード', editable: true, inputType: 'password' },
    {
      key: 'status',
      header: 'ステータス',
      editable: true,
      inputType: 'select',
      options: statusOptions,
      render: (item) => item.status === 'active' ? '有効' : '無効'
    },
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
              role: item.role,
              status: item.status
            });
            if (error) throw error;
          } else {
            // Existing user: update staffs table
            const { error: staffError } = await supabase.from('staffs').update({
              name: cleanName,
              yomigana: item.yomigana || '',
              email: item.email,
              role: item.role,
              status: item.status
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
      showAlert('保存が完了しました。', 'success');
    } catch (error) {
      console.error('Error saving staffs:', error);
      showAlert('保存中にエラーが発生しました。コンソールをご確認ください。', 'error');
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
      role: '',
      status: 'active'
    } as unknown as StaffItem;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage
      title="スタッフ設定"
      data={items}
      columns={columns}
      emptyMessage="スタッフデータがありません"
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
