export type InventoryTableItem = {
  id: string; // e.g., INV-001
  itemId: string; // e.g., ING-001
  locationId: string; // e.g., LOC-001
  quantity: number;
};

export type MasterTableItem = {
  id: string; // e.g., ING-001
  name: string;
  manufacturer: string;
  contentAmount: number;
  contentUnit: string;
  supplierId: string;
  standardPrice: number;
  standardPurchaseQty: number;
  categoryId: string;
  locationIds: string[];
};

export type LocationTableItem = {
  id: string;
  name: string;
  description: string;
};

export type CategoryTableItem = {
  id: string;
  name: string;
  description: string;
};

export type SupplierTableItem = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
};

export type TransactionTableItem = {
  id: string;
  date: string;
  itemId: string;
  type: '受入' | '払出';
  quantity: number;
  locationId: string;
  staffId: string;
};

export type StaffTableItem = {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
};

export type StocktakingTableItem = {
  id: string;
  date: string;
  itemId: string;
  systemQty: number;
  actualQty: number;
  difference: number;
  staffId: string;
  locationId: string;
};
