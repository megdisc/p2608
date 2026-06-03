import type { StocktakingTableItem } from '../../types/db';

export const stocktakingTable: StocktakingTableItem[] = [
  { id: 'STK-001', date: '2026-05-31 18:00', item_id: 'ING-001', system_qty: 12, actual_qty: 12, difference: 0, staff_id: 'STAFF-001', location_id: 'LOC-001' },
  { id: 'STK-002', date: '2026-05-31 18:15', item_id: 'ING-003', system_qty: 21, actual_qty: 20, difference: -1, staff_id: 'STAFF-001', location_id: 'LOC-003' },
  { id: 'STK-003', date: '2026-05-31 18:30', item_id: 'ING-006', system_qty: 40, actual_qty: 42, difference: 2, staff_id: 'STAFF-002', location_id: 'LOC-004' },
  { id: 'STK-004', date: '2026-05-31 18:45', item_id: 'ING-004', system_qty: 3, actual_qty: 3, difference: 0, staff_id: 'STAFF-002', location_id: 'LOC-002' },
];
