import type { TransactionTableItem } from '../../types/db';

export const transactionTable: TransactionTableItem[] = [
  { id: 'TRX-001', date: '2026-06-01 08:30', item_id: 'ING-001', type: '受入', quantity: 10, location_id: 'LOC-001', staff_id: 'STAFF-001' },
  { id: 'TRX-002', date: '2026-06-01 09:15', item_id: 'ING-003', type: '払出', quantity: 1, location_id: 'LOC-003', staff_id: 'STAFF-002' },
  { id: 'TRX-003', date: '2026-06-01 10:00', item_id: 'ING-006', type: '払出', quantity: 2, location_id: 'LOC-004', staff_id: 'STAFF-001' },
  { id: 'TRX-004', date: '2026-06-01 11:30', item_id: 'ING-007', type: '受入', quantity: 12, location_id: 'LOC-004', staff_id: 'STAFF-002' },
  { id: 'TRX-005', date: '2026-06-01 13:45', item_id: 'ING-008', type: '受入', quantity: 2, location_id: 'LOC-005', staff_id: 'STAFF-001' },
];
