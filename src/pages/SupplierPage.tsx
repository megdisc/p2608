import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { SupplierItem } from '../types';
import { db } from '../mock';

export function SupplierPage() {
  const [items, setItems] = useState<SupplierItem[]>(db.supplier);

  const columns: Column<SupplierItem>[] = [
    { key: 'name', header: '仕入先名', editable: true, inputType: 'text' },
    { key: 'contactPerson', header: '担当者', editable: true, inputType: 'text' },
    { key: 'phone', header: '電話番号', editable: true, inputType: 'text' },
  ];

  const handleBatchSave = (drafts: SupplierItem[], deletedIds: string[]) => {
    const afterDelete = drafts.filter(item => !deletedIds.includes(item.id));
    setItems(afterDelete);
    alert('保存しました。');
  };

  const handleAdd = () => {
    return {
      id: `SUP-${Date.now()}`,
      name: '',
      contactPerson: '',
      phone: ''
    } as SupplierItem;
  };

  return (
    <DataPage 
      title="仕入先設定"
      data={items} 
      columns={columns} 
      emptyMessage="仕入先データがありません" 
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
