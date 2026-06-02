import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { LocationItem } from '../types';
import { db } from '../mock';

export function LocationPage() {
  const [items] = useState<LocationItem[]>(db.location);

  const columns: Column<LocationItem>[] = [
    { key: 'name', header: '保管場所名' },
    { key: 'type', header: '温度帯区分' },
    { key: 'description', header: '用途・説明' },
  ];

  return (
    <DataPage 
      title="保管場所設定"
      data={items} 
      columns={columns} 
      emptyMessage="保管場所データがありません" 
    />
  );
}
