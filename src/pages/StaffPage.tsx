import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { StaffItem } from '../types';
import { db } from '../mock';

export function StaffPage() {
  const [items, setItems] = useState<StaffItem[]>(db.staff);

  const roleOptions = [
    { label: '', value: '' },
    { label: 'システム管理者', value: 'システム管理者' },
    { label: '現場スタッフ', value: '現場スタッフ' },
    { label: '経理担当', value: '経理担当' }
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
    const afterDelete = drafts.filter(item => !deletedIds.includes(item.id));
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
