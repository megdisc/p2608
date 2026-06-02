export type InventoryTableItem = {
  id: string; // e.g., ING-001
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
  locationId: string;
};

export type LocationTableItem = {
  id: string;
  name: string;
  type: string;
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
};

export type StocktakingTableItem = {
  id: string;
  date: string;
  itemId: string;
  systemQty: number;
  actualQty: number;
  difference: number;
  personInCharge: string;
  locationId: string;
};
