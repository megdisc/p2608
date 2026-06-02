import { useState, useMemo } from 'react';
import { DataPage } from '../components/page';
import { DateTimeDisplay } from '../components/ui';
import type { Column } from '../components/ui';
import type { TransactionItem } from '../types';
import { db } from '../mock';

export function TransactionPage() {
  const [items, setItems] = useState<TransactionItem[]>(db.transaction);

  const categoryOptions = useMemo(() => [{ label: '', value: '' }, ...db.category.map(c => ({ label: c.name, value: c.name }))], []);
  const locationOptions = useMemo(() => [{ label: '', value: '' }, ...db.location.map(l => ({ label: l.name, value: l.name }))], []);
  const itemOptions = useMemo(() => [{ label: '', value: '' }, ...db.master.map(m => ({ label: m.name, value: m.name }))], []);
  const staffOptions = useMemo(() => [{ label: '', value: '' }, ...db.staff.map(s => ({ label: s.name, value: s.name }))], []);

  const typeOptions = [
    { label: '', value: '' },
    { label: '受入', value: '受入' },
    { label: '払出', value: '払出' }
  ];

  const columns: Column<TransactionItem>[] = [
    { 
      key: 'date', 
      header: '記録日時',
      editable: true,
      inputType: 'datetime-local',
      render: (item) => <DateTimeDisplay value={item.date} />
    },
    { key: 'category', header: 'カテゴリ', editable: true, inputType: 'select', options: categoryOptions },
    { key: 'itemName', header: '品目', editable: true, inputType: 'select', options: itemOptions },
    { key: 'location', header: '保管場所', editable: true, inputType: 'select', options: locationOptions },
    { key: 'type', header: '区分', editable: true, inputType: 'select', options: typeOptions },
    { key: 'quantity', header: '数量', className: 'quantity', editable: true, inputType: 'number' },
    { key: 'personInCharge', header: '記録者', editable: true, inputType: 'select', options: staffOptions },
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
      category: '',
      itemName: '',
      type: '',
      quantity: 0,
      location: '',
      personInCharge: ''
    } as unknown as TransactionItem;
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
