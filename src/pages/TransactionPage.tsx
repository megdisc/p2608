import { useState, useMemo } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { TransactionItem } from '../types';
import { db } from '../mock';

export function TransactionPage() {
  const [items, setItems] = useState<TransactionItem[]>(db.transaction);

  const categoryOptions = useMemo(() => db.category.map(c => ({ label: c.name, value: c.name })), []);
  const locationOptions = useMemo(() => db.location.map(l => ({ label: l.name, value: l.name })), []);
  const itemOptions = useMemo(() => db.master.map(m => ({ label: m.name, value: m.name })), []);
  const staffOptions = useMemo(() => db.staff.map(s => ({ label: s.name, value: s.name })), []);

  const typeOptions = [
    { label: '受入', value: '受入' },
    { label: '払出', value: '払出' }
  ];

  const columns: Column<TransactionItem>[] = [
    { 
      key: 'date', 
      header: '日時',
      editable: true,
      inputType: 'text',
      render: (item) => {
        const parts = item.date.split(' ');
        if (parts.length !== 2) return item.date;
        const [datePart, timePart] = parts;
        const dateParts = datePart.split('-');
        if (dateParts.length !== 3) return item.date;
        const [y, m, d] = dateParts;
        return `${y}年${m}月${d}日 ${timePart}`;
      }
    },
    { key: 'category', header: 'カテゴリ', editable: true, inputType: 'select', options: categoryOptions },
    { key: 'itemName', header: '品目', editable: true, inputType: 'select', options: itemOptions },
    { key: 'location', header: '保管場所', editable: true, inputType: 'select', options: locationOptions },
    { key: 'type', header: '区分', editable: true, inputType: 'select', options: typeOptions },
    { key: 'quantity', header: '数量', className: 'quantity', editable: true, inputType: 'number' },
    { key: 'personInCharge', header: '担当者', editable: true, inputType: 'select', options: staffOptions },
  ];

  const handleBatchSave = (drafts: TransactionItem[], deletedIds: string[]) => {
    const afterDelete = drafts.filter(item => !deletedIds.includes(item.id));
    setItems(afterDelete);
    alert('保存しました。');
  };

  const handleAdd = () => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    return {
      id: `TRX-${Date.now()}`,
      date: formattedDate,
      itemId: '',
      category: categoryOptions[0]?.value || '',
      itemName: itemOptions[0]?.value || '',
      type: '受入',
      quantity: 1,
      location: locationOptions[0]?.value || '',
      personInCharge: staffOptions[0]?.value || ''
    } as TransactionItem;
  };

  return (
    <DataPage 
      title="受入・払出記録"
      data={items} 
      columns={columns} 
      emptyMessage="記録データがありません" 
      initialSort={{ key: 'date', direction: 'desc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
