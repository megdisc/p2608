import { useState, useMemo } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { MasterItem } from '../types';
import { db } from '../mock';

export function MasterPage() {
  const [items, setItems] = useState<MasterItem[]>(db.master);

  const categoryOptions = useMemo(() => [{ label: '', value: '' }, ...db.category.map(c => ({ label: c.name, value: c.name }))], []);
  const unitOptions = useMemo(() => [{ label: '', value: '' }, ...db.unit.map(u => ({ label: u.name, value: u.name }))], []);
  const supplierOptions = useMemo(() => [{ label: '', value: '' }, ...db.supplier.map(s => ({ label: s.name, value: s.name }))], []);
  const locationOptions = useMemo(() => [{ label: '', value: '' }, ...db.location.map(l => ({ label: l.name, value: l.name }))], []);

  const columns: Column<MasterItem>[] = [
    { key: 'category', header: 'カテゴリ', editable: true, inputType: 'select', options: categoryOptions },
    { key: 'name', header: '品目', editable: true, inputType: 'text' },
    { key: 'manufacturer', header: '製造元', editable: true, inputType: 'text' },
    { key: 'contentAmount', header: '内容量', className: 'quantity', editable: true, inputType: 'number' },
    { key: 'contentUnit', header: '内容量単位', editable: true, inputType: 'select', options: unitOptions },
    { 
      key: 'location', 
      header: '標準保管場所',
      editable: true,
      inputType: 'select',
      options: locationOptions
    },
    { key: 'supplier', header: '仕入先', editable: true, inputType: 'select', options: supplierOptions },
    { key: 'standardPrice', header: '標準単価 (円)', className: 'quantity', editable: true, inputType: 'number', render: (item) => item.standardPrice.toLocaleString() },
    { key: 'standardPurchaseQty', header: '標準仕入数量', className: 'quantity', editable: true, inputType: 'number' },
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
      location: ''
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
