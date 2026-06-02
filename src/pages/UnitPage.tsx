import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { UnitItem } from '../types';
import { db } from '../mock';

export function UnitPage() {
  const [items, setItems] = useState<UnitItem[]>(db.unit);

  const columns: Column<UnitItem>[] = [
    { key: 'name', header: '単位名', editable: true, inputType: 'text' },
    { key: 'description', header: '説明', editable: true, inputType: 'text' },
  ];

  const handleBatchSave = (drafts: UnitItem[], deletedIds: string[]) => {
    const afterDelete = drafts.filter(item => !deletedIds.includes(item.id));
    setItems(afterDelete);
    alert('保存しました。');
  };

  const handleAdd = () => {
    return {
      id: `UNIT-${Date.now()}`,
      name: '',
      description: ''
    } as UnitItem;
  };

  return (
    <DataPage 
      title="単位設定"
      data={items} 
      columns={columns} 
      emptyMessage="単位データがありません" 
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
