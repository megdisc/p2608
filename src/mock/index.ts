import { inventoryTable } from './tables/inventory';
import { masterTable } from './tables/master';
import { locationTable } from './tables/location';
import { categoryTable } from './tables/category';
import { supplierTable } from './tables/supplier';
import { transactionTable } from './tables/transaction';
import { stocktakingTable } from './tables/stocktaking';

import type {
  InventoryItem,
  MasterItem,
  LocationItem,
  CategoryItem,
  SupplierItem,
  TransactionItem,
  StocktakingItem,
} from '../types';

// Helper to simulate joins
const joinMasterItem = (rawMaster: typeof masterTable[0]): MasterItem => {
  const category = categoryTable.find((c) => c.id === rawMaster.categoryId);
  const location = locationTable.find((l) => l.id === rawMaster.locationId);
  const supplier = supplierTable.find((s) => s.id === rawMaster.supplierId);

  return {
    ...rawMaster,
    category: category?.name ?? 'Unknown',
    location: location?.name ?? 'Unknown',
    supplier: supplier?.name ?? 'Unknown',
  };
};

export const db = {
  get inventory(): InventoryItem[] {
    return inventoryTable.map((inv) => {
      const master = masterTable.find((m) => m.id === inv.id);
      return {
        id: inv.id,
        name: master?.name ?? 'Unknown',
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
      return {
        ...tx,
        itemName: master?.name ?? 'Unknown',
      };
    });
  },

  get stocktaking(): StocktakingItem[] {
    return stocktakingTable.map((st) => {
      const master = masterTable.find((m) => m.id === st.itemId);
      const location = locationTable.find((l) => l.id === st.locationId);
      return {
        ...st,
        itemName: master?.name ?? 'Unknown',
        location: location?.name ?? 'Unknown',
      };
    });
  },
};

export * from './tables/inventory';
export * from './tables/master';
export * from './tables/location';
export * from './tables/category';
export * from './tables/supplier';
export * from './tables/transaction';
export * from './tables/stocktaking';
