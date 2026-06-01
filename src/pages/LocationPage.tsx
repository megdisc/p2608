import { useState } from 'react';
import { DataTable } from '../components/ui';
import type { Column } from '../components/ui';
import type { LocationItem } from '../types';
import { db } from '../mock';

export function LocationPage() {
  const [items] = useState<LocationItem[]>(db.location);

  const columns: Column<LocationItem>[] = [
    { key: 'id', header: 'ID', className: 'item-id' },
    { key: 'name', header: '保管場所名' },
    { key: 'type', header: '温度帯区分' },
    { key: 'description', header: '用途・説明' },
  ];

  return (
    <>
      <h2>保管場所設定</h2>
      <DataTable 
        data={items} 
        columns={columns} 
        emptyMessage="保管場所データがありません" 
      />
    </>
  );
}
