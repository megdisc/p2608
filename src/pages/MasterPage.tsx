import { useState, useEffect, useMemo } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import type { MasterItem } from '../types';
import { supabase } from '../lib/supabase';

export function MasterPage() {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([]);
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { data: itemsData },
          { data: categoriesData },
          { data: suppliersData },
          { data: locationsData },
        ] = await Promise.all([
          supabase.from('items').select(`
            *,
            category:categories(name),
            location:locations(name),
            supplier:suppliers(name)
          `).eq('is_deleted', false),
          supabase.from('categories').select('id, name').eq('is_deleted', false),
          supabase.from('suppliers').select('id, name').eq('is_deleted', false),
          supabase.from('locations').select('id, name').eq('is_deleted', false),
        ]);

        if (itemsData) {
          const mapped: MasterItem[] = itemsData.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            supplier: item.supplier?.name || 'Unknown',
            standardPrice: item.standard_price,
            standardPurchaseQty: item.standard_purchase_qty,
            category: item.category?.name || 'Unknown',
            location: item.location?.name || 'Unknown',
          }));
          setItems(mapped);
        }
        if (categoriesData) setCategories(categoriesData);
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
  const supplierOptions = useMemo(() => [{ label: '', value: '' }, ...suppliers.map(s => ({ label: s.name, value: s.name }))], [suppliers]);
  const locationOptions = useMemo(() => [{ label: '', value: '' }, ...locations.map(l => ({ label: l.name, value: l.name }))], [locations]);

  const columns: Column<MasterItem>[] = [
    { key: 'category', header: 'カテゴリ', editable: true, inputType: 'select', options: categoryOptions },
    { key: 'name', header: '品目', editable: true, inputType: 'text' },
    { key: 'description', header: '説明', editable: true, inputType: 'text' },
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

  const handleBatchSave = async (drafts: MasterItem[], deletedIds: string[]) => {
    try {
      setLoading(true);

      if (deletedIds.length > 0) {
        const { error } = await supabase.from('items').update({ is_deleted: true }).in('id', deletedIds);
        if (error) throw error;
      }

      const catMap = new Map(categories.map(c => [c.name, c.id]));
      const supMap = new Map(suppliers.map(s => [s.name, s.id]));
      const locMap = new Map(locations.map(l => [l.name, l.id]));

      const newItems = drafts.filter(item => !deletedIds.includes(item.id) && item.id.startsWith('MST-'));
      const existingItems = drafts.filter(item => !deletedIds.includes(item.id) && !item.id.startsWith('MST-'));

      for (const item of existingItems) {
        const { error } = await supabase.from('items').update({
          name: item.name,
          description: item.description,
          supplier_id: supMap.get(item.supplier) || null,
          standard_price: item.standardPrice,
          standard_purchase_qty: item.standardPurchaseQty,
          category_id: catMap.get(item.category) || null,
          location_id: locMap.get(item.location) || null
        }).eq('id', item.id);
        if (error) throw error;
      }

      if (newItems.length > 0) {
        const inserts = newItems.map(item => ({
          code: `MST-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
          name: item.name,
          description: item.description,
          supplier_id: supMap.get(item.supplier) || null,
          standard_price: item.standardPrice,
          standard_purchase_qty: item.standardPurchaseQty,
          category_id: catMap.get(item.category) || null,
          location_id: locMap.get(item.location) || null
        }));
        const { error } = await supabase.from('items').insert(inserts);
        if (error) throw error;
      }

      // Reload
      const { data: itemsData, error: reloadError } = await supabase.from('items').select(`
        *,
        category:categories(name),
        location:locations(name),
        supplier:suppliers(name)
      `).eq('is_deleted', false);
      
      if (reloadError) throw reloadError;
      
      if (itemsData) {
        const mapped: MasterItem[] = itemsData.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          supplier: item.supplier?.name || 'Unknown',
          standardPrice: item.standard_price,
          standardPurchaseQty: item.standard_purchase_qty,
          category: item.category?.name || 'Unknown',
          location: item.location?.name || 'Unknown',
        }));
        setItems(mapped);
      }
      alert('保存が完了しました。');
    } catch (error) {
      console.error('Error saving items:', error);
      alert('保存中にエラーが発生しました。コンソールをご確認ください。');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    return {
      id: `MST-${Date.now()}`,
      name: '',
      description: '',
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
