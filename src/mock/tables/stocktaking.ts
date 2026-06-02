import type { StocktakingTableItem } from '../../types/db';

export const stocktakingTable: StocktakingTableItem[] = [
  { id: 'STK-001', date: '2026-05-31 18:00', itemId: 'ING-001', systemQty: 12, actualQty: 12, difference: 0, personInCharge: '佐藤', locationId: 'LOC-001' },
  { id: 'STK-002', date: '2026-05-31 18:15', itemId: 'ING-003', systemQty: 21, actualQty: 20, difference: -1, personInCharge: '佐藤', locationId: 'LOC-003' },
  { id: 'STK-003', date: '2026-05-31 18:30', itemId: 'ING-006', systemQty: 40, actualQty: 40, difference: 0, personInCharge: '鈴木', locationId: 'LOC-004' },
  { id: 'STK-004', date: '2026-05-31 18:45', itemId: 'ING-004', systemQty: 3, actualQty: 3, difference: 0, personInCharge: '鈴木', locationId: 'LOC-002' },
];
