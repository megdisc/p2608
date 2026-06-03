import { inventoryTable } from './tables/inventory';
import { masterTable } from './tables/master';
import { locationTable } from './tables/location';
import { categoryTable } from './tables/category';
import { unitTable } from './tables/unit';
import { supplierTable } from './tables/supplier';
import { transactionTable } from './tables/transaction';
import { stocktakingTable } from './tables/stocktaking';
import { staffTable } from './tables/staff';

import type {
  InventoryItem,
  MasterItem,
  LocationItem,
  CategoryItem,
  UnitItem,
  SupplierItem,
  TransactionItem,
  StocktakingItem,
  StaffItem,
} from '../types';

// Helper to simulate joins
const joinMasterItem = (rawMaster: typeof masterTable[0]): MasterItem => {
  const category = categoryTable.find((c) => c.id === rawMaster.category_id);
  const location = locationTable.find((l) => l.id === rawMaster.location_id);
  const supplier = supplierTable.find((s) => s.id === rawMaster.supplier_id);

  return {
    id: rawMaster.id,
    name: rawMaster.name,
    manufacturer: rawMaster.manufacturer,
    contentAmount: rawMaster.content_amount,
    contentUnit: rawMaster.unit_id,
    supplier: supplier?.name ?? 'Unknown',
    standardPrice: rawMaster.standard_price,
    standardPurchaseQty: rawMaster.standard_purchase_qty,
    category: category?.name ?? 'Unknown',
    location: location?.name ?? 'Unknown',
  };
};

export const db = {
  get inventory(): InventoryItem[] {
    return inventoryTable.map((inv) => {
      const master = masterTable.find((m) => m.id === inv.item_id);
      const category = categoryTable.find((c) => c.id === master?.category_id);
      const location = locationTable.find((l) => l.id === inv.location_id);
      return {
        id: inv.id,
        category: category?.name ?? 'Unknown',
        name: master?.name ?? 'Unknown',
        location: location?.name ?? 'Unknown',
        quantity: inv.quantity,
      };
    });
  },

  get master(): MasterItem[] {
    return masterTable.map(joinMasterItem);
  },

  get location(): LocationItem[] {
    return locationTable;
  },

  get category(): CategoryItem[] {
    return categoryTable;
  },

  get unit(): UnitItem[] {
    return unitTable;
  },

  get supplier(): SupplierItem[] {
    return supplierTable.map(s => ({
      id: s.id,
      name: s.name,
      contactPerson: s.contact_person,
      phone: s.phone
    }));
  },

  get transaction(): TransactionItem[] {
    return transactionTable.map((tx) => {
      const master = masterTable.find((m) => m.id === tx.item_id);
      const category = categoryTable.find((c) => c.id === master?.category_id);
      const location = locationTable.find((l) => l.id === tx.location_id);
      const staff = staffTable.find((s) => s.id === tx.staff_id);
      return {
        id: tx.id,
        date: tx.date,
        itemId: tx.item_id,
        category: category?.name ?? 'Unknown',
        itemName: master?.name ?? 'Unknown',
        type: tx.type,
        quantity: tx.quantity,
        location: location?.name ?? 'Unknown',
        personInCharge: staff?.name ?? 'Unknown',
      };
    });
  },

  get stocktaking(): StocktakingItem[] {
    return stocktakingTable.map((st) => {
      const master = masterTable.find((m) => m.id === st.item_id);
      const category = categoryTable.find((c) => c.id === master?.category_id);
      const location = locationTable.find((l) => l.id === st.location_id);
      const staff = staffTable.find((s) => s.id === st.staff_id);
      return {
        id: st.id,
        date: st.date,
        itemId: st.item_id,
        category: category?.name ?? 'Unknown',
        itemName: master?.name ?? 'Unknown',
        systemQty: st.system_qty,
        actualQty: st.actual_qty,
        difference: st.difference,
        personInCharge: staff?.name ?? 'Unknown',
        location: location?.name ?? 'Unknown',
      };
    });
  },

  get staff(): StaffItem[] {
    return staffTable;
  },
};

export * from './tables/inventory';
export * from './tables/master';
export * from './tables/location';
export * from './tables/category';
export * from './tables/unit';
export * from './tables/supplier';
export * from './tables/transaction';
export * from './tables/stocktaking';
export * from './tables/staff';
