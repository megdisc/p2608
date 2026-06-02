import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { CategoryItem } from '../types';
import { db } from '../mock';

export function CategoryPage() {
  const [items] = useState<CategoryItem[]>(db.category);

  const columns: Column<CategoryItem>[] = [
    { key: 'name', header: 'カテゴリ名' },
    { key: 'description', header: '説明' },
  ];

  return (
    <DataPage 
      title="カテゴリ設定"
      data={items} 
      columns={columns} 
      emptyMessage="カテゴリデータがありません" 
    />
  );
}
