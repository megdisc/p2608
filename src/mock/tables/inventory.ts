import type { InventoryTableItem } from '../../types/db';

export const inventoryTable: InventoryTableItem[] = [
  { id: 'INV-001', itemId: 'ING-001', locationId: 'LOC-001', quantity: 10 },
  { id: 'INV-002', itemId: 'ING-001', locationId: 'LOC-002', quantity: 2 },
  { id: 'INV-003', itemId: 'ING-002', locationId: 'LOC-001', quantity: 5 },
  { id: 'INV-004', itemId: 'ING-003', locationId: 'LOC-003', quantity: 20 },
  { id: 'INV-005', itemId: 'ING-004', locationId: 'LOC-002', quantity: 3 },
  { id: 'INV-006', itemId: 'ING-005', locationId: 'LOC-002', quantity: 8 },
  { id: 'INV-007', itemId: 'ING-006', locationId: 'LOC-004', quantity: 30 },
  { id: 'INV-008', itemId: 'ING-006', locationId: 'LOC-005', quantity: 10 },
  { id: 'INV-009', itemId: 'ING-007', locationId: 'LOC-004', quantity: 24 },
  { id: 'INV-010', itemId: 'ING-008', locationId: 'LOC-005', quantity: 4 },
];
