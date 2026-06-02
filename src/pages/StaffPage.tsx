import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { StaffItem } from '../types';
import { db } from '../mock';

export function StaffPage() {
  const [items, setItems] = useState<StaffItem[]>(db.staff);

  const roleOptions = [
    { label: '', value: '' },
    { label: '管理者', value: '管理者' },
    { label: 'スタッフ', value: 'スタッフ' }
  ];

  const statusOptions = [
    { label: '', value: '' },
    { label: '有効', value: 'active' },
    { label: '無効', value: 'inactive' }
  ];

  const columns: Column<StaffItem>[] = [
    { key: 'name', header: '氏名', editable: true, inputType: 'text' },
    { key: 'role', header: '権限ロール', editable: true, inputType: 'select', options: roleOptions },
    { 
      key: 'status', 
      header: 'ステータス',
      editable: true,
      inputType: 'select',
      options: statusOptions,
      render: (item) => item.status === 'active' ? '有効' : '無効' 
    },
  ];

  const handleBatchSave = (drafts: StaffItem[], deletedIds: string[]) => {
    const afterDelete = drafts.filter(item => !deletedIds.includes(item.id)).map(item => ({
      ...item,
      name: item.name.replace(/[\s　]+/g, '')
    }));
    setItems(afterDelete);
    alert('保存しました。');
  };

  const handleAdd = () => {
    return {
      id: `STF-${Date.now()}`,
      name: '',
      role: '',
      status: ''
    } as unknown as StaffItem;
  };

  return (
    <DataPage 
      title="スタッフ設定"
      data={items} 
      columns={columns} 
      emptyMessage="スタッフデータがありません" 
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
