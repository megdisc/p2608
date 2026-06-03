import type { InventoryTableItem } from '../../types/db';

export const inventoryTable: InventoryTableItem[] = [
  { id: 'INV-001', item_id: 'ING-001', location_id: 'LOC-001', quantity: 10 },
  { id: 'INV-002', item_id: 'ING-001', location_id: 'LOC-002', quantity: 2 },
  { id: 'INV-003', item_id: 'ING-002', location_id: 'LOC-001', quantity: 5 },
  { id: 'INV-004', item_id: 'ING-003', location_id: 'LOC-003', quantity: 20 },
  { id: 'INV-005', item_id: 'ING-004', location_id: 'LOC-002', quantity: 3 },
  { id: 'INV-006', item_id: 'ING-005', location_id: 'LOC-002', quantity: 8 },
  { id: 'INV-007', item_id: 'ING-006', location_id: 'LOC-004', quantity: 30 },
  { id: 'INV-008', item_id: 'ING-006', location_id: 'LOC-005', quantity: 10 },
  { id: 'INV-009', item_id: 'ING-007', location_id: 'LOC-004', quantity: 24 },
  { id: 'INV-010', item_id: 'ING-008', location_id: 'LOC-005', quantity: 4 },
];
