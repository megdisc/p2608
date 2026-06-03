import { useState, useEffect, useMemo } from 'react';
import { DataPage } from '../components/page';
import { DateTimeDisplay } from '../components/ui';
import type { Column } from '../components/ui';
import type { StocktakingItem } from '../types';
import { supabase } from '../lib/supabase';

export function StocktakingPage() {
  const [items, setItems] = useState<StocktakingItem[]>([]);
  const [categories, setCategories] = useState<{name: string}[]>([]);
  const [locations, setLocations] = useState<{name: string}[]>([]);
  const [masters, setMasters] = useState<{name: string}[]>([]);
  const [staffs, setStaffs] = useState<{name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { data: stData },
          { data: catData },
          { data: locData },
          { data: masterData },
          { data: staffData }
        ] = await Promise.all([
          supabase.from('stocktakings').select(`
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

        if (stData) {
          const mapped: StocktakingItem[] = stData.map((st: any) => ({
            id: st.id,
            date: st.date,
            itemId: st.item_id,
            category: st.item?.category?.name || 'Unknown',
            itemName: st.item?.name || 'Unknown',
            systemQty: st.system_qty,
            actualQty: st.actual_qty,
            difference: st.difference,
            location: st.location?.name || 'Unknown',
            personInCharge: st.staff?.name || 'Unknown',
          }));
          setItems(mapped);
        }
        if (catData) setCategories(catData);
        if (locData) setLocations(locData);
        if (masterData) setMasters(masterData);
        if (staffData) setStaffs(staffData);
      } catch (error) {
        console.error('Error fetching stocktakings:', error);
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

  const columns: Column<StocktakingItem>[] = [
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
    { key: 'personInCharge', header: '記録者', editable: true, inputType: 'select', options: staffOptions },
  ];

  const handleBatchSave = (drafts: StocktakingItem[], deletedIds: string[]) => {
    const afterDelete = drafts.filter(item => !deletedIds.includes(item.id));
    
    // 差異の再計算
    const recalculated = afterDelete.map(item => ({
      ...item,
      difference: item.actualQty - item.systemQty
    }));
    
    setItems(recalculated);
    alert('UI上での保存を反映しました。（※DB更新処理は未実装）');
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

  if (loading) return <div>Loading...</div>;

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
