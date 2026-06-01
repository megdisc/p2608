import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { InventoryItem } from '../types';
import { db } from '../mock';

export function InventoryPage() {
  const [items] = useState<InventoryItem[]>(db.inventory);

  const columns: Column<InventoryItem>[] = [
    { key: 'id', header: 'ID', className: 'item-id' },
    { key: 'name', header: '品目' },
    { key: 'quantity', header: '在庫数量', className: 'quantity' },
  ];

  return (
    <DataPage 
      title="在庫集計"
      data={items} 
      columns={columns} 
      emptyMessage="在庫データがありません" 
    />
  );
}
