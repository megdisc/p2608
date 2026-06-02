import type { TransactionTableItem } from '../../types/db';

export const transactionTable: TransactionTableItem[] = [
  { id: 'TRX-001', date: '2026-06-01 08:30', itemId: 'ING-001', type: '受入', quantity: 10 },
  { id: 'TRX-002', date: '2026-06-01 09:15', itemId: 'ING-003', type: '払出', quantity: 1 },
  { id: 'TRX-003', date: '2026-06-01 10:00', itemId: 'ING-006', type: '払出', quantity: 2 },
  { id: 'TRX-004', date: '2026-06-01 11:30', itemId: 'ING-007', type: '受入', quantity: 12 },
  { id: 'TRX-005', date: '2026-06-01 13:45', itemId: 'ING-008', type: '受入', quantity: 2 },
];
