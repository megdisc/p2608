import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { TransactionItem } from '../types';
import { db } from '../mock';

export function TransactionPage() {
  const [items] = useState<TransactionItem[]>(db.transaction);

  const columns: Column<TransactionItem>[] = [
    { 
      key: 'date', 
      header: '日時',
      render: (item) => {
        const [datePart, timePart] = item.date.split(' ');
        const [y, m, d] = datePart.split('-');
        return `${y}年${m}月${d}日 ${timePart}`;
      }
    },
    { key: 'category', header: 'カテゴリ' },
    { key: 'itemName', header: '品目' },
    { key: 'location', header: '保管場所' },
    { key: 'type', header: '区分' },
    { key: 'quantity', header: '数量', className: 'quantity' },
    { key: 'personInCharge', header: '担当者' },
  ];

  return (
    <DataPage 
      title="受入・払出記録"
      data={items} 
      columns={columns} 
      emptyMessage="記録データがありません" 
      initialSort={{ key: 'date', direction: 'desc' }}
    />
  );
}
