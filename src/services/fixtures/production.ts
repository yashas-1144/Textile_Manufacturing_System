import type { ProductionPlan, ProductionStage } from '@/models';

/**
 * Mock production-plan fixtures for the Production module.
 * Replace with `GET /api/production/plans` when the backend is available.
 */
export const productionFixtures: ProductionPlan[] = [
  {
    id: 'PP-1', planNumber: 'PP-2026-0156', orderId: 'ORD-2026-0181', orderNumber: 'ORD-2026-0181',
    buyerName: 'Asia Pacific Garments', productName: 'Denim 12oz Indigo', quantity: 15000, unit: 'm',
    status: 'in_progress', priority: 'high', startDate: '2026-10-02', endDate: '2026-10-18', actualStartDate: '2026-10-02',
    stages: [
      { id: 'PP-1-S1', planId: 'PP-1', name: 'spinning', displayName: 'Spinning', status: 'completed', startDate: '2026-10-02', endDate: '2026-10-05', actualStartDate: '2026-10-02', actualEndDate: '2026-10-05', quantity: 15000, completedQuantity: 15000, rejectedQuantity: 120, machineId: 'SP-01', operatorId: 'W-001' },
      { id: 'PP-1-S2', planId: 'PP-1', name: 'weaving', displayName: 'Weaving', status: 'in_progress', startDate: '2026-10-06', endDate: '2026-10-11', actualStartDate: '2026-10-06', quantity: 15000, completedQuantity: 9200, rejectedQuantity: 60, machineId: 'WM-05', operatorId: 'W-002' },
      { id: 'PP-1-S3', planId: 'PP-1', name: 'dyeing', displayName: 'Dyeing', status: 'pending', startDate: '2026-10-12', endDate: '2026-10-15', quantity: 15000, completedQuantity: 0, rejectedQuantity: 0, machineId: 'DM-02' },
      { id: 'PP-1-S4', planId: 'PP-1', name: 'finishing', displayName: 'Finishing', status: 'pending', startDate: '2026-10-16', endDate: '2026-10-18', quantity: 15000, completedQuantity: 0, rejectedQuantity: 0, machineId: 'FM-01' },
    ],
    assignedMachines: ['SP-01', 'WM-05', 'DM-02', 'FM-01'], assignedWorkers: ['W-001', 'W-002'], createdAt: '2026-09-29', updatedAt: '2026-10-08',
  },
  {
    id: 'PP-2', planNumber: 'PP-2026-0157', orderId: 'ORD-2026-0183', orderNumber: 'ORD-2026-0183',
    buyerName: 'EuroFabric Ltd.', productName: 'Poly-Cotton Twill', quantity: 8500, unit: 'm',
    status: 'in_progress', priority: 'medium', startDate: '2026-10-05', endDate: '2026-10-20', actualStartDate: '2026-10-05',
    stages: [
      { id: 'PP-2-S1', planId: 'PP-2', name: 'spinning', displayName: 'Spinning', status: 'completed', startDate: '2026-10-05', endDate: '2026-10-07', actualStartDate: '2026-10-05', actualEndDate: '2026-10-07', quantity: 8500, completedQuantity: 8500, rejectedQuantity: 40, machineId: 'SP-02' },
      { id: 'PP-2-S2', planId: 'PP-2', name: 'weaving', displayName: 'Weaving', status: 'in_progress', startDate: '2026-10-08', endDate: '2026-10-13', actualStartDate: '2026-10-08', quantity: 8500, completedQuantity: 3100, rejectedQuantity: 25, machineId: 'WM-04' },
      { id: 'PP-2-S3', planId: 'PP-2', name: 'dyeing', displayName: 'Dyeing', status: 'pending', startDate: '2026-10-14', endDate: '2026-10-17', quantity: 8500, completedQuantity: 0, rejectedQuantity: 0, machineId: 'DM-03' },
      { id: 'PP-2-S4', planId: 'PP-2', name: 'finishing', displayName: 'Finishing', status: 'pending', startDate: '2026-10-18', endDate: '2026-10-20', quantity: 8500, completedQuantity: 0, rejectedQuantity: 0, machineId: 'FM-02' },
    ],
    assignedMachines: ['SP-02', 'WM-04', 'DM-03', 'FM-02'], assignedWorkers: ['W-004', 'W-005'], createdAt: '2026-10-01', updatedAt: '2026-10-08',
  },
  {
    id: 'PP-3', planNumber: 'PP-2026-0155', orderId: 'ORD-2026-0172', orderNumber: 'ORD-2026-0172',
    buyerName: 'Global Textiles Inc.', productName: 'Cotton Voile', quantity: 5200, unit: 'm',
    status: 'completed', priority: 'high', startDate: '2026-09-18', endDate: '2026-09-30', actualStartDate: '2026-09-18', actualEndDate: '2026-09-29',
    stages: [
      { id: 'PP-3-S1', planId: 'PP-3', name: 'spinning', displayName: 'Spinning', status: 'completed', startDate: '2026-09-18', endDate: '2026-09-20', actualStartDate: '2026-09-18', actualEndDate: '2026-09-20', quantity: 5200, completedQuantity: 5200, rejectedQuantity: 30 },
      { id: 'PP-3-S2', planId: 'PP-3', name: 'weaving', displayName: 'Weaving', status: 'completed', startDate: '2026-09-21', endDate: '2026-09-24', actualStartDate: '2026-09-21', actualEndDate: '2026-09-24', quantity: 5200, completedQuantity: 5200, rejectedQuantity: 18 },
      { id: 'PP-3-S3', planId: 'PP-3', name: 'dyeing', displayName: 'Dyeing', status: 'completed', startDate: '2026-09-25', endDate: '2026-09-27', actualStartDate: '2026-09-25', actualEndDate: '2026-09-27', quantity: 5200, completedQuantity: 5200, rejectedQuantity: 12 },
      { id: 'PP-3-S4', planId: 'PP-3', name: 'finishing', displayName: 'Finishing', status: 'completed', startDate: '2026-09-28', endDate: '2026-09-29', actualStartDate: '2026-09-28', actualEndDate: '2026-09-29', quantity: 5200, completedQuantity: 5200, rejectedQuantity: 5 },
    ],
    assignedMachines: ['SP-03', 'WM-03', 'DM-01', 'FM-03'], assignedWorkers: ['W-006', 'W-007'], createdAt: '2026-09-14', updatedAt: '2026-09-29',
  },
  {
    id: 'PP-4', planNumber: 'PP-2026-0158', orderId: 'ORD-2026-0184', orderNumber: 'ORD-2026-0184',
    buyerName: 'Global Textiles Inc.', productName: 'Combed Cotton Poplin', quantity: 12000, unit: 'm',
    status: 'planned', priority: 'medium', startDate: '2026-10-12', endDate: '2026-10-28',
    stages: [
      { id: 'PP-4-S1', planId: 'PP-4', name: 'spinning', displayName: 'Spinning', status: 'pending', startDate: '2026-10-12', endDate: '2026-10-15', quantity: 12000, completedQuantity: 0, rejectedQuantity: 0 },
      { id: 'PP-4-S2', planId: 'PP-4', name: 'weaving', displayName: 'Weaving', status: 'pending', startDate: '2026-10-16', endDate: '2026-10-21', quantity: 12000, completedQuantity: 0, rejectedQuantity: 0 },
      { id: 'PP-4-S3', planId: 'PP-4', name: 'dyeing', displayName: 'Dyeing', status: 'pending', startDate: '2026-10-22', endDate: '2026-10-25', quantity: 12000, completedQuantity: 0, rejectedQuantity: 0 },
      { id: 'PP-4-S4', planId: 'PP-4', name: 'finishing', displayName: 'Finishing', status: 'pending', startDate: '2026-10-26', endDate: '2026-10-28', quantity: 12000, completedQuantity: 0, rejectedQuantity: 0 },
    ],
    assignedMachines: [], assignedWorkers: [], createdAt: '2026-10-06', updatedAt: '2026-10-06',
  },
  {
    id: 'PP-5', planNumber: 'PP-2026-0159', orderId: 'ORD-2026-0179', orderNumber: 'ORD-2026-0179',
    buyerName: 'Mediterranean Textiles', productName: 'Rayon Challis', quantity: 6400, unit: 'm',
    status: 'on_hold', priority: 'urgent', startDate: '2026-10-07', endDate: '2026-10-22', actualStartDate: '2026-10-07',
    stages: [
      { id: 'PP-5-S1', planId: 'PP-5', name: 'spinning', displayName: 'Spinning', status: 'completed', startDate: '2026-10-07', endDate: '2026-10-09', actualStartDate: '2026-10-07', actualEndDate: '2026-10-09', quantity: 6400, completedQuantity: 6400, rejectedQuantity: 55 },
      { id: 'PP-5-S2', planId: 'PP-5', name: 'weaving', displayName: 'Weaving', status: 'on_hold', startDate: '2026-10-10', endDate: '2026-10-14', actualStartDate: '2026-10-10', quantity: 6400, completedQuantity: 1800, rejectedQuantity: 90, notes: 'Awaiting shade approval' },
      { id: 'PP-5-S3', planId: 'PP-5', name: 'dyeing', displayName: 'Dyeing', status: 'pending', startDate: '2026-10-15', endDate: '2026-10-18', quantity: 6400, completedQuantity: 0, rejectedQuantity: 0 },
      { id: 'PP-5-S4', planId: 'PP-5', name: 'finishing', displayName: 'Finishing', status: 'pending', startDate: '2026-10-19', endDate: '2026-10-22', quantity: 6400, completedQuantity: 0, rejectedQuantity: 0 },
    ],
    assignedMachines: ['SP-01', 'WM-05'], assignedWorkers: ['W-008'], notes: 'On hold pending buyer shade approval', createdAt: '2026-10-03', updatedAt: '2026-10-10',
  },
];

export const STAGE_SEQUENCE: ProductionStage['name'][] = ['spinning', 'weaving', 'dyeing', 'finishing'];
