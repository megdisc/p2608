import type { StaffTableItem } from '../../types/db';

export const staffTable: StaffTableItem[] = [
  { id: 'STAFF-001', name: '佐藤', role: '管理者', status: 'active' },
  { id: 'STAFF-002', name: '鈴木', role: 'スタッフ', status: 'active' },
  { id: 'STAFF-003', name: '高橋', role: 'スタッフ', status: 'inactive' },
];
