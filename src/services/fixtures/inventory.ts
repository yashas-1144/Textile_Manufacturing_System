import type { RawMaterial } from '@/models';

/**
 * Mock raw-material fixtures for the Inventory module.
 * Replace with the response of `GET /api/inventory/materials` when the backend
 * is available. Values are illustrative and not persisted anywhere.
 */
export const inventoryFixtures: RawMaterial[] = [
  { id: 'RM-001', name: 'Cotton Yarn NE 30/1', category: 'yarn', specification: '100% Cotton, Ring Spun', unit: 'kg', currentStock: 450, minimumStock: 500, maximumStock: 5000, unitCost: 8.5, supplier: 'Cotton Mills Inc.', location: 'Warehouse A-1', status: 'low_stock', lastRestocked: '2026-09-28', createdAt: '2025-01-15', updatedAt: '2026-10-08' },
  { id: 'RM-002', name: 'Cotton Yarn NE 40/1', category: 'yarn', specification: '100% Cotton, Combed', unit: 'kg', currentStock: 2200, minimumStock: 800, maximumStock: 6000, unitCost: 9.4, supplier: 'Cotton Mills Inc.', location: 'Warehouse A-2', status: 'in_stock', lastRestocked: '2026-10-02', createdAt: '2025-01-15', updatedAt: '2026-10-08' },
  { id: 'RM-003', name: 'Polyester Yarn 150D/48F', category: 'yarn', specification: '100% Polyester, FDY', unit: 'kg', currentStock: 2800, minimumStock: 1000, maximumStock: 10000, unitCost: 3.2, supplier: 'PolyChem Ltd.', location: 'Warehouse A-3', status: 'in_stock', lastRestocked: '2026-10-05', createdAt: '2025-01-15', updatedAt: '2026-10-08' },
  { id: 'RM-004', name: 'Viscose Yarn 30S', category: 'yarn', specification: '100% Viscose, Ring Spun', unit: 'kg', currentStock: 720, minimumStock: 800, maximumStock: 8000, unitCost: 5.8, supplier: 'Viscose International', location: 'Warehouse B-1', status: 'low_stock', lastRestocked: '2026-09-20', createdAt: '2025-02-20', updatedAt: '2026-10-08' },
  { id: 'RM-005', name: 'Reactive Dye - Navy Blue', category: 'dye', specification: 'Reactive Blue RB-19', unit: 'kg', currentStock: 260, minimumStock: 80, maximumStock: 800, unitCost: 45, supplier: 'DyeChem Corp.', location: 'Warehouse C-1', status: 'in_stock', lastRestocked: '2026-10-06', createdAt: '2025-03-10', updatedAt: '2026-10-08' },
  { id: 'RM-006', name: 'Reactive Dye - Scarlet', category: 'dye', specification: 'Reactive Red RR-24', unit: 'kg', currentStock: 40, minimumStock: 60, maximumStock: 600, unitCost: 52, supplier: 'DyeChem Corp.', location: 'Warehouse C-2', status: 'low_stock', lastRestocked: '2026-09-15', createdAt: '2025-03-10', updatedAt: '2026-10-08' },
  { id: 'RM-007', name: 'Caustic Soda Flakes', category: 'chemical', specification: '99% NaOH', unit: 'kg', currentStock: 5000, minimumStock: 2000, maximumStock: 20000, unitCost: 0.85, supplier: 'Chemical Supplies Ltd.', location: 'Warehouse D-1', status: 'in_stock', lastRestocked: '2026-10-04', createdAt: '2025-01-15', updatedAt: '2026-10-08' },
  { id: 'RM-008', name: 'Acetic Acid 80%', category: 'chemical', specification: 'Technical Grade', unit: 'L', currentStock: 45, minimumStock: 100, maximumStock: 1000, unitCost: 12.5, supplier: 'Chemical Supplies Ltd.', location: 'Warehouse D-2', status: 'low_stock', lastRestocked: '2026-09-12', createdAt: '2025-01-15', updatedAt: '2026-10-08' },
  { id: 'RM-009', name: 'Elastic Tape 10mm', category: 'accessory', specification: 'White, Knitted', unit: 'm', currentStock: 0, minimumStock: 5000, maximumStock: 50000, unitCost: 0.15, supplier: 'Accessories Plus', location: 'Warehouse E-1', status: 'out_of_stock', lastRestocked: '2026-08-15', createdAt: '2025-05-20', updatedAt: '2026-10-08' },
  { id: 'RM-010', name: 'Sewing Thread 40/2', category: 'accessory', specification: 'Polyester Core Spun', unit: 'm', currentStock: 3200, minimumStock: 1000, maximumStock: 20000, unitCost: 0.08, supplier: 'Accessories Plus', location: 'Warehouse E-2', status: 'in_stock', lastRestocked: '2026-10-01', createdAt: '2025-05-20', updatedAt: '2026-10-08' },
];
