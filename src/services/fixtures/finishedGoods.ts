import type { FinishedRoll } from '@/models';

export type QcStatus = 'passed' | 'pending' | 'failed';

/**
 * Finished roll extended with the quality-inspection gate. A roll may only be
 * marked ready for dispatch once its linked inspection has passed.
 */
export interface RollRecord extends FinishedRoll {
  qcStatus: QcStatus;
  readyForDispatch: boolean;
  inspectionNumber?: string;
}

/**
 * Mock finished-goods fixtures. Roll numbers, production plans, products and
 * buyer orders align with the production, quality, and order fixtures so that
 * dispatches can select real rolls and link them to the correct buyer order.
 */
export const finishedRollFixtures: RollRecord[] = [
  { id: 'FR-0101', rollNumber: 'FR-2026-0101', productionPlanId: 'PP-2026-0158', productionPlanNumber: 'PP-2026-0158', productName: 'Combed Cotton Poplin', specification: '100% Cotton, 120 GSM', length: 105, width: 1.5, weight: 18.9, unit: 'meters', qualityGrade: 'A', location: 'Warehouse F-1', status: 'allocated', orderId: 'O-0184', orderNumber: 'ORD-2026-0184', dispatchId: 'DIS-2026-0091', createdAt: '2026-10-08', updatedAt: '2026-10-10', qcStatus: 'passed', readyForDispatch: true, inspectionNumber: 'QI-2026-0197' },
  { id: 'FR-0102', rollNumber: 'FR-2026-0102', productionPlanId: 'PP-2026-0158', productionPlanNumber: 'PP-2026-0158', productName: 'Combed Cotton Poplin', specification: '100% Cotton, 120 GSM', length: 102, width: 1.5, weight: 18.4, unit: 'meters', qualityGrade: 'A', location: 'Warehouse F-1', status: 'allocated', orderId: 'O-0184', orderNumber: 'ORD-2026-0184', dispatchId: 'DIS-2026-0091', createdAt: '2026-10-08', updatedAt: '2026-10-10', qcStatus: 'passed', readyForDispatch: true, inspectionNumber: 'QI-2026-0197' },
  { id: 'FR-0103', rollNumber: 'FR-2026-0103', productionPlanId: 'PP-2026-0158', productionPlanNumber: 'PP-2026-0158', productName: 'Combed Cotton Poplin', specification: '100% Cotton, 120 GSM', length: 98, width: 1.5, weight: 17.6, unit: 'meters', qualityGrade: 'B', location: 'Warehouse F-1', status: 'available', createdAt: '2026-10-08', updatedAt: '2026-10-08', qcStatus: 'passed', readyForDispatch: true, inspectionNumber: 'QI-2026-0197' },
  { id: 'FR-0104', rollNumber: 'FR-2026-0104', productionPlanId: 'PP-2026-0158', productionPlanNumber: 'PP-2026-0158', productName: 'Combed Cotton Poplin', specification: '100% Cotton, 120 GSM', length: 100, width: 1.5, weight: 18.0, unit: 'meters', qualityGrade: 'A', location: 'QC Hold Area', status: 'available', createdAt: '2026-10-09', updatedAt: '2026-10-09', qcStatus: 'pending', readyForDispatch: false },
  { id: 'FR-0105', rollNumber: 'FR-2026-0105', productionPlanId: 'PP-2026-0157', productionPlanNumber: 'PP-2026-0157', productName: 'Poly-Cotton Twill', specification: '65/35 Poly-Cotton, 180 GSM', length: 120, width: 1.5, weight: 24.0, unit: 'meters', qualityGrade: 'A', location: 'Warehouse F-2', status: 'allocated', orderId: 'O-0183', orderNumber: 'ORD-2026-0183', dispatchId: 'DIS-2026-0092', createdAt: '2026-10-07', updatedAt: '2026-10-09', qcStatus: 'passed', readyForDispatch: true, inspectionNumber: 'QI-2026-0200' },
  { id: 'FR-0106', rollNumber: 'FR-2026-0106', productionPlanId: 'PP-2026-0157', productionPlanNumber: 'PP-2026-0157', productName: 'Poly-Cotton Twill', specification: '65/35 Poly-Cotton, 180 GSM', length: 118, width: 1.5, weight: 23.6, unit: 'meters', qualityGrade: 'B', location: 'Warehouse F-2', status: 'allocated', orderId: 'O-0183', orderNumber: 'ORD-2026-0183', dispatchId: 'DIS-2026-0092', createdAt: '2026-10-07', updatedAt: '2026-10-09', qcStatus: 'passed', readyForDispatch: true, inspectionNumber: 'QI-2026-0200' },
  { id: 'FR-0107', rollNumber: 'FR-2026-0107', productionPlanId: 'PP-2026-0157', productionPlanNumber: 'PP-2026-0157', productName: 'Poly-Cotton Twill', specification: '65/35 Poly-Cotton, 180 GSM', length: 95, width: 1.5, weight: 19.0, unit: 'meters', qualityGrade: 'reject', location: 'QC Hold Area', status: 'available', createdAt: '2026-10-07', updatedAt: '2026-10-08', qcStatus: 'failed', readyForDispatch: false, inspectionNumber: 'QI-2026-0203' },
  { id: 'FR-0108', rollNumber: 'FR-2026-0108', productionPlanId: 'PP-2026-0156', productionPlanNumber: 'PP-2026-0156', productName: 'Denim 12oz Indigo', specification: '100% Cotton, 12oz', length: 130, width: 1.6, weight: 32.5, unit: 'meters', qualityGrade: 'A', location: 'Warehouse D-1', status: 'available', orderId: 'O-0181', orderNumber: 'ORD-2026-0181', createdAt: '2026-10-09', updatedAt: '2026-10-09', qcStatus: 'passed', readyForDispatch: false, inspectionNumber: 'QI-2026-0204' },
  { id: 'FR-0109', rollNumber: 'FR-2026-0109', productionPlanId: 'PP-2026-0156', productionPlanNumber: 'PP-2026-0156', productName: 'Denim 12oz Indigo', specification: '100% Cotton, 12oz', length: 128, width: 1.6, weight: 32.0, unit: 'meters', qualityGrade: 'B', location: 'Warehouse D-1', status: 'dispatched', orderId: 'O-0181', orderNumber: 'ORD-2026-0181', dispatchId: 'DIS-2026-0093', createdAt: '2026-10-09', updatedAt: '2026-10-10', qcStatus: 'passed', readyForDispatch: true, inspectionNumber: 'QI-2026-0204' },
  { id: 'FR-0110', rollNumber: 'FR-2026-0110', productionPlanId: 'PP-2026-0155', productionPlanNumber: 'PP-2026-0155', productName: 'Cotton Voile', specification: '100% Cotton, 90 GSM', length: 110, width: 1.4, weight: 13.5, unit: 'meters', qualityGrade: 'A', location: 'Warehouse F-3', status: 'dispatched', orderId: 'O-0172', orderNumber: 'ORD-2026-0172', dispatchId: 'DIS-2026-0090', createdAt: '2026-10-03', updatedAt: '2026-10-06', qcStatus: 'passed', readyForDispatch: true, inspectionNumber: 'QI-2026-0197' },
  { id: 'FR-0111', rollNumber: 'FR-2026-0111', productionPlanId: 'PP-2026-0159', productionPlanNumber: 'PP-2026-0159', productName: 'Rayon Challis', specification: '100% Rayon, 110 GSM', length: 112, width: 1.5, weight: 15.2, unit: 'meters', qualityGrade: 'A', location: 'Warehouse F-2', status: 'available', orderId: 'O-0179', orderNumber: 'ORD-2026-0179', createdAt: '2026-10-10', updatedAt: '2026-10-10', qcStatus: 'passed', readyForDispatch: true, inspectionNumber: 'QI-2026-0200' },
  { id: 'FR-0112', rollNumber: 'FR-2026-0112', productionPlanId: 'PP-2026-0159', productionPlanNumber: 'PP-2026-0159', productName: 'Rayon Challis', specification: '100% Rayon, 110 GSM', length: 108, width: 1.5, weight: 14.7, unit: 'meters', qualityGrade: 'B', location: 'QC Hold Area', status: 'available', createdAt: '2026-10-10', updatedAt: '2026-10-10', qcStatus: 'pending', readyForDispatch: false },
];
