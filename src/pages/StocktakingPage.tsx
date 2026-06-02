import { useState, useMemo } from 'react';
import { DataPage } from '../components/page';
import { DateTimeDisplay } from '../components/ui';
import type { Column } from '../components/ui';
import type { StocktakingItem } from '../types';
import { db } from '../mock';

export function StocktakingPage() {
  const [items, setItems] = useState<StocktakingItem[]>(db.stocktaking);

  const categoryOptions = useMemo(() => [{ label: '', value: '' }, ...db.category.map(c => ({ label: c.name, value: c.name }))], []);
  const locationOptions = useMemo(() => [{ label: '', value: '' }, ...db.location.map(l => ({ label: l.name, value: l.name }))], []);
  const itemOptions = useMemo(() => [{ label: '', value: '' }, ...db.master.map(m => ({ label: m.name, value: m.name }))], []);
  const staffOptions = useMemo(() => [{ label: '', value: '' }, ...db.staff.map(s => ({ label: s.name, value: s.name }))], []);

  const columns: Column<StocktakingItem>[] = [
    { 
      key: 'date', 
      header: '日時',
      editable: true,
      inputType: 'datetime-local',
      render: (item) => <DateTimeDisplay value={item.date} />
    },
    { key: 'category', header: 'カテゴリ', editable: true, inputType: 'select', options: categoryOptions },
    { key: 'itemName', header: '品目', editable: true, inputType: 'select', options: itemOptions },
    { key: 'location', header: '保管場所', editable: true, inputType: 'select', options: locationOptions },
    { key: 'systemQty', header: '帳簿在庫', className: 'quantity', editable: false },
    { key: 'actualQty', header: '実在庫', className: 'quantity', editable: true, inputType: 'number' },
    { 
      key: 'difference', 
      header: '差異', 
      className: 'quantity',
      editable: false,
      render: (item) => {
        const color = item.difference > 0 ? '#1c7ed6' : (item.difference < 0 ? '#e03131' : 'inherit');
        return (
          <span style={{ color }}>
            {item.difference > 0 ? `+${item.difference}` : item.difference}
          </span>
        );
      }
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
      category: '',
      itemName: '',
      systemQty: 0,
      actualQty: 0,
      difference: 0,
      location: '',
      personInCharge: ''
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
