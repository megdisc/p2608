import { useState } from 'react';
import { DataTable } from '../components/ui';
import type { Column } from '../components/ui';
import type { SupplierItem } from '../types';
import { db } from '../mock';

export function SupplierPage() {
  const [items] = useState<SupplierItem[]>(db.supplier);

  const columns: Column<SupplierItem>[] = [
    { key: 'id', header: 'ID', className: 'item-id' },
    { key: 'name', header: '仕入先名' },
    { key: 'contactPerson', header: '担当者' },
    { key: 'phone', header: '電話番号' },
  ];

  return (
    <>
      <h2>仕入先設定</h2>
      <DataTable 
        data={items} 
        columns={columns} 
        emptyMessage="仕入先データがありません" 
      />
    </>
  );
}
