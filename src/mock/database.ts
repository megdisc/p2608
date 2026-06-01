import type { 
  InventoryItem, 
  MasterItem, 
  LocationItem, 
  CategoryItem, 
  SupplierItem, 
  TransactionItem,
  StocktakingItem
} from '../types';

export const db = {
  inventory: [
    { id: 'ING-001', name: '強力粉 (カメリヤ) 25kg', quantity: 12 },
    { id: 'ING-002', name: '薄力粉 (バイオレット) 25kg', quantity: 5 },
    { id: 'ING-003', name: 'ドライイースト 500g', quantity: 20 },
    { id: 'ING-004', name: '上白糖 30kg', quantity: 3 },
    { id: 'ING-005', name: '粗塩 5kg', quantity: 8 },
    { id: 'ING-006', name: '無塩バター 450g', quantity: 40 },
    { id: 'ING-007', name: '牛乳 (業務用) 1000ml', quantity: 24 },
    { id: 'ING-008', name: '鶏卵 (Lサイズ) 10kg', quantity: 4 },
  ] as InventoryItem[],

  master: [
    { id: 'ING-001', name: '強力粉 (カメリヤ)', manufacturer: '日清製粉', contentAmount: 25, contentUnit: 'kg', supplier: '関東製菓材料卸(株)', standardPrice: 7500, standardPurchaseQty: 1, category: '粉類', location: '倉庫A' },
    { id: 'ING-002', name: '薄力粉 (バイオレット)', manufacturer: '日清製粉', contentAmount: 25, contentUnit: 'kg', supplier: '関東製菓材料卸(株)', standardPrice: 6800, standardPurchaseQty: 1, category: '粉類', location: '倉庫A' },
    { id: 'ING-003', name: 'ドライイースト', manufacturer: 'ルサッフル', contentAmount: 500, contentUnit: 'g', supplier: '関東製菓材料卸(株)', standardPrice: 1200, standardPurchaseQty: 10, category: '酵母・膨張剤', location: '冷蔵庫1' },
    { id: 'ING-004', name: '上白糖', manufacturer: '三井製糖', contentAmount: 30, contentUnit: 'kg', supplier: '第一食材商事', standardPrice: 5400, standardPurchaseQty: 1, category: '糖類', location: '倉庫B' },
    { id: 'ING-005', name: '粗塩', manufacturer: '伯方塩業', contentAmount: 5, contentUnit: 'kg', supplier: '第一食材商事', standardPrice: 850, standardPurchaseQty: 2, category: '調味料', location: '倉庫B' },
    { id: 'ING-006', name: '無塩バター', manufacturer: 'よつ葉乳業', contentAmount: 450, contentUnit: 'g', supplier: '丸越乳業販売(株)', standardPrice: 950, standardPurchaseQty: 30, category: '乳製品', location: '冷蔵庫2' },
    { id: 'ING-007', name: '牛乳 (業務用)', manufacturer: '明治', contentAmount: 1000, contentUnit: 'ml', supplier: '丸越乳業販売(株)', standardPrice: 280, standardPurchaseQty: 12, category: '乳製品', location: '冷蔵庫2' },
    { id: 'ING-008', name: '鶏卵 (Lサイズ)', manufacturer: 'JA全農', contentAmount: 10, contentUnit: 'kg', supplier: '新鮮農産流通協同組合', standardPrice: 3200, standardPurchaseQty: 2, category: '生鮮食品', location: '冷蔵庫3' },
  ] as MasterItem[],

  location: [
    { id: 'LOC-001', name: '倉庫A', type: '常温', description: '粉類・乾物用メイン倉庫' },
    { id: 'LOC-002', name: '倉庫B', type: '常温', description: '調味料・糖類・包材' },
    { id: 'LOC-003', name: '冷蔵庫1', type: '冷蔵 (4℃)', description: 'イースト・仕込み水用' },
    { id: 'LOC-004', name: '冷蔵庫2', type: '冷蔵 (4℃)', description: '乳製品（バター・牛乳等）' },
    { id: 'LOC-005', name: '冷蔵庫3', type: '冷蔵 (8℃)', description: '生鮮食品（卵・フィリング等）' },
    { id: 'LOC-006', name: '冷凍庫A', type: '冷凍 (-18℃)', description: '冷凍生地・冷凍フルーツ' },
  ] as LocationItem[],

  category: [
    { id: 'CAT-001', name: '粉類', description: '強力粉、薄力粉、ライ麦粉など' },
    { id: 'CAT-002', name: '酵母・膨張剤', description: 'イースト、ベーキングパウダーなど' },
    { id: 'CAT-003', name: '糖類', description: '上白糖、グラニュー糖、三温糖など' },
    { id: 'CAT-004', name: '調味料', description: '塩、スパイス類など' },
    { id: 'CAT-005', name: '乳製品', description: 'バター、牛乳、チーズなど' },
    { id: 'CAT-006', name: '生鮮食品', description: '卵、生鮮フルーツ、野菜など' },
  ] as CategoryItem[],

  supplier: [
    { id: 'SUP-001', name: '関東製菓材料卸(株)', contactPerson: '山田 太郎', phone: '03-xxxx-0001' },
    { id: 'SUP-002', name: '第一食材商事', contactPerson: '佐藤 花子', phone: '03-xxxx-0002' },
    { id: 'SUP-003', name: '丸越乳業販売(株)', contactPerson: '鈴木 一郎', phone: '03-xxxx-0003' },
    { id: 'SUP-004', name: '新鮮農産流通協同組合', contactPerson: '田中 次郎', phone: '042-xxx-0004' },
  ] as SupplierItem[],

  transaction: [
    { id: 'TRX-001', date: '2026-06-01 08:30', itemId: 'ING-001', itemName: '強力粉 (カメリヤ) 25kg', type: '受入', quantity: 10 },
    { id: 'TRX-002', date: '2026-06-01 09:15', itemId: 'ING-003', itemName: 'ドライイースト 500g', type: '払出', quantity: 1 },
    { id: 'TRX-003', date: '2026-06-01 10:00', itemId: 'ING-006', itemName: '無塩バター 450g', type: '払出', quantity: 2 },
    { id: 'TRX-004', date: '2026-06-01 11:30', itemId: 'ING-007', itemName: '牛乳 (業務用) 1000ml', type: '受入', quantity: 12 },
    { id: 'TRX-005', date: '2026-06-01 13:45', itemId: 'ING-008', itemName: '鶏卵 (Lサイズ) 10kg', type: '受入', quantity: 2 },
  ] as TransactionItem[],

  stocktaking: [
    { id: 'STK-001', date: '2026-05-31 18:00', itemId: 'ING-001', itemName: '強力粉 (カメリヤ)', systemQty: 12, actualQty: 12, difference: 0, personInCharge: '佐藤', location: '倉庫A' },
    { id: 'STK-002', date: '2026-05-31 18:15', itemId: 'ING-003', itemName: 'ドライイースト', systemQty: 21, actualQty: 20, difference: -1, personInCharge: '佐藤', location: '冷蔵庫1' },
    { id: 'STK-003', date: '2026-05-31 18:30', itemId: 'ING-006', itemName: '無塩バター', systemQty: 40, actualQty: 40, difference: 0, personInCharge: '鈴木', location: '冷蔵庫2' },
    { id: 'STK-004', date: '2026-05-31 18:45', itemId: 'ING-004', itemName: '上白糖', systemQty: 3, actualQty: 3, difference: 0, personInCharge: '鈴木', location: '倉庫B' },
  ] as StocktakingItem[],
};
