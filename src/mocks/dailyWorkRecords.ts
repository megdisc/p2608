import type { DailyWorkRecordItem } from '../types';

export const mockDailyWorkRecords: DailyWorkRecordItem[] = [
  {
    id: 'DWR-2026-001',
    date: '2026-06-10',
    userId: 'STF-1001',
    taskId: 'PRJ-2023-001-TASK-1',
    workTime: 4.5,
  },
  {
    id: 'DWR-2026-002',
    date: '2026-06-11',
    userId: 'STF-1002',
    taskId: 'PRJ-2023-001-TASK-3',
    workTime: 3.0,
  },
  {
    id: 'DWR-2026-003',
    date: '2026-06-15',
    userId: 'STF-1003',
    taskId: 'PRJ-2023-003-TASK-1',
    workTime: 8.0,
  },
];
