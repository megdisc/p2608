import { useState } from 'react';
import { DataTable } from '../components/ui';
import type { Column } from '../components/ui';
import type { StocktakingItem } from '../types';
import { db } from '../mock';

export function StocktakingPage() {
  const [items] = useState<StocktakingItem[]>(db.stocktaking);

  const columns: Column<StocktakingItem>[] = [
    { key: 'id', header: 'ID', className: 'item-id' },
    { key: 'date', header: '日時' },
    { key: 'itemId', header: '品目ID', className: 'item-id' },
    { key: 'itemName', header: '品目' },
    { key: 'systemQty', header: '帳簿在庫', className: 'quantity' },
    { key: 'actualQty', header: '実在庫', className: 'quantity' },
    { 
      key: 'difference', 
      header: '差異', 
      className: 'quantity',
      render: (item) => (
        <span style={{ color: item.difference !== 0 ? '#e03131' : 'inherit' }}>
          {item.difference > 0 ? `+${item.difference}` : item.difference}
        </span>
      )
    },
    { key: 'personInCharge', header: '担当者' },
    { key: 'location', header: '保管場所' },
  ];

  return (
    <>
      <h2>棚卸記録</h2>
      <DataTable 
        data={items} 
        columns={columns} 
        emptyMessage="棚卸記録がありません" 
      />
    </>
  );
}
