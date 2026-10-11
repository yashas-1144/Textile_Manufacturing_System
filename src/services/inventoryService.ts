import type { RawMaterial } from '@/models';
import { cloneFixtures, delay, USE_MOCK, ApiError, apiRequest } from './apiClient';
import { inventoryFixtures } from './fixtures/inventory';
import { mapMaterial, type BackendRow } from './mappers';

const upper = (v: string): string => v.toUpperCase();

export type ReorderLevel = 'adequate' | 'soon' | 'now' | 'out';

export interface ReorderIndicator {
  level: ReorderLevel;
  label: string;
  variant: 'success' | 'warning' | 'danger';
}

/** Derives the reorder status from current stock versus the reorder threshold. */
export function getReorderIndicator(material: Pick<RawMaterial, 'currentStock' | 'minimumStock'>): ReorderIndicator {
  if (material.currentStock <= 0) {
    return { level: 'out', label: 'Out of stock', variant: 'danger' };
  }
  if (material.currentStock <= material.minimumStock) {
    return { level: 'now', label: 'Reorder now', variant: 'danger' };
  }
  if (material.currentStock <= material.minimumStock * 1.25) {
    return { level: 'soon', label: 'Reorder soon', variant: 'warning' };
  }
  return { level: 'adequate', label: 'Adequate', variant: 'success' };
}

/** Mirrors the backend's stock-status derivation so the UI stays consistent. */
export function deriveStockStatus(material: Pick<RawMaterial, 'currentStock' | 'minimumStock'>): RawMaterial['status'] {
  if (material.currentStock <= 0) return 'out_of_stock';
  if (material.currentStock <= material.minimumStock) return 'low_stock';
  return 'in_stock';
}

export interface CreateMaterialInput {
  name: string;
  category: RawMaterial['category'];
  specification: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unitCost: number;
  supplier: string;
  location: string;
}

export const inventoryService = {
  /** GET /api/inventory/materials */
  async getMaterials(): Promise<RawMaterial[]> {
    if (USE_MOCK) {
      await delay();
      return cloneFixtures(inventoryFixtures);
    }
    const data = await apiRequest<{ materials: BackendRow[]; total: number }>('/inventory/materials?limit=200');
    return data.materials.map(mapMaterial);
  },

  /** POST /api/inventory/materials */
  async createMaterial(input: CreateMaterialInput): Promise<RawMaterial> {
    if (USE_MOCK) {
      await delay();
      const now = new Date().toISOString();
      return {
        id: `RM-${Date.now()}`,
        name: input.name,
        category: input.category,
        specification: input.specification,
        unit: input.unit,
        currentStock: input.currentStock,
        minimumStock: input.minimumStock,
        maximumStock: input.maximumStock,
        unitCost: input.unitCost,
        supplier: input.supplier,
        location: input.location,
        status: deriveStockStatus(input),
        lastRestocked: now.slice(0, 10),
        createdAt: now,
        updatedAt: now,
      };
    }

    let supplierId: string | undefined;
    if (input.supplier.trim()) {
      const suppliers = await apiRequest<{ suppliers: BackendRow[] }>('/inventory/suppliers');
      const match = suppliers.suppliers.find((s) => String(s.name).trim().toLowerCase() === input.supplier.trim().toLowerCase());
      if (match) supplierId = String(match.id);
    }

    const created = await apiRequest<{ material: BackendRow }>('/inventory/materials', {
      method: 'POST',
      body: {
        name: input.name.trim(),
        category: upper(input.category),
        specification: input.specification.trim(),
        unit: input.unit.trim(),
        currentStock: input.currentStock,
        minimumStock: input.minimumStock,
        maximumStock: input.maximumStock,
        unitCost: input.unitCost,
        supplierId,
        location: input.location.trim(),
      },
    });
    return mapMaterial(created.material);
  },

  /** POST /api/inventory/materials/:id/receipt */
  async reorderMaterial(id: string, quantity: number): Promise<{ id: string; addedQuantity: number }> {
    if (quantity <= 0) throw new ApiError('Reorder quantity must be greater than zero', 400);
    if (USE_MOCK) {
      await delay();
      return { id, addedQuantity: quantity };
    }
    const material = await apiRequest<{ material: BackendRow }>(`/inventory/materials/${id}`);
    await apiRequest(`/inventory/materials/${id}/receipt`, {
      method: 'POST',
      body: { quantity, unitCost: Number(material.material.unitCost) || 1 },
    });
    return { id, addedQuantity: quantity };
  },
};
