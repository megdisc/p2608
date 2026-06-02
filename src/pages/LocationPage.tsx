import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { LocationItem } from '../types';
import { db } from '../mock';

export function LocationPage() {
  const [items, setItems] = useState<LocationItem[]>(db.location);

  const typeOptions = [
    { label: '', value: '' },
    { label: '常温', value: '常温' },
    { label: '冷蔵', value: '冷蔵' },
    { label: '冷凍', value: '冷凍' }
  ];

  const columns: Column<LocationItem>[] = [
    { key: 'name', header: '保管場所名', editable: true, inputType: 'text' },
    { key: 'type', header: '温度帯区分', editable: true, inputType: 'select', options: typeOptions },
    { key: 'description', header: '用途・説明', editable: true, inputType: 'text' },
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
      type: '',
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
