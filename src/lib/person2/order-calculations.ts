import type { ProductionOrder, OrderStatus } from '../../types/person2/orders';
import type { FabricRollInspection } from '../../types/person2/quality';
import { getOrderStageQuantities } from './production-calculations';

export const formatINR = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
export function calculateOrderProgress(order: ProductionOrder): number { return order.requiredQuantity <= 0 ? 0 : Math.min(100, Math.round((getOrderStageQuantities(order).finishedQuantity / order.requiredQuantity) * 100)); }
export function calculateOrderFinancials(order: ProductionOrder) {
  const finishedGoodsValue = getOrderStageQuantities(order).finishedQuantity * order.unitPrice;
  const totalContractValue = order.requiredQuantity * order.unitPrice;
  const estimatedMaterialCost = order.materialsRequired.reduce((sum, material) => sum + material.requiredAmount, 0) * 0.6;
  const wipValue = (order.spinningQuantity + order.weavingQuantity) * order.unitPrice * 0.4;
  const projectedGrossMargin = totalContractValue - estimatedMaterialCost;
  return { unitPrice: order.unitPrice, totalContractValue, finishedGoodsValue, remainingContractValue: Math.max(0, totalContractValue - finishedGoodsValue), wipValue, estimatedMaterialCost, projectedGrossMargin, marginPercentage: totalContractValue ? Math.round((projectedGrossMargin / totalContractValue) * 100) : 0 };
}
export function getOrderQualityInfo(order: ProductionOrder, inspections: FabricRollInspection[]) {
  const orderInspections = inspections.filter((inspection) => inspection.productionOrderId === order.id);
  const latest = orderInspections[orderInspections.length - 1];
  return { orderInspections, defectReason: latest?.inspectionResult === 'Passed' ? undefined : latest?.defectType };
}
function inspectionIsCurrentPass(inspection: FabricRollInspection, allInspections: FabricRollInspection[]): boolean {
  const rollLineage = inspection.reinspectionOf ?? inspection.rollId;
  const latest = allInspections
    .filter((item) => item.productionOrderId === inspection.productionOrderId && (item.rollId === rollLineage || item.reinspectionOf === rollLineage))
    .sort((left, right) => left.inspectionDate.localeCompare(right.inspectionDate))
    .at(-1);
  return latest?.inspectionResult === 'Passed';
}
export function validateOrderStatusTransition(order: ProductionOrder, nextStatus: OrderStatus, inspections: FabricRollInspection[] = []): { valid: boolean; error?: string; reason?: string } {
  if (order.status === nextStatus) return { valid: true };
  if (order.status === 'Completed' || order.status === 'Cancelled') { const reason = `A ${order.status.toLowerCase()} order cannot be transitioned.`; return { valid: false, error: reason, reason }; }
  if (nextStatus === 'Completed') {
    const stages = getOrderStageQuantities(order);
    const passed = inspections.some((item) => item.productionOrderId === order.id && inspectionIsCurrentPass(item, inspections));
    if (stages.finishedQuantity < order.requiredQuantity) return { valid: false, error: 'Finished production must reach the target before completion.' };
    if (!passed) return { valid: false, error: 'A passing quality inspection is required before completion.' };
  }
  return { valid: true };
}
export function getAvailableOrderStatuses(order: ProductionOrder, inspections: FabricRollInspection[] = []) {
  const all: OrderStatus[] = ['Pending', 'In Production', 'Quality Check', 'Rework Required', 'Completed', 'Rejected', 'Cancelled'];
  return all.filter((status) => validateOrderStatusTransition(order, status, inspections).valid).map((status) => ({ status, label: status }));
}
