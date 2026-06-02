import { inventoryTable } from './tables/inventory';
import { masterTable } from './tables/master';
import { locationTable } from './tables/location';
import { categoryTable } from './tables/category';
import { supplierTable } from './tables/supplier';
import { transactionTable } from './tables/transaction';
import { stocktakingTable } from './tables/stocktaking';
import { staffTable } from './tables/staff';

import type {
  InventoryItem,
  MasterItem,
  LocationItem,
  CategoryItem,
  SupplierItem,
  TransactionItem,
  StocktakingItem,
  StaffItem,
} from '../types';

// Helper to simulate joins
const joinMasterItem = (rawMaster: typeof masterTable[0]): MasterItem => {
  const category = categoryTable.find((c) => c.id === rawMaster.categoryId);
  const locations = rawMaster.locationIds
    .map((id) => locationTable.find((l) => l.id === id)?.name)
    .filter(Boolean) as string[];
  const supplier = supplierTable.find((s) => s.id === rawMaster.supplierId);

  return {
    ...rawMaster,
    category: category?.name ?? 'Unknown',
    locations,
    supplier: supplier?.name ?? 'Unknown',
  };
};

export const db = {
  get inventory(): InventoryItem[] {
    return inventoryTable.map((inv) => {
      const master = masterTable.find((m) => m.id === inv.itemId);
      const location = locationTable.find((l) => l.id === inv.locationId);
      return {
        id: inv.id,
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

  get supplier(): SupplierItem[] {
    return supplierTable;
  },

  get transaction(): TransactionItem[] {
    return transactionTable.map((tx) => {
      const master = masterTable.find((m) => m.id === tx.itemId);
      const location = locationTable.find((l) => l.id === tx.locationId);
      const staff = staffTable.find((s) => s.id === tx.staffId);
      return {
        ...tx,
        itemName: master?.name ?? 'Unknown',
        location: location?.name ?? 'Unknown',
        personInCharge: staff?.name ?? 'Unknown',
      };
    });
  },

  get stocktaking(): StocktakingItem[] {
    return stocktakingTable.map((st) => {
      const master = masterTable.find((m) => m.id === st.itemId);
      const location = locationTable.find((l) => l.id === st.locationId);
      const staff = staffTable.find((s) => s.id === st.staffId);
      return {
        ...st,
        itemName: master?.name ?? 'Unknown',
        location: location?.name ?? 'Unknown',
        personInCharge: staff?.name ?? 'Unknown',
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
export * from './tables/supplier';
export * from './tables/transaction';
export * from './tables/stocktaking';
export * from './tables/staff';
