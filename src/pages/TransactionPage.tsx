import { useState } from 'react';
import { DataTable } from '../components/ui';
import type { Column } from '../components/ui';
import type { TransactionItem } from '../types';
import { db } from '../mock';

export function TransactionPage() {
  const [items] = useState<TransactionItem[]>(db.transaction);

  const columns: Column<TransactionItem>[] = [
    { key: 'id', header: 'ID', className: 'item-id' },
    { key: 'date', header: '日時' },
    { key: 'itemId', header: '品目ID', className: 'item-id' },
    { key: 'itemName', header: '品目' },
    { key: 'type', header: '区分' },
    { key: 'quantity', header: '数量', className: 'quantity' },
  ];

  return (
    <>
      <h2>受入・払出記録</h2>
      <DataTable 
        data={items} 
        columns={columns} 
        emptyMessage="記録データがありません" 
      />
    </>
  );
}
