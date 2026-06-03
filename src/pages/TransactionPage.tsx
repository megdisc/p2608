import { useState, useEffect, useMemo } from 'react';
import { DataPage } from '../components/page';
import { DateTimeDisplay } from '../components/ui';
import type { Column } from '../components/ui';
import type { TransactionItem } from '../types';
import { supabase } from '../lib/supabase';

export function TransactionPage() {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [categories, setCategories] = useState<{name: string}[]>([]);
  const [locations, setLocations] = useState<{name: string}[]>([]);
  const [masters, setMasters] = useState<{name: string}[]>([]);
  const [staffs, setStaffs] = useState<{name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { data: txData },
          { data: catData },
          { data: locData },
          { data: masterData },
          { data: staffData }
        ] = await Promise.all([
          supabase.from('transactions').select(`
            *,
            item:items(name, category:categories(name)),
            location:locations(name),
            staff:staffs(name)
          `),
          supabase.from('categories').select('name').eq('is_deleted', false),
          supabase.from('locations').select('name').eq('is_deleted', false),
          supabase.from('items').select('name').eq('is_deleted', false),
          supabase.from('staffs').select('name')
        ]);

        if (txData) {
          const mapped: TransactionItem[] = txData.map((tx: any) => ({
            id: tx.id,
            date: tx.date,
            itemId: tx.item_id,
            category: tx.item?.category?.name || 'Unknown',
            itemName: tx.item?.name || 'Unknown',
            type: tx.type,
            quantity: tx.quantity,
            location: tx.location?.name || 'Unknown',
            personInCharge: tx.staff?.name || 'Unknown',
          }));
          setItems(mapped);
        }
        if (catData) setCategories(catData);
        if (locData) setLocations(locData);
        if (masterData) setMasters(masterData);
        if (staffData) setStaffs(staffData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const categoryOptions = useMemo(() => [{ label: '', value: '' }, ...categories.map(c => ({ label: c.name, value: c.name }))], [categories]);
  const locationOptions = useMemo(() => [{ label: '', value: '' }, ...locations.map(l => ({ label: l.name, value: l.name }))], [locations]);
  const itemOptions = useMemo(() => [{ label: '', value: '' }, ...masters.map(m => ({ label: m.name, value: m.name }))], [masters]);
  const staffOptions = useMemo(() => [{ label: '', value: '' }, ...staffs.map(s => ({ label: s.name, value: s.name }))], [staffs]);

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
    alert('UI上での保存を反映しました。（※DB更新処理は未実装）');
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

  if (loading) return <div>Loading...</div>;

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
