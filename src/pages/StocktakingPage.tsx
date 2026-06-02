import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { StocktakingItem } from '../types';
import { db } from '../mock';

export function StocktakingPage() {
  const [items] = useState<StocktakingItem[]>(db.stocktaking);

  const columns: Column<StocktakingItem>[] = [
    { 
      key: 'date', 
      header: '日時',
      render: (item) => {
        const [datePart, timePart] = item.date.split(' ');
        const [y, m, d] = datePart.split('-');
        return `${y}年${m}月${d}日 ${timePart}`;
      }
    },
    { key: 'itemName', header: '品目' },
    { key: 'location', header: '保管場所' },
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
  ];

  return (
    <DataPage 
      title="棚卸記録"
      data={items} 
      columns={columns} 
      emptyMessage="棚卸記録がありません" 
      initialSort={{ key: 'date', direction: 'desc' }}
    />
  );
}
