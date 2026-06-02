import { useState, useMemo } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { StocktakingItem } from '../types';
import { db } from '../mock';

export function StocktakingPage() {
  const [items, setItems] = useState<StocktakingItem[]>(db.stocktaking);

  const categoryOptions = useMemo(() => db.category.map(c => ({ label: c.name, value: c.name })), []);
  const locationOptions = useMemo(() => db.location.map(l => ({ label: l.name, value: l.name })), []);
  const itemOptions = useMemo(() => db.master.map(m => ({ label: m.name, value: m.name })), []);
  const staffOptions = useMemo(() => db.staff.map(s => ({ label: s.name, value: s.name })), []);

  const columns: Column<StocktakingItem>[] = [
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
    { key: 'systemQty', header: '帳簿在庫', className: 'quantity', editable: true, inputType: 'number' },
    { key: 'actualQty', header: '実在庫', className: 'quantity', editable: true, inputType: 'number' },
    { 
      key: 'difference', 
      header: '差異', 
      className: 'quantity',
      editable: false,
      render: (item) => (
        <span style={{ color: item.difference !== 0 ? '#e03131' : 'inherit' }}>
          {item.difference > 0 ? `+${item.difference}` : item.difference}
        </span>
      )
    },
    { key: 'personInCharge', header: '担当者', editable: true, inputType: 'select', options: staffOptions },
  ];

  const handleBatchSave = (drafts: StocktakingItem[], deletedIds: string[]) => {
    const afterDelete = drafts.filter(item => !deletedIds.includes(item.id));
    
    // 差異の再計算
    const recalculated = afterDelete.map(item => ({
      ...item,
      difference: item.actualQty - item.systemQty
    }));
    
    setItems(recalculated);
    alert('保存しました。');
  };

  const handleAdd = () => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    return {
      id: `STK-${Date.now()}`,
      date: formattedDate,
      itemId: '',
      category: categoryOptions[0]?.value || '',
      itemName: itemOptions[0]?.value || '',
      systemQty: 0,
      actualQty: 0,
      difference: 0,
      location: locationOptions[0]?.value || '',
      personInCharge: staffOptions[0]?.value || ''
    } as StocktakingItem;
  };

  return (
    <DataPage 
      title="棚卸記録"
      data={items} 
      columns={columns} 
      emptyMessage="棚卸記録がありません" 
      initialSort={{ key: 'date', direction: 'desc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
