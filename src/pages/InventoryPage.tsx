import { useState } from 'react';
import { DataTable } from '../components/ui';
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
    <>
      <h2>在庫集計</h2>
      <DataTable 
        data={items} 
        columns={columns} 
        emptyMessage="在庫データがありません" 
      />
    </>
  );
}
