import { useMemo } from 'react';
import { DataPage } from '../components/page';
import type { Column } from '../components/ui';
import { db } from '../mock';

type PivotInventoryItem = {
  id: string;
  category: string;
  name: string;
  totalQuantity: number;
  [locationName: string]: string | number;
};

export function InventoryPage() {
  const { pivotItems, columns } = useMemo(() => {
    // Collect all location names for dynamic columns
    const locationNames = db.location.map((loc) => loc.name);
    
    const grouped = new Map<string, PivotInventoryItem>();
    
    db.inventory.forEach(inv => {
      if (!grouped.has(inv.name)) {
        const initialItem: PivotInventoryItem = {
          id: `PIVOT-${inv.name}`,
          category: inv.category,
          name: inv.name,
          totalQuantity: 0,
        };
        locationNames.forEach(loc => {
          initialItem[loc] = 0;
        });
        grouped.set(inv.name, initialItem);
      }
      
      const group = grouped.get(inv.name)!;
      group.totalQuantity += inv.quantity;
      
      // If the location matches, add to its specific count
      if (typeof group[inv.location] === 'number') {
        (group[inv.location] as number) += inv.quantity;
      }
    });

    const items = Array.from(grouped.values());

    const dynamicColumns: Column<PivotInventoryItem>[] = [
      { key: 'category', header: 'カテゴリ' },
      { key: 'name', header: '品目' },
      { key: 'totalQuantity', header: '総合数量', className: 'quantity' },
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
  }, []);

  return (
    <DataPage 
      title="在庫集計"
      data={pivotItems} 
      columns={columns} 
      emptyMessage="在庫データがありません" 
    />
  );
}
