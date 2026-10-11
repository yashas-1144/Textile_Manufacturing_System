import type { StockHealthStatus } from '../../types/person2/inventory';

export function determineStockStatus(quantity: number, reorderThreshold: number): StockHealthStatus {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= reorderThreshold) return 'Low Stock';
  return 'Available';
}
