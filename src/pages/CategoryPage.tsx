import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { CategoryItem } from '../types';
import { db } from '../mock';

export function CategoryPage() {
  const [items, setItems] = useState<CategoryItem[]>(db.category);

  const columns: Column<CategoryItem>[] = [
    { key: 'name', header: 'カテゴリ名', editable: true, inputType: 'text' },
    { key: 'description', header: '説明', editable: true, inputType: 'text' },
  ];

  const handleBatchSave = (drafts: CategoryItem[], deletedIds: string[]) => {
    const afterDelete = drafts.filter(item => !deletedIds.includes(item.id));
    setItems(afterDelete);
    alert('保存しました。');
  };

  const handleAdd = () => {
    return {
      id: `CAT-${Date.now()}`,
      name: '',
      description: ''
    } as CategoryItem;
  };

  return (
    <DataPage 
      title="カテゴリ設定"
      data={items} 
      columns={columns} 
      emptyMessage="カテゴリデータがありません" 
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
