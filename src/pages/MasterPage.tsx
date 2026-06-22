import { DataPage, type Column } from '../components';
import { useState, useEffect, useMemo } from 'react';
import type { MasterItem } from '../types';
import { supabase } from '../lib';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';

export function MasterPage() {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([]);
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

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
            id, name, yomigana, standard_price, standard_purchase_qty,
            category:categories(name, yomigana),
            location:locations(name),
            supplier:suppliers(name)
          `).eq('is_deleted', false).order('yomigana', { ascending: true }),
          supabase.from('categories').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true }),
          supabase.from('suppliers').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true }),
          supabase.from('locations').select('id, name, yomigana').eq('is_deleted', false).order('yomigana', { ascending: true }),
        ]);

        if (itemsData) {
          const mapped: MasterItem[] = itemsData.map((item: any) => ({
            id: item.id,
            name: item.name,
            yomigana: item.yomigana,
            description: item.description || '',
            supplier: item.supplier?.name || 'Unknown',
            standardPrice: item.standard_price,
            standardPurchaseQty: item.standard_purchase_qty,
            category: item.category?.name || 'Unknown',
            categoryYomigana: item.category?.yomigana || '',
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
    { key: 'category', header: TABLE_COLUMNS.CATEGORY, sortKey: 'categoryYomigana', editable: true, inputType: 'select', options: categoryOptions },
    { key: 'name', header: TABLE_COLUMNS.ITEM, sortKey: 'yomigana', editable: true, inputType: 'text' },
    { key: 'yomigana', header: TABLE_COLUMNS.YOMIGANA, editable: true, inputType: 'text' },
    { key: 'description', header: TABLE_COLUMNS.DESCRIPTION, editable: true, inputType: 'text' },
    { 
      key: 'location', 
      header: TABLE_COLUMNS.STANDARD_LOCATION, 
      sortKey: 'locationYomigana', 
      editable: true, 
      inputType: 'select', 
      options: locationOptions 
    },
    { key: 'supplier', header: TABLE_COLUMNS.SUPPLIER, editable: true, inputType: 'select', options: supplierOptions },
    { key: 'standardPrice', header: TABLE_COLUMNS.STANDARD_PRICE, editable: true, inputType: 'number' },
    { key: 'standardPurchaseQty', header: TABLE_COLUMNS.STANDARD_PURCHASE_QTY, editable: true, inputType: 'number' },
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
          yomigana: item.yomigana || '',
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
          yomigana: item.yomigana || '',
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
        id, name, yomigana, standard_price, standard_purchase_qty,
        category:categories(name, yomigana),
        location:locations(name),
        supplier:suppliers(name)
      `).eq('is_deleted', false).order('yomigana', { ascending: true });
      
      if (reloadError) throw reloadError;
      
      if (itemsData) {
        const mapped: MasterItem[] = itemsData.map((item: any) => ({
          id: item.id,
          name: item.name,
          yomigana: item.yomigana,
          description: item.description || '',
          supplier: item.supplier?.name || 'Unknown',
          standardPrice: item.standard_price,
          standardPurchaseQty: item.standard_purchase_qty,
          category: item.category?.name || 'Unknown',
          categoryYomigana: item.category?.yomigana || '',
          location: item.location?.name || 'Unknown',
        }));
        setItems(mapped);
      }
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error(err);
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    return {
      id: `MST-${Date.now()}`,
      name: '',
      yomigana: '',
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
      title={PAGE_NAMES.MASTER}
      data={items} 
      columns={columns} 
      emptyMessage={MESSAGES.EMPTY_MASTER} 
      initialSort={{ key: 'name', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      onAddRow={handleAdd}
    />
  );
}
