import { useState, useEffect, useMemo } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import { supabase } from '../lib/supabase';

type PivotInventoryItem = {
  id: string;
  category: string;
  name: string;
  totalQuantity: number;
  [locationName: string]: string | number;
};

export function InventoryPage() {
  const [inventories, setInventories] = useState<any[]>([]);
  const [locations, setLocations] = useState<{name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { data: invData },
          { data: locData }
        ] = await Promise.all([
          supabase.from('inventories').select(`
            *,
            item:items(name, category:categories(name)),
            location:locations(name)
          `),
          supabase.from('locations').select('name').eq('is_deleted', false)
        ]);

        if (invData) setInventories(invData);
        if (locData) setLocations(locData);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const { pivotItems, columns } = useMemo(() => {
    // Collect all location names for dynamic columns
    const locationNames = locations.map((loc) => loc.name);
    
    const grouped = new Map<string, PivotInventoryItem>();
    
    inventories.forEach(inv => {
      const itemName = inv.item?.name || 'Unknown';
      const categoryName = inv.item?.category?.name || 'Unknown';
      const locationName = inv.location?.name || 'Unknown';

      if (!grouped.has(itemName)) {
        const initialItem: PivotInventoryItem = {
          id: `PIVOT-${itemName}`,
          category: categoryName,
          name: itemName,
          totalQuantity: 0,
        };
        locationNames.forEach(loc => {
          initialItem[loc] = 0;
        });
        grouped.set(itemName, initialItem);
      }
      
      const group = grouped.get(itemName)!;
      group.totalQuantity += inv.quantity;
      
      // If the location matches, add to its specific count
      if (typeof group[locationName] === 'number') {
        (group[locationName] as number) += inv.quantity;
      }
    });

    const items = Array.from(grouped.values());

    const dynamicColumns: Column<PivotInventoryItem>[] = [
      { key: 'category', header: 'カテゴリ' },
      { key: 'name', header: '品目' },
      { key: 'totalQuantity', header: '在庫数量', className: 'quantity' },
    ];

    locationNames.forEach(locName => {
      dynamicColumns.push({
        key: locName,
        header: locName,
        className: 'quantity',
        render: (item) => {
          const qty = item[locName] as number;
          return qty === 0 ? <span style={{ color: 'var(--color-text-muted)' }}>-</span> : qty;
        }
      });
    });

    return { pivotItems: items, columns: dynamicColumns };
  }, [inventories, locations]);

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage 
      title="在庫集計"
      data={pivotItems} 
      columns={columns} 
      emptyMessage="在庫データがありません" 
    />
  );
}
