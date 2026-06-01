import { useState } from 'react';
import { DataTable } from '../components/ui';
import type { Column } from '../components/ui';
import type { CategoryItem } from '../types';
import { db } from '../mock';

export function CategoryPage() {
  const [items] = useState<CategoryItem[]>(db.category);

  const columns: Column<CategoryItem>[] = [
    { key: 'id', header: 'ID', className: 'item-id' },
    { key: 'name', header: 'カテゴリ名' },
    { key: 'description', header: '説明' },
  ];

  return (
    <>
      <h2>カテゴリ設定</h2>
      <DataTable 
        data={items} 
        columns={columns} 
        emptyMessage="カテゴリデータがありません" 
      />
    </>
  );
}
