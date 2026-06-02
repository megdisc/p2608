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
  manufacturer: string;
  contentAmount: number;
  contentUnit: string;
  supplier: string;
  standardPrice: number;
  standardPurchaseQty: number;
  category: string;
  locations: string[];
};

export type LocationItem = {
  id: string;
  name: string;
  type: string;
  description: string;
};

export type CategoryItem = {
  id: string;
  name: string;
  description: string;
};

export type SupplierItem = {
  id: string;
  name: string;
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
  role: string;
  status: 'active' | 'inactive';
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

export type Tab = 'inventory' | 'master' | 'location' | 'category' | 'supplier' | 'transaction' | 'stocktaking' | 'staff';
