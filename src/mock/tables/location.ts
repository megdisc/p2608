import type { LocationTableItem } from '../../types/db';

export const locationTable: LocationTableItem[] = [
  { id: 'LOC-001', name: '倉庫A', description: '粉類・乾物用メイン倉庫' },
  { id: 'LOC-002', name: '倉庫B', description: '調味料・糖類・包材' },
  { id: 'LOC-003', name: '冷蔵庫1', description: 'イースト・仕込み水用' },
  { id: 'LOC-004', name: '冷蔵庫2', description: '乳製品（バター・牛乳等）' },
  { id: 'LOC-005', name: '冷蔵庫3', description: '生鮮食品（卵・フィリング等）' },
  { id: 'LOC-006', name: '冷凍庫A', description: '冷凍生地・冷凍フルーツ' },
];
