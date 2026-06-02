import { useState, useMemo } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { MasterItem } from '../types';
import { db } from '../mock';

export function MasterPage() {
  const [items, setItems] = useState<MasterItem[]>(db.master);

  const categoryOptions = useMemo(() => [{ label: '', value: '' }, ...db.category.map(c => ({ label: c.name, value: c.name }))], []);
  const supplierOptions = useMemo(() => [{ label: '', value: '' }, ...db.supplier.map(s => ({ label: s.name, value: s.name }))], []);

  const columns: Column<MasterItem>[] = [
    { key: 'name', header: '品目', editable: true, inputType: 'text' },
    { key: 'manufacturer', header: '製造元', editable: true, inputType: 'text' },
    { key: 'contentAmount', header: '内容量', className: 'quantity', editable: true, inputType: 'number' },
    { key: 'contentUnit', header: '内容量単位', editable: true, inputType: 'text' },
    { key: 'supplier', header: '仕入先', editable: true, inputType: 'select', options: supplierOptions },
    { key: 'standardPrice', header: '標準単価 (円)', className: 'quantity', editable: true, inputType: 'number', render: (item) => item.standardPrice.toLocaleString() },
    { key: 'standardPurchaseQty', header: '標準仕入数量', className: 'quantity', editable: true, inputType: 'number' },
    { key: 'category', header: 'カテゴリ', editable: true, inputType: 'select', options: categoryOptions },
    { 
      key: 'locations', 
      header: '保管場所',
      editable: false,
      render: (item) => item.locations.join(', ')
    },
  ];

  const handleBatchSave = (drafts: MasterItem[], deletedIds: string[]) => {
    // 削除されたIDを除外
    const afterDelete = drafts.filter(item => !deletedIds.includes(item.id));
    setItems(afterDelete);
    alert('保存しました。');
  };

  const handleAdd = () => {
    return {
      id: `MST-${Date.now()}`,
      name: '',
      manufacturer: '',
      contentAmount: 0,
      contentUnit: '',
      supplier: '',
      standardPrice: 0,
      standardPurchaseQty: 0,
      category: '',
      locations: []
    } as MasterItem;
  };

  return (
    <DataPage 
      title="品目設定"
      data={items} 
      columns={columns} 
      emptyMessage="マスタデータがありません" 
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
