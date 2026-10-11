import type { ProductionOrder } from '../../types/person2/orders';
import type { FabricRollInspection } from '../../types/person2/quality';

const inspectionOrderId = (inspection: FabricRollInspection) => inspection.productionOrderId;
const matchingOrder = (inspection: FabricRollInspection, orders: ProductionOrder[]) => orders.find((order) => order.id === inspectionOrderId(inspection));

export function checkOrderInspectionEligibility(order: ProductionOrder) {
  const producedQuantity = order.dyeingQuantity;
  const progressPercent = order.requiredQuantity ? Math.min(100, Math.round((producedQuantity / order.requiredQuantity) * 100)) : 0;
  const isEligible = order.status !== 'Cancelled' && order.status !== 'Rejected' && producedQuantity > 0;
  const message = isEligible ? 'Ready for quality inspection.' : order.status === 'Cancelled' ? 'Cancelled orders cannot be inspected.' : order.status === 'Rejected' ? 'Rejected orders cannot be inspected.' : 'Dyeing output is required before inspection.';
  return { isEligible, message, producedQuantity, requiredQuantity: order.requiredQuantity, progressPercent };
}
export function isInspectionEligible(inspection: FabricRollInspection, orders: ProductionOrder[]): boolean {
  const order = matchingOrder(inspection, orders);
  return Boolean(order && checkOrderInspectionEligibility(order).isEligible);
}
export function getInspectionIneligibilityReason(inspection: FabricRollInspection, orders: ProductionOrder[]): string {
  const order = matchingOrder(inspection, orders);
  return order ? checkOrderInspectionEligibility(order).message : 'The related production order was not found.';
}
export function validateInspectionSubmission(inspection: { rollId: string; [key: string]: unknown }): { isValid: boolean; errorMessage?: string } {
  if (!inspection.order) return { isValid: false, errorMessage: 'Select a production order.' };
  if (!inspection.rollId.trim()) return { isValid: false, errorMessage: 'Roll ID is required.' };
  if (!Number.isFinite(inspection.rollLengthMeters) || Number(inspection.rollLengthMeters) <= 0) return { isValid: false, errorMessage: 'Inspection quantity must be greater than zero.' };
  return { isValid: true };
}
function currentInspections(inspections: FabricRollInspection[]) {
  const latest = new Map<string, FabricRollInspection>();
  for (const inspection of inspections) {
    const lineage = `${inspection.productionOrderId}:${inspection.reinspectionOf ?? inspection.rollId}`;
    const prior = latest.get(lineage);
    if (!prior || prior.inspectionDate <= inspection.inspectionDate) latest.set(lineage, inspection);
  }
  return [...latest.values()];
}
export function calculateQualityMetrics(inspections: FabricRollInspection[], orders: ProductionOrder[] = []) {
  const current = currentInspections(inspections);
  const approved = current.filter((item) => item.inspectionResult === 'Passed');
  const rework = current.filter((item) => item.inspectionResult === 'Rework Required');
  const rejected = current.filter((item) => item.inspectionResult === 'Rejected' || item.inspectionResult === 'Failed');
  const totalMetersInspected = current.reduce((sum, item) => sum + item.rollLengthMeters, 0);
  const approvedMeters = approved.reduce((sum, item) => sum + item.rollLengthMeters, 0);
  return { passRatePercentage: current.length ? Math.round((approved.length / current.length) * 100) : 0, approvedCount: approved.length, totalInspected: current.length, approvedMeters, totalMetersInspected, reworkCount: rework.length, rejectedCount: rejected.length, rejectedMeters: rejected.reduce((sum, item) => sum + item.rollLengthMeters, 0), ineligibleCount: inspections.filter((item) => !isInspectionEligible(item, orders)).length };
}
export function calculateDefectDistribution(inspections: FabricRollInspection[], _orders: ProductionOrder[] = []): Record<string, number> {
  return inspections.filter((item) => item.defectType !== 'None (Flawless)').reduce<Record<string, number>>((counts, item) => { counts[item.defectType] = (counts[item.defectType] ?? 0) + 1; return counts; }, {});
}
