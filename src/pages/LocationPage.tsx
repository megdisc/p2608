import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { LocationItem } from '../types';
import { db } from '../mock';

export function LocationPage() {
  const [items, setItems] = useState<LocationItem[]>(db.location);

  const columns: Column<LocationItem>[] = [
    { key: 'name', header: '保管場所名', editable: true, inputType: 'text' },
    { key: 'description', header: '説明', editable: true, inputType: 'text' },
  ];

  const handleBatchSave = (drafts: LocationItem[], deletedIds: string[]) => {
    const afterDelete = drafts.filter(item => !deletedIds.includes(item.id));
    setItems(afterDelete);
    alert('保存しました。');
  };

  const handleAdd = () => {
    return {
      id: `LOC-${Date.now()}`,
      name: '',
      description: ''
    } as LocationItem;
  };

  return (
    <DataPage 
      title="保管場所設定"
      data={items} 
      columns={columns} 
      emptyMessage="保管場所データがありません" 
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
