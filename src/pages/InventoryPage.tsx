import { DataPage, type Column } from '../components';
import { useEffect, useMemo } from 'react';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { formatJST } from '../utils';
import { useInventory, type PivotInventoryItem } from '../hooks';

export function InventoryPage() {
  const { inventories, locations, loading, targetDate, fetchInventory } = useInventory();

  useEffect(() => {
    fetchInventory().catch((error) => {
      console.error('Error fetching inventory:', error);
    });
  }, [fetchInventory]);

  const { pivotItems, columns } = useMemo(() => {
    const locationNames = locations.map((loc) => loc.name);
    
    const grouped = new Map<string, PivotInventoryItem>();
    
    inventories.forEach(inv => {
      const itemName = inv.item_name || 'Unknown';
      const categoryName = inv.category_name || 'Unknown';
      const locationName = inv.location_name || 'Unknown';
      const qty = Number(inv.quantity) || 0;

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
      group.totalQuantity += qty;
      
      if (typeof group[locationName] === 'number') {
        (group[locationName] as number) += qty;
      }
    });

    const items = Array.from(grouped.values());

    const dynamicColumns: Column<PivotInventoryItem>[] = [
      { key: 'category', header: TABLE_COLUMNS.CATEGORY },
      { key: 'name', header: TABLE_COLUMNS.ITEM },
      { key: 'totalQuantity', header: TABLE_COLUMNS.BOOK_INVENTORY, className: 'quantity' },
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

  const formattedDate = formatJST(targetDate);

  return (
    <DataPage 
      title={PAGE_NAMES.INVENTORY}
      data={pivotItems} 
      columns={columns} 
      emptyMessage={MESSAGES.EMPTY_INVENTORY} 
      initialSort={{ key: 'name', direction: 'asc' }} 
      footerLeft={<span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-caption)' }}>集計日時：{formattedDate}</span>}
    />
  );
}
