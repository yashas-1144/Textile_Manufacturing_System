import type { ProductionOrder, ProductionStage } from '../../types/person2/orders';
import type { Machine, ProductionProcess } from '../../types/person2/production';

export interface OrderStageQuantities {
  spinningQuantity: number;
  weavingQuantity: number;
  dyeingQuantity: number;
  finishedQuantity: number;
  remainingQuantity: number;
  progressPercentage: number;
}

const stageOrder: ProductionProcess[] = ['Spinning', 'Weaving', 'Dyeing'];
export function getOrderStageQuantities(order: ProductionOrder): OrderStageQuantities {
  const spinningQuantity = order.spinningQuantity ?? 0;
  const weavingQuantity = order.weavingQuantity ?? 0;
  const dyeingQuantity = order.dyeingQuantity ?? 0;
  // Finished fabric is final-stage output, never a sum of intermediate stages.
  const finishedQuantity = dyeingQuantity;
  const remainingQuantity = Math.max(0, order.requiredQuantity - finishedQuantity);
  return { spinningQuantity, weavingQuantity, dyeingQuantity, finishedQuantity, remainingQuantity, progressPercentage: order.requiredQuantity ? Math.min(100, Math.round((finishedQuantity / order.requiredQuantity) * 100)) : 0 };
}
export function calculateRemainingQuantity(orderOrTarget: ProductionOrder | number, completedOrStage?: number | ProductionProcess): number {
  if (typeof orderOrTarget === 'number') return Math.max(0, orderOrTarget - (typeof completedOrStage === 'number' ? completedOrStage : 0));
  return getOrderStageQuantities(orderOrTarget).remainingQuantity;
}
export function getStageAvailabilityInfo(order: ProductionOrder, stage: ProductionProcess) {
  const quantities = getOrderStageQuantities(order);
  const availableQuantity = stage === 'Spinning' ? order.requiredQuantity : stage === 'Weaving' ? quantities.spinningQuantity : quantities.weavingQuantity;
  const producedQuantity = stage === 'Spinning' ? quantities.spinningQuantity : stage === 'Weaving' ? quantities.weavingQuantity : quantities.dyeingQuantity;
  const isStageBlocked = stage !== 'Spinning' && availableQuantity <= producedQuantity;
  const previousStageLabel = stage === 'Weaving' ? 'Spinning' : stage === 'Dyeing' ? 'Weaving' : 'Order target';
  return { availableQuantity, producedQuantity, remainingQuantity: Math.max(0, availableQuantity - producedQuantity), availableFromPrevious: availableQuantity, previousStageLabel, isStageBlocked, blockReason: isStageBlocked ? `${previousStageLabel} output is required before ${stage}.` : '' };
}
export function validateStageProduction(order: ProductionOrder, stage: ProductionProcess, quantity: number): { valid: boolean; error?: string } {
  if (!Number.isFinite(quantity) || quantity <= 0) return { valid: false, error: 'Production quantity must be greater than zero.' };
  const info = getStageAvailabilityInfo(order, stage);
  if (quantity > info.remainingQuantity) return { valid: false, error: `Only ${info.remainingQuantity.toLocaleString()} units are available for ${stage}.` };
  return { valid: true };
}
export function calculateFleetUtilization(machinesOrRunning: Machine[] | number, totalOrLogs: number | unknown[] = []): number {
  if (typeof machinesOrRunning === 'number') return typeof totalOrLogs === 'number' && totalOrLogs > 0 ? Math.round((machinesOrRunning / totalOrLogs) * 100) : 0;
  return machinesOrRunning.length === 0 ? 0 : Math.round((machinesOrRunning.filter((machine) => machine.status === 'Running').length / machinesOrRunning.length) * 100);
}
export { stageOrder };
