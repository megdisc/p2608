import type { MasterTableItem } from '../../types/db';

export const masterTable: MasterTableItem[] = [
  { id: 'ING-001', code: 'ING-001', name: '強力粉 (カメリヤ)', manufacturer: '日清製粉', content_amount: 25, unit_id: 'kg', supplier_id: 'SUP-001', standard_price: 7500, standard_purchase_qty: 1, category_id: 'CAT-001', location_id: 'LOC-001' },
  { id: 'ING-002', code: 'ING-002', name: '薄力粉 (バイオレット)', manufacturer: '日清製粉', content_amount: 25, unit_id: 'kg', supplier_id: 'SUP-001', standard_price: 6800, standard_purchase_qty: 1, category_id: 'CAT-001', location_id: 'LOC-001' },
  { id: 'ING-003', code: 'ING-003', name: 'ドライイースト', manufacturer: 'ルサッフル', content_amount: 500, unit_id: 'g', supplier_id: 'SUP-001', standard_price: 1200, standard_purchase_qty: 10, category_id: 'CAT-002', location_id: 'LOC-003' },
  { id: 'ING-004', code: 'ING-004', name: '上白糖', manufacturer: '三井製糖', content_amount: 30, unit_id: 'kg', supplier_id: 'SUP-002', standard_price: 5400, standard_purchase_qty: 1, category_id: 'CAT-003', location_id: 'LOC-002' },
  { id: 'ING-005', code: 'ING-005', name: '粗塩', manufacturer: '伯方塩業', content_amount: 5, unit_id: 'kg', supplier_id: 'SUP-002', standard_price: 850, standard_purchase_qty: 2, category_id: 'CAT-004', location_id: 'LOC-002' },
  { id: 'ING-006', code: 'ING-006', name: '無塩バター', manufacturer: 'よつ葉乳業', content_amount: 450, unit_id: 'g', supplier_id: 'SUP-003', standard_price: 950, standard_purchase_qty: 30, category_id: 'CAT-005', location_id: 'LOC-004' },
  { id: 'ING-007', code: 'ING-007', name: '牛乳 (業務用)', manufacturer: '明治', content_amount: 1000, unit_id: 'ml', supplier_id: 'SUP-003', standard_price: 280, standard_purchase_qty: 12, category_id: 'CAT-005', location_id: 'LOC-004' },
  { id: 'ING-008', code: 'ING-008', name: '鶏卵 (Lサイズ)', manufacturer: 'JA全農', content_amount: 10, unit_id: 'kg', supplier_id: 'SUP-004', standard_price: 3200, standard_purchase_qty: 2, category_id: 'CAT-006', location_id: 'LOC-005' },
];
