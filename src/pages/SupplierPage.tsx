import { useState } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { SupplierItem } from '../types';
import { db } from '../mock';

export function SupplierPage() {
  const [items] = useState<SupplierItem[]>(db.supplier);

  const columns: Column<SupplierItem>[] = [
    { key: 'name', header: '仕入先名' },
    { key: 'contactPerson', header: '担当者' },
    { key: 'phone', header: '電話番号' },
  ];

  return (
    <DataPage 
      title="仕入先設定"
      data={items} 
      columns={columns} 
      emptyMessage="仕入先データがありません" 
    />
  );
}
