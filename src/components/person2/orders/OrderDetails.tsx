/**
 * @file components/person2/orders/OrderDetails.tsx
 * Order Details View (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React from 'react';
import { ProductionOrder, OrderStatus } from '../../../types/person2/orders';
import { FabricRollInspection } from '../../../types/person2/quality';
import {
  calculateOrderProgress,
  calculateOrderFinancials,
  formatINR,
  getOrderQualityInfo,
  getAvailableOrderStatuses,
} from '../../../lib/person2/order-calculations';
import { getOrderStageQuantities } from '../../../lib/person2/production-calculations';
import { AlertTriangle, AlertCircle, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import {
  btnSecondary,
  btnEdit,
  getOrderStatusBadgeClass,
} from '../../../lib/person2/ui-styles';

interface OrderDetailsProps {
  order: ProductionOrder | null;
  inspections?: FabricRollInspection[];
  onClose: () => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onEditOrder?: (order: ProductionOrder) => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({
  order,
  inspections = [],
  onClose,
  onUpdateStatus,
  onEditOrder,
}) => {
  if (!order) return null;

  const progress = calculateOrderProgress(order);
  const stages = getOrderStageQuantities(order);
  const financials = calculateOrderFinancials(order);
  const qualityInfo = getOrderQualityInfo(order, inspections);
  const availableStatuses = getAvailableOrderStatuses(order, inspections);
  const hasCurrentStatus = availableStatuses.some((opt) => opt.status === order.status);
  const statusOptions = hasCurrentStatus
    ? availableStatuses
    : [{ status: order.status, label: order.status }, ...availableStatuses];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded border border-slate-300 shadow-lg w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-xs text-slate-800">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-300 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm font-mono">{order.id}</span>
              <span className="text-slate-400">·</span>
              <span className="font-medium text-slate-700">{order.clientName}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  order.priority === 'Urgent'
                    ? 'bg-red-100 text-red-800'
                    : order.priority === 'High'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {order.priority}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Created: {order.createdAt} · Deadline: {order.deadline}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onEditOrder && (
              <button
                type="button"
                onClick={() => onEditOrder(order)}
                className={btnEdit}
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 px-2 py-1 text-sm font-semibold rounded hover:bg-slate-200/60"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4 overflow-y-auto space-y-4">
          {/* Order Status & Overall Output */}
          <div className="bg-slate-50 border border-slate-300 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-slate-500 text-[11px] block">Production Status:</span>
              <select
                value={order.status}
                onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                className={`border text-[11px] font-semibold rounded-[6px] px-2.5 py-1 mt-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs transition-colors ${getOrderStatusBadgeClass(
                  order.status
                )}`}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.status} value={opt.status}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-slate-500 text-[11px] block">Finished Output (Dyeing):</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block font-mono">
                {stages.finishedQuantity.toLocaleString()} / {order.requiredQuantity.toLocaleString()} m ({progress}%)
              </span>
              <span className="text-[10px] text-slate-500">
                Remaining: {stages.remainingQuantity.toLocaleString()} m
              </span>
            </div>
          </div>

          {/* QUALITY CONTROL WORKFLOW STATUS BANNER */}
          {order.status === 'Rework Required' && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold text-amber-900 text-xs">
                    Quality Inspection: Rework Required
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-semibold rounded text-[10px]">
                  Quality Hold
                </span>
              </div>
              <p className="text-amber-800">
                Defect reason:{' '}
                <strong className="font-semibold text-amber-950">
                  {qualityInfo.defectReason || order.defectReason || 'Colour mismatch'}
                </strong>
                . Even though production output reached target quantity, this order is NOT completed until rework is recorded and a subsequent inspection passes.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onUpdateStatus(order.id, 'In Production')}
                  className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Return Order to Production / Rework
                </button>
              </div>
            </div>
          )}

          {order.status === 'Rejected' && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-bold text-rose-900 text-xs">
                    Quality Inspection: Rejected
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-rose-200 text-rose-900 font-semibold rounded text-[10px]">
                  Rejected
                </span>
              </div>
              <p className="text-rose-800">
                Defect reason:{' '}
                <strong className="font-semibold text-rose-950">
                  {qualityInfo.defectReason || order.defectReason || 'Severe defect'}
                </strong>
                . This order failed quality grading and cannot be marked as successfully completed.
              </p>
            </div>
          )}

          {order.status === 'Quality Check' && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-bold text-indigo-900">
                  Quality Check — Inspection Pending
                </span>
              </div>
              <p className="text-indigo-700 mt-1">
                {progress === 100
                  ? 'Fabric production has reached 100% target. Rolls must undergo final quality grading before this order can be marked Completed.'
                  : 'Fabric rolls under inspection. Inspection must pass before dispatch approval.'}
              </p>
            </div>
          )}

          {order.status === 'Completed' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-emerald-900">
                  Quality Approved & Order Completed
                </span>
              </div>
              <p className="text-emerald-700 mt-1">
                Both production quantity target and quality inspection standards have been satisfied. Rolls approved for dispatch.
              </p>
            </div>
          )}

          {/* PART 1 & 2: STAGE-WISE PRODUCTION PIPELINE */}
          <div className="border border-slate-300 rounded p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wide text-[11px]">
                Stage-Wise Production Tracking
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                Spinning → Weaving → Dyeing → Finished Fabric
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 block">1. Spinning</span>
                <strong className="text-xs font-mono text-slate-900 block mt-0.5">
                  {stages.spinningQuantity.toLocaleString()} m
                </strong>
                <span className="text-[10px] text-slate-500">
                  {Math.round((stages.spinningQuantity / order.requiredQuantity) * 100)}% target
                </span>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 block">2. Weaving</span>
                <strong className="text-xs font-mono text-slate-900 block mt-0.5">
                  {stages.weavingQuantity.toLocaleString()} m
                </strong>
                <span className="text-[10px] text-slate-500">
                  {Math.round((stages.weavingQuantity / order.requiredQuantity) * 100)}% target
                </span>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 block">3. Dyeing</span>
                <strong className="text-xs font-mono text-slate-900 block mt-0.5">
                  {stages.dyeingQuantity.toLocaleString()} m
                </strong>
                <span className="text-[10px] text-slate-500">
                  {Math.round((stages.dyeingQuantity / order.requiredQuantity) * 100)}% target
                </span>
              </div>

              <div className="p-2 bg-blue-50/70 border border-blue-200 rounded">
                <span className="text-[10px] text-blue-900 font-semibold block">Finished Fabric</span>
                <strong className="text-xs font-mono text-blue-900 block mt-0.5">
                  {stages.finishedQuantity.toLocaleString()} m
                </strong>
                <span className="text-[10px] text-blue-700">
                  {progress}% fulfilled
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <span>
                *Finished fabric strictly equals final Dyeing stage output. Stages are not additive.
              </span>
              <span className="font-mono font-medium text-slate-800">
                Remaining to produce: {stages.remainingQuantity.toLocaleString()} m
              </span>
            </div>
          </div>

          {/* FINANCIAL INTEGRATION (FOR PERSON 3 - DISPATCH & FINANCE) */}
          <div className="border border-slate-300 rounded p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wide text-[11px]">
                Financial Valuation & Billing Summary
              </h4>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-medium">
                Person 3 Finance Export Ready
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 block">Unit Selling Price:</span>
                <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                  {formatINR(financials.unitPrice)}/m
                </span>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 block">Total Contract Value:</span>
                <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                  {formatINR(financials.totalContractValue)}
                </span>
              </div>

              <div className="p-2 bg-blue-50/50 border border-blue-200 rounded">
                <span className="text-[10px] text-blue-900 block">Finished Goods Value:</span>
                <span className="font-mono font-bold text-blue-900 text-xs mt-0.5 block">
                  {formatINR(financials.finishedGoodsValue)}
                </span>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 block">Remaining Contract:</span>
                <span className="font-mono font-bold text-slate-700 text-xs mt-0.5 block">
                  {formatINR(financials.remainingContractValue)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] mt-2 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-500 block">WIP Valuation (Yarn/Greige):</span>
                <strong className="font-mono text-slate-800">{formatINR(financials.wipValue)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Est. Material Costs:</span>
                <strong className="font-mono text-slate-800">{formatINR(financials.estimatedMaterialCost)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Projected Margin:</span>
                <strong className="font-mono text-emerald-800">
                  {formatINR(financials.projectedGrossMargin)} ({financials.marginPercentage}%)
                </strong>
              </div>
            </div>
          </div>

          {/* Specifications Table */}
          <div>
            <h4 className="font-semibold text-slate-900 text-xs mb-2 uppercase tracking-wide text-[11px]">
              Order Specifications
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs border border-slate-300 rounded p-3 bg-white">
              <div>
                <span className="text-slate-500 block text-[11px]">Fabric Type:</span>
                <span className="font-medium text-slate-900">{order.fabricType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Colour:</span>
                <span className="font-medium text-slate-900">{order.colour} ({order.colourHex})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Target Quantity:</span>
                <span className="font-medium text-slate-900">{order.requiredQuantity.toLocaleString()} {order.unit}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Assigned Equipment:</span>
                <span className="font-mono text-slate-800">
                  {order.assignedMachines.length > 0 ? order.assignedMachines.join(', ') : 'None assigned'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Current Stage:</span>
                <span className="font-medium text-slate-900">{order.currentStage}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Material Availability:</span>
                <span className="font-medium text-slate-900">{order.materialAvailability}</span>
              </div>
            </div>
          </div>

          {/* Quality Inspection History Records */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wide text-[11px]">
                Quality Inspection History ({qualityInfo.orderInspections.length})
              </h4>
              <span className="text-[10px] text-slate-500">
                Preserves all inspection logs & defect reasons
              </span>
            </div>

            {qualityInfo.orderInspections.length > 0 ? (
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-[11px] border-b border-slate-300 font-semibold">
                      <th className="py-2 px-3">Roll ID</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Inspector</th>
                      <th className="py-2 px-3">Result</th>
                      <th className="py-2 px-3">Defect</th>
                      <th className="py-2 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {qualityInfo.orderInspections.map((roll) => (
                      <tr key={roll.rollId} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-medium text-slate-900">
                          {roll.rollId}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                          {roll.inspectionDate}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {roll.inspectorName}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              roll.inspectionResult === 'Passed'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : roll.inspectionResult === 'Rework Required'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {roll.inspectionResult}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium">
                          {roll.defectType !== 'None (Flawless)' ? (
                            <span className="text-red-700 font-semibold">{roll.defectType}</span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600 italic text-[11px] max-w-xs truncate" title={roll.remarks}>
                          {roll.remarks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-500 italic text-[11px]">
                No quality inspection rolls recorded for this order yet.
              </div>
            )}
          </div>

          {/* Raw Materials Allocation */}
          <div>
            <h4 className="font-semibold text-slate-900 text-xs mb-2 uppercase tracking-wide text-[11px]">
              Material Stock Check
            </h4>
            {order.materialsRequired && order.materialsRequired.length > 0 ? (
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-[11px] border-b border-slate-300">
                      <th className="py-2 px-3">Material</th>
                      <th className="py-2 px-3 text-right">Required</th>
                      <th className="py-2 px-3 text-right">In Stock</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.materialsRequired.map((mat) => (
                      <tr key={mat.materialId}>
                        <td className="py-2 px-3">
                          <span className="font-medium text-slate-900">{mat.materialName}</span>
                          <span className="text-slate-400 font-mono text-[10px] ml-1">({mat.materialId})</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {mat.requiredAmount} {mat.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {mat.availableAmount} {mat.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-medium">
                          {mat.availableAmount >= mat.requiredAmount ? (
                            <span className="text-emerald-700">Available</span>
                          ) : (
                            <span className="text-amber-700">Deficit</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 italic text-[11px]">No specific raw material bill of materials mapped.</p>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <span className="text-slate-500 text-[11px] block mb-1">Production Notes:</span>
              <p className="p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-700 text-xs">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-300 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={btnSecondary}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
