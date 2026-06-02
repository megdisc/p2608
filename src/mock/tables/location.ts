import type { LocationTableItem } from '../../types/db';

export const locationTable: LocationTableItem[] = [
  { id: 'LOC-001', name: '倉庫A', type: '常温', description: '粉類・乾物用メイン倉庫' },
  { id: 'LOC-002', name: '倉庫B', type: '常温', description: '調味料・糖類・包材' },
  { id: 'LOC-003', name: '冷蔵庫1', type: '冷蔵 (4℃)', description: 'イースト・仕込み水用' },
  { id: 'LOC-004', name: '冷蔵庫2', type: '冷蔵 (4℃)', description: '乳製品（バター・牛乳等）' },
  { id: 'LOC-005', name: '冷蔵庫3', type: '冷蔵 (8℃)', description: '生鮮食品（卵・フィリング等）' },
  { id: 'LOC-006', name: '冷凍庫A', type: '冷凍 (-18℃)', description: '冷凍生地・冷凍フルーツ' },
];
