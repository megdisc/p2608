import { useState, useMemo } from 'react';
import type { Column } from '../components/ui';
import type { InventoryItem } from '../types';
import { db } from '../mock';

export function InventoryPage() {
  const [viewMode, setViewMode] = useState<'combined' | 'separated'>('combined');

  const items = useMemo(() => {
    if (viewMode === 'separated') {
      return db.inventory;
    }
    
    // Group by item name for combined view
    const grouped = new Map<string, { id: string, name: string, locations: Set<string>, quantity: number }>();
    
    db.inventory.forEach(inv => {
      if (!grouped.has(inv.name)) {
        grouped.set(inv.name, { 
          id: inv.id.replace(/INV-\d+/, `ITEM-${inv.name}`), // Generate a pseudo id or just use first id
          name: inv.name, 
          locations: new Set([inv.location]), 
          quantity: inv.quantity 
        });
      } else {
        const group = grouped.get(inv.name)!;
        group.locations.add(inv.location);
        group.quantity += inv.quantity;
      }
    });

    return Array.from(grouped.values()).map(g => ({
      id: g.id,
      name: g.name,
      location: Array.from(g.locations).join(', '),
      quantity: g.quantity
    }));
  }, [viewMode]);

  const columns: Column<InventoryItem>[] = [
    { key: 'name', header: '品目' },
    { key: 'location', header: '保管場所' },
    { key: 'quantity', header: '在庫数量', className: 'quantity' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, padding: '48px', overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>在庫集計</h2>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--color-bg-subtle)', padding: '4px', borderRadius: '8px' }}>
          <button 
            style={{ 
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
              background: viewMode === 'combined' ? 'var(--color-bg)' : 'transparent',
              color: viewMode === 'combined' ? 'var(--color-text)' : 'var(--color-text-muted)',
              boxShadow: viewMode === 'combined' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
            onClick={() => setViewMode('combined')}
          >
            合算表示
          </button>
          <button 
            style={{ 
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
              background: viewMode === 'separated' ? 'var(--color-bg)' : 'transparent',
              color: viewMode === 'separated' ? 'var(--color-text)' : 'var(--color-text-muted)',
              boxShadow: viewMode === 'separated' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
            onClick={() => setViewMode('separated')}
          >
            保管場所別
          </button>
        </div>
      </div>

      <div className="table-container" style={{ width: '100%', margin: 0 }}>
        {items.length === 0 ? (
          <div className="empty-message">在庫データがありません</div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key.toString()} className={col.className}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  {columns.map((col) => (
                    <td key={col.key.toString()} className={col.className}>
                      {col.render ? col.render(item) : (item[col.key] as any)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
