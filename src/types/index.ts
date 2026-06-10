export type InventoryItem = {
  id: string;
  category: string;
  name: string;
  location: string;
  quantity: number;
};

export type MasterItem = {
  id: string;
  name: string;
  yomigana: string;
  description: string;
  supplier: string;
  standardPrice: number;
  standardPurchaseQty: number;
  category: string;
  categoryYomigana?: string;
  location: string;
};

export type LocationItem = {
  id: string;
  name: string;
  yomigana: string;
  description: string;
};

export type CategoryItem = {
  id: string;
  name: string;
  yomigana: string;
  description: string;
};

export type SupplierItem = {
  id: string;
  name: string;
  yomigana: string;
  contactPerson: string;
  phone: string;
};

export type TransactionItem = {
  id: string;
  date: string;
  itemId: string;
  category: string;
  itemName: string;
  type: '受入' | '払出';
  quantity: number;
  location: string;
  personInCharge: string;
};

export type StaffItem = {
  id: string;
  name: string;
  yomigana: string;
  email?: string;
  password?: string;
  role: string;
};

export type StocktakingItem = {
  id: string;
  date: string;
  itemId: string;
  category: string;
  itemName: string;
  systemQty: number;
  actualQty: number;
  difference: number;
  personInCharge: string;
  location: string;
};

export type ProjectItem = {
  id: string;
  name: string;
  clientName: string;
  status: '進行中' | '完了' | '保留' | '計画中';
  startDate: string;
  endDate?: string;
  manager: string;
};

export type Tab = 
  | 'inventory' | 'master' | 'location' | 'category' 
  | 'supplier' | 'transaction' | 'stocktaking' | 'staff'
  | 'project';

export type SystemType = 'inventory' | 'project';
