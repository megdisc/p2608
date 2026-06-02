import type { MasterTableItem } from '../../types/db';

export const masterTable: MasterTableItem[] = [
  { id: 'ING-001', name: '強力粉 (カメリヤ)', manufacturer: '日清製粉', contentAmount: 25, contentUnit: 'kg', supplierId: 'SUP-001', standardPrice: 7500, standardPurchaseQty: 1, categoryId: 'CAT-001', locationId: 'LOC-001' },
  { id: 'ING-002', name: '薄力粉 (バイオレット)', manufacturer: '日清製粉', contentAmount: 25, contentUnit: 'kg', supplierId: 'SUP-001', standardPrice: 6800, standardPurchaseQty: 1, categoryId: 'CAT-001', locationId: 'LOC-001' },
  { id: 'ING-003', name: 'ドライイースト', manufacturer: 'ルサッフル', contentAmount: 500, contentUnit: 'g', supplierId: 'SUP-001', standardPrice: 1200, standardPurchaseQty: 10, categoryId: 'CAT-002', locationId: 'LOC-003' },
  { id: 'ING-004', name: '上白糖', manufacturer: '三井製糖', contentAmount: 30, contentUnit: 'kg', supplierId: 'SUP-002', standardPrice: 5400, standardPurchaseQty: 1, categoryId: 'CAT-003', locationId: 'LOC-002' },
  { id: 'ING-005', name: '粗塩', manufacturer: '伯方塩業', contentAmount: 5, contentUnit: 'kg', supplierId: 'SUP-002', standardPrice: 850, standardPurchaseQty: 2, categoryId: 'CAT-004', locationId: 'LOC-002' },
  { id: 'ING-006', name: '無塩バター', manufacturer: 'よつ葉乳業', contentAmount: 450, contentUnit: 'g', supplierId: 'SUP-003', standardPrice: 950, standardPurchaseQty: 30, categoryId: 'CAT-005', locationId: 'LOC-004' },
  { id: 'ING-007', name: '牛乳 (業務用)', manufacturer: '明治', contentAmount: 1000, contentUnit: 'ml', supplierId: 'SUP-003', standardPrice: 280, standardPurchaseQty: 12, categoryId: 'CAT-005', locationId: 'LOC-004' },
  { id: 'ING-008', name: '鶏卵 (Lサイズ)', manufacturer: 'JA全農', contentAmount: 10, contentUnit: 'kg', supplierId: 'SUP-004', standardPrice: 3200, standardPurchaseQty: 2, categoryId: 'CAT-006', locationId: 'LOC-005' },
];
