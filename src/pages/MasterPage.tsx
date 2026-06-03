import { useState, useEffect, useMemo } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { MasterItem } from '../types';
import { supabase } from '../lib/supabase';

export function MasterPage() {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [categories, setCategories] = useState<{name: string}[]>([]);
  const [units, setUnits] = useState<{name: string}[]>([]);
  const [suppliers, setSuppliers] = useState<{name: string}[]>([]);
  const [locations, setLocations] = useState<{name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { data: itemsData },
          { data: categoriesData },
          { data: unitsData },
          { data: suppliersData },
          { data: locationsData },
        ] = await Promise.all([
          supabase.from('items').select(`
            *,
            category:categories(name),
            location:locations(name),
            supplier:suppliers(name),
            unit:units(name)
          `).eq('is_deleted', false),
          supabase.from('categories').select('name').eq('is_deleted', false),
          supabase.from('units').select('name').eq('is_deleted', false),
          supabase.from('suppliers').select('name').eq('is_deleted', false),
          supabase.from('locations').select('name').eq('is_deleted', false),
        ]);

        if (itemsData) {
          const mapped: MasterItem[] = itemsData.map((item: any) => ({
            id: item.id,
            name: item.name,
            manufacturer: item.manufacturer,
            contentAmount: item.content_amount,
            contentUnit: item.unit?.name || 'Unknown',
            supplier: item.supplier?.name || 'Unknown',
            standardPrice: item.standard_price,
            standardPurchaseQty: item.standard_purchase_qty,
            category: item.category?.name || 'Unknown',
            location: item.location?.name || 'Unknown',
          }));
          setItems(mapped);
        }
        if (categoriesData) setCategories(categoriesData);
        if (unitsData) setUnits(unitsData);
        if (suppliersData) setSuppliers(suppliersData);
        if (locationsData) setLocations(locationsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const categoryOptions = useMemo(() => [{ label: '', value: '' }, ...categories.map(c => ({ label: c.name, value: c.name }))], [categories]);
  const unitOptions = useMemo(() => [{ label: '', value: '' }, ...units.map(u => ({ label: u.name, value: u.name }))], [units]);
  const supplierOptions = useMemo(() => [{ label: '', value: '' }, ...suppliers.map(s => ({ label: s.name, value: s.name }))], [suppliers]);
  const locationOptions = useMemo(() => [{ label: '', value: '' }, ...locations.map(l => ({ label: l.name, value: l.name }))], [locations]);

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
    alert('UI上での保存を反映しました。（※DB更新処理は未実装）');
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

  if (loading) return <div>Loading...</div>;

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
