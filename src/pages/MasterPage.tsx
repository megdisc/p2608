import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { MasterItem } from '../types';
import { db } from '../mock';

export function MasterPage() {
  const [items] = useState<MasterItem[]>(db.master);

  const columns: Column<MasterItem>[] = [
    { key: 'id', header: 'ID', className: 'item-id' },
    { key: 'name', header: '品目' },
    { key: 'manufacturer', header: '製造元' },
    { key: 'contentAmount', header: '内容量', className: 'quantity' },
    { key: 'contentUnit', header: '内容量単位' },
    { key: 'supplier', header: '仕入先' },
    { key: 'standardPrice', header: '標準単価 (円)', className: 'quantity', render: (item) => item.standardPrice.toLocaleString() },
    { key: 'standardPurchaseQty', header: '標準仕入数量', className: 'quantity' },
    { key: 'category', header: 'カテゴリ' },
    { key: 'location', header: '保管場所' },
  ];

  return (
    <DataPage 
      title="品目設定"
      data={items} 
      columns={columns} 
      emptyMessage="マスタデータがありません" 
    />
  );
}
