export type InventoryTableItem = {
  id: string; // UUID
  item_id: string; // UUID
  location_id: string; // UUID
  quantity: number;
  updated_at?: string;
};

export type MasterTableItem = {
  id: string; // UUID
  code: string; // e.g., ING-001
  name: string;
  yomigana: string;
  description: string;
  supplier_id: string; // UUID
  standard_price: number;
  standard_purchase_qty: number;
  category_id: string; // UUID
  location_id: string; // UUID
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type LocationTableItem = {
  id: string; // UUID
  code: string;
  name: string;
  yomigana: string;
  description: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CategoryTableItem = {
  id: string; // UUID
  code: string;
  name: string;
  yomigana: string;
  description: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SupplierTableItem = {
  id: string; // UUID
  code: string;
  name: string;
  yomigana: string;
  contact_person: string;
  phone: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TransactionTableItem = {
  id: string; // UUID
  date: string;
  item_id: string; // UUID
  type: '受入' | '払出';
  quantity: number;
  location_id: string; // UUID
  staff_id: string; // UUID
  created_at?: string;
};

export type StaffTableItem = {
  id: string; // UUID
  name: string;
  yomigana: string;
  role: string;
  status: 'active' | 'inactive';
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type StocktakingTableItem = {
  id: string; // UUID
  date: string;
  item_id: string; // UUID
  system_qty: number;
  actual_qty: number;
  difference: number;
  staff_id: string; // UUID
  location_id: string; // UUID
  created_at?: string;
};
