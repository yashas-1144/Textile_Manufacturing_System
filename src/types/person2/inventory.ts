export type MaterialCategory = 'Cotton' | 'Yarn' | 'Dye' | 'Chemical' | 'Packaging' | 'Other';
export type StockHealthStatus = 'Available' | 'Low Stock' | 'Out of Stock';
export type InventoryTransactionType = 'Received' | 'Issued' | 'Adjusted';

export interface RawMaterial {
  id: string;
  name: string;
  category: MaterialCategory;
  colour: string;
  supplier: string;
  availableQuantity: number;
  minimumStockLevel: number;
  unit: string;
  status: StockHealthStatus;
  lastRestockedDate?: string;
  location?: string;
  unitCost?: number;
}

export interface InventoryTransaction {
  id: string;
  materialId: string;
  materialName: string;
  type: InventoryTransactionType;
  quantity: number;
  unit: string;
  referenceId: string;
  timestamp: string;
  performedBy: string;
  notes?: string;
}
